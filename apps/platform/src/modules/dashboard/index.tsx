import {
  ProjectOutlined,
  ClusterOutlined,
  TableOutlined,
  ApartmentOutlined,
  ArrowUpOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import { Card, Col, Progress, Row, Space, Tag } from 'antd';
import React, { useEffect, useState } from 'react';

import platformConfig from '@/platform.config';
import { listNode } from '@/services/secretpad/NodeController';
import { listProject } from '@/services/secretpad/ProjectController';

import styles from './index.less';

interface StatItem {
  label: string;
  value: number;
  trend: string;
  icon: React.ReactNode;
}

interface ProjectVO {
  projectId?: string;
  projectName?: string;
  gmtCreate?: string;
}

interface NodeVO {
  nodeId?: string;
  nodeName?: string;
  nodeStatus?: string;
}

export const DashboardComponent: React.FC = () => {
  const [stats, setStats] = useState<StatItem[]>([
    { label: 'Projects', value: 0, trend: '— 持平', icon: <ProjectOutlined /> },
    { label: 'Nodes', value: 0, trend: '— 持平', icon: <ClusterOutlined /> },
    { label: 'Data Tables', value: 0, trend: '— 持平', icon: <TableOutlined /> },
    { label: 'Graphs', value: 0, trend: '— 持平', icon: <ApartmentOutlined /> },
  ]);
  const [recentProjects, setRecentProjects] = useState<ProjectVO[]>([]);
  const [recentNodes, setRecentNodes] = useState<NodeVO[]>([]);
  const [health] = useState([
    { label: 'CPU', value: 45, status: 'normal' },
    { label: 'Memory', value: 60, status: 'normal' },
    { label: 'Disk', value: 75, status: 'warning' },
    { label: 'Network', value: 90, status: 'success' },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [nodeRes, projectRes] = await Promise.all([listNode(), listProject()]);

        const nodes = (nodeRes.data || []) as NodeVO[];
        const projects = (projectRes.data || []) as ProjectVO[];

        setStats((prev) =>
          prev.map((item) => {
            if (item.label === 'Nodes') {
              return {
                ...item,
                value: nodes.length,
                trend: nodes.length > 0 ? '↑ 健康运行' : '— 持平',
                icon: <ClusterOutlined />,
              };
            }
            if (item.label === 'Projects') {
              return {
                ...item,
                value: projects.length,
                trend: projects.length > 0 ? '↑ 较上月' : '— 持平',
                icon: <ProjectOutlined />,
              };
            }
            return item;
          }),
        );

        setRecentProjects(projects.slice(0, 4));
        setRecentNodes(nodes.slice(0, 4));
      } catch (e) {
        // 静默失败，使用占位数据
      }
    };

    fetchData();
  }, []);

  const formatDate = (ts?: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageTitle}>{platformConfig.home.HomePageTitle}</div>

      <Row gutter={[20, 20]} className={styles.statRow}>
        {stats.map((stat) => (
          <Col xs={24} sm={12} lg={6} key={stat.label}>
            <Card className={styles.statCard} bordered={false} hoverable>
              <div className={styles.statIcon}>{stat.icon}</div>
              <div className={styles.statLabel}>{stat.label}</div>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statTrend}>
                {stat.trend.startsWith('↑') ? <ArrowUpOutlined /> : <MinusOutlined />}{' '}
                {stat.trend.replace('↑ ', '')}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={12}>
          <Card title="Recent Projects" className={styles.listCard} bordered={false}>
            {recentProjects.length === 0 ? (
              <div className={styles.empty}>暂无项目</div>
            ) : (
              recentProjects.map((project) => (
                <div className={styles.listItem} key={project.projectId}>
                  <span>{project.projectName || project.projectId}</span>
                  <span className={styles.listMeta}>
                    {formatDate(project.gmtCreate)}
                  </span>
                </div>
              ))
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Recent Nodes" className={styles.listCard} bordered={false}>
            {recentNodes.length === 0 ? (
              <div className={styles.empty}>暂无节点</div>
            ) : (
              recentNodes.map((node) => (
                <div className={styles.listItem} key={node.nodeId}>
                  <Space>
                    {node.nodeName || node.nodeId}
                    <Tag color={node.nodeStatus === 'Healthy' ? 'success' : 'warning'}>
                      {node.nodeStatus || 'Healthy'}
                    </Tag>
                  </Space>
                </div>
              ))
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]} className={styles.healthRow}>
        <Col span={24}>
          <Card title="System Health" className={styles.healthCard} bordered={false}>
            <Row gutter={[40, 24]}>
              {health.map((item) => (
                <Col xs={24} sm={12} md={6} key={item.label}>
                  <div className={styles.healthItem}>
                    <div className={styles.healthHeader}>
                      <span>{item.label}</span>
                      <span
                        className={
                          item.status === 'warning'
                            ? styles.warning
                            : item.status === 'success'
                            ? styles.success
                            : styles.normal
                        }
                      >
                        {item.value}%
                      </span>
                    </div>
                    <Progress
                      percent={item.value}
                      showInfo={false}
                      strokeColor={
                        item.status === 'warning'
                          ? '#ff9500'
                          : item.status === 'success'
                          ? '#34c759'
                          : '#0071e3'
                      }
                      trailColor="rgba(0,0,0,0.06)"
                    />
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
