import { TableOutlined } from '@ant-design/icons';
import { Card, Space, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';

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

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const nodeRes = await listNode();
        const nodes = (nodeRes.data || []) as API.NodeVO[];

        const allTables: AggregatedDataTable[] = [];
        await Promise.all(
          nodes.map(async (node) => {
            const res = await listDatatables({
              ownerId: node.nodeId,
              pageNumber: 1,
              pageSize: 1000,
            });
            const tables = (res.data?.datatableNodeVOList ||
              []) as API.DatatableNodeVO[];
            tables.forEach((item) => {
              const table = item.datatableVO || {};
              allTables.push({
                datatableId: table.datatableId,
                datatableName: table.datatableName,
                status: table.status,
                pushToTeeStatus: table.pushToTeeStatus,
                datasourceName: table.datasourceName,
                datasourceType: table.datasourceType,
                nodeId: item.nodeId,
                nodeName: item.nodeName,
                authProjects: table.authProjects,
              });
            });
          }),
        );
        setData(allTables);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

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
      <Card className={styles.tableCard} bordered={false}>
        <Table
          rowKey={(record) => `${record.datatableId}-${record.nodeId}`}
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};
