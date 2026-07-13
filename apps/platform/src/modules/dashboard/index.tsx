import {
  ProjectOutlined,
  ClusterOutlined,
  TableOutlined,
  ApartmentOutlined,
  ArrowUpOutlined,
  MinusOutlined,
  FileProtectOutlined,
} from '@ant-design/icons';
import { Card, Col, Row, Space, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import { history } from 'umi';

import { LoginService } from '@/modules/login/login.service';
import { ResultManagerService } from '@/modules/result-manager/result-manager.service';
import platformConfig from '@/platform.config';
import { listNode } from '@/services/secretpad/NodeController';
import { listProject } from '@/services/secretpad/ProjectController';
import { useModel } from '@/util/valtio-helper';

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
  const loginService = useModel(LoginService);
  const resultManagerService = useModel(ResultManagerService);
  const [stats, setStats] = useState<StatItem[]>([
    { label: 'Projects', value: 0, trend: '— 持平', icon: <ProjectOutlined /> },
    { label: 'Nodes', value: 0, trend: '— 持平', icon: <ClusterOutlined /> },
    { label: 'Data Tables', value: 0, trend: '— 持平', icon: <TableOutlined /> },
    { label: 'Graphs', value: 0, trend: '— 持平', icon: <ApartmentOutlined /> },
    { label: 'Results', value: 0, trend: '— 持平', icon: <FileProtectOutlined /> },
  ]);
  const [recentProjects, setRecentProjects] = useState<ProjectVO[]>([]);
  const [recentNodes, setRecentNodes] = useState<NodeVO[]>([]);
  const [resultOwnerId, setResultOwnerId] = useState<string>(
    loginService.userInfo?.ownerId || 'kuscia-system',
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [nodeRes, projectRes] = await Promise.all([listNode(), listProject()]);

        const nodes = (nodeRes.data || []) as NodeVO[];
        const projects = (projectRes.data || []) as ProjectVO[];

        // 结果按首个可用节点统计；CENTER 管理员默认 ownerId 为 kuscia-system 时没有结果
        const currentResultOwnerId =
          nodes[0]?.nodeId || loginService.userInfo?.ownerId || 'kuscia-system';
        setResultOwnerId(currentResultOwnerId);
        const resultRes = await resultManagerService.getResultList(
          currentResultOwnerId,
          1,
          1,
          '',
          [],
          '',
          null,
        );
        const resultTotal = resultRes?.totalNodeResultNums || 0;

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
            if (item.label === 'Results') {
              return {
                ...item,
                value: resultTotal,
                trend: resultTotal > 0 ? '↑ 新增结果' : '— 持平',
                icon: <FileProtectOutlined />,
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
            <Card
              className={styles.statCard}
              bordered={false}
              hoverable
              onClick={() => {
                if (stat.label === 'Results') {
                  history.push(`/node?ownerId=${resultOwnerId}&tab=result`);
                }
              }}
            >
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
    </div>
  );
};
