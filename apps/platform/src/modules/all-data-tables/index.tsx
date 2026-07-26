import { TableOutlined } from '@ant-design/icons';
import { Alert, Card, Space, Table, Tag, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useMemo, useState } from 'react';

import { listDatatables } from '@/services/secretpad/DatatableController';
import { listNode } from '@/services/secretpad/NodeController';

import styles from './index.less';

interface AggregatedDataTable {
  datatableId?: string;
  datatableName?: string;
  status?: string;
  pushToTeeStatus?: string;
  datasourceName?: string;
  datasourceType?: string;
  nodeId?: string;
  nodeName?: string;
  authProjects?: API.AuthProjectVO[];
}

export const AllDataTablesComponent: React.FC = () => {
  const [data, setData] = useState<AggregatedDataTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [failedNodes, setFailedNodes] = useState<string[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setFailedNodes([]);
      try {
        const nodeRes = await listNode();
        // 节点列表可能包含重复 nodeId（如 center/edge 同步问题），按 nodeId 去重
        const nodes = ((nodeRes.data || []) as API.NodeVO[]).filter(
          (node, index, arr) =>
            arr.findIndex((n) => n.nodeId === node.nodeId) === index,
        );

        const tableMap = new Map<string, AggregatedDataTable>();
        const failures: string[] = [];

        await Promise.all(
          nodes.map(async (node) => {
            try {
              const res = await listDatatables({
                ownerId: node.nodeId,
                pageNumber: 1,
                pageSize: 1000,
              });
              const tables = (res.data?.datatableNodeVOList ||
                []) as API.DatatableNodeVO[];
              // 单个节点内部按 datatableId 去重（防止 DomainData 与 HTTP feature table 重复）
              const seenInNode = new Set<string>();
              tables.forEach((item) => {
                const table = item.datatableVO || {};
                const nodeId = item.nodeId || node.nodeId;
                const nodeName = item.nodeName || node.nodeName;
                const id = table.datatableId;
                if (!id) return;

                const nodeLocalKey = `${id}-${nodeId}`;
                if (seenInNode.has(nodeLocalKey)) return;
                seenInNode.add(nodeLocalKey);

                const globalKey = `${id}-${nodeId}-${table.datasourceType || 'LOCAL'}`;
                if (tableMap.has(globalKey)) return;
                tableMap.set(globalKey, {
                  datatableId: id,
                  datatableName: table.datatableName,
                  status: table.status,
                  pushToTeeStatus: table.pushToTeeStatus,
                  datasourceName: table.datasourceName,
                  datasourceType: table.datasourceType,
                  nodeId,
                  nodeName,
                  authProjects: table.authProjects,
                });
              });
            } catch (err) {
              failures.push(node.nodeName || node.nodeId || '');
            }
          }),
        );

        if (failures.length > 0) {
          setFailedNodes(failures);
        }
        setData(Array.from(tableMap.values()));
      } catch (err) {
        message.error('加载数据表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const nodeSummary = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((item) => {
      const name = item.nodeName || item.nodeId || '未知节点';
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => `${name}: ${count}`)
      .join('，');
  }, [data]);

  const columns: ColumnsType<AggregatedDataTable> = [
    {
      title: '数据表名',
      dataIndex: 'datatableName',
      key: 'datatableName',
      ellipsis: true,
      render: (text: string) => <Tooltip title={text}>{text}</Tooltip>,
    },
    {
      title: '所属节点',
      dataIndex: 'nodeName',
      key: 'nodeName',
      width: 140,
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: '数据源',
      key: 'datasource',
      width: 180,
      render: (_: unknown, record: AggregatedDataTable) => (
        <Space>
          <TableOutlined />
          {record.datasourceName || '-'}
          {record.datasourceType && <Tag>{record.datasourceType}</Tag>}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status?: string) => (
        <Tag color={status === 'Available' ? 'success' : 'default'}>
          {status || 'Unknown'}
        </Tag>
      ),
    },
    {
      title: 'TEE 推送',
      dataIndex: 'pushToTeeStatus',
      key: 'pushToTeeStatus',
      width: 120,
      render: (status?: string) => {
        if (!status) return '-';
        const color =
          status === 'SUCCESS'
            ? 'success'
            : status === 'FAILED'
            ? 'error'
            : 'processing';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: '已授权项目',
      dataIndex: 'authProjects',
      key: 'authProjects',
      ellipsis: true,
      render: (authProjects?: API.AuthProjectVO[]) =>
        authProjects && authProjects.length > 0 ? (
          <Tooltip title={authProjects.map((p) => p.name || p.projectId).join(', ')}>
            {authProjects.length} 个项目
          </Tooltip>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <div className={styles.allDataTables}>
      <div className={styles.pageTitle}>数据表</div>
      {failedNodes.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message={`以下节点数据表加载失败：${failedNodes.join('、')}`}
          style={{ marginBottom: 16 }}
        />
      )}
      {nodeSummary && <div className={styles.summary}>节点分布：{nodeSummary}</div>}
      <Card className={styles.tableCard} bordered={false}>
        <Table
          rowKey={(record) =>
            `${record.datatableId}-${record.nodeId}-${record.datasourceType || 'LOCAL'}`
          }
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};
