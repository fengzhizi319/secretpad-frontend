import { DatabaseOutlined } from '@ant-design/icons';
import { Card, Space, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';

import { list } from '@/services/secretpad/DataSourceController';
import { listNode } from '@/services/secretpad/NodeController';

import styles from './index.less';

interface AggregatedDataSource {
  datasourceId?: string;
  name?: string;
  type?: string;
  nodeId?: string;
  nodeName?: string;
  status?: string;
  relatedDatas?: string[];
}

export const AllDataSourcesComponent: React.FC = () => {
  const [data, setData] = useState<AggregatedDataSource[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const nodeRes = await listNode();
        const nodes = (nodeRes.data || []) as API.NodeVO[];

        const allSources: AggregatedDataSource[] = [];
        await Promise.all(
          nodes.map(async (node) => {
            const res = await list({
              ownerId: node.nodeId,
              page: 1,
              size: 1000,
            });
            const sources = (res.data?.infos ||
              []) as API.DatasourceListInfoAggregate[];
            sources.forEach((source) => {
              // 去重：同一数据源在多个节点可能出现，按 datasourceId + nodeId 聚合
              const relatedNode = source.nodes?.find((n) => n.nodeId === node.nodeId);
              allSources.push({
                datasourceId: source.datasourceId,
                name: source.name,
                type: source.type,
                nodeId: node.nodeId,
                nodeName: relatedNode?.nodeName || node.nodeName,
                status: relatedNode?.status,
                relatedDatas: source.relatedDatas,
              });
            });
          }),
        );
        setData(allSources);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const columns: ColumnsType<AggregatedDataSource> = [
    {
      title: '数据源名',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (text: string) => <Tooltip title={text}>{text}</Tooltip>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
    },
    {
      title: '所属节点',
      dataIndex: 'nodeName',
      key: 'nodeName',
      width: 140,
      render: (text: string) => <Tag>{text}</Tag>,
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
      title: '已绑定数据表',
      dataIndex: 'relatedDatas',
      key: 'relatedDatas',
      ellipsis: true,
      render: (relatedDatas?: string[]) =>
        relatedDatas && relatedDatas.length > 0 ? (
          <Tooltip title={relatedDatas.join(', ')}>
            <Space size={4}>
              <DatabaseOutlined />
              {relatedDatas.length} 个
            </Space>
          </Tooltip>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <div className={styles.allDataSources}>
      <div className={styles.pageTitle}>数据源</div>
      <Card className={styles.tableCard} bordered={false}>
        <Table
          rowKey={(record) => `${record.datasourceId}-${record.nodeId}`}
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};
