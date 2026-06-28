import {
  AppstoreOutlined,
  DatabaseOutlined,
  TeamOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import { Card, Row, Col, Statistic, Table, Space, Tag, Progress, Badge } from 'antd';
import React, { useEffect, useState } from 'react';
import { Link } from 'umi';

import * as NodeController from '@/services/secretpad/NodeController';
import * as ProjectController from '@/services/secretpad/ProjectController';

interface DashboardStats {
  projects: number;
  nodes: number;
  dataTables: number;
  graphs: number;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    projects: 0,
    nodes: 0,
    dataTables: 0,
    graphs: 0,
  });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [recentNodes, setRecentNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load projects
      const projectResponse = await ProjectController.listProject();
      if (projectResponse.status?.code === 0) {
        const projects = projectResponse.data || [];
        setStats((prev) => ({ ...prev, projects: projects.length }));
        // Show recent 5 projects
        setRecentProjects(projects.slice(0, 5));
      }

      // Load nodes (using list instead of page for simplicity)
      try {
        const nodeResponse = await NodeController.listNode();
        if (nodeResponse.status?.code === 0) {
          const nodes = nodeResponse.data || [];
          setStats((prev) => ({ ...prev, nodes: nodes.length }));
          // Show recent 5 nodes
          setRecentNodes(nodes.slice(0, 5));
        }
      } catch (error) {
        console.warn('Could not load nodes:', error);
        // Fallback to a simple count
        setStats((prev) => ({ ...prev, nodes: 0 }));
      }

      // Mock data tables and graphs counts (since API requires specific IDs)
      setStats((prev) => ({
        ...prev,
        dataTables: 12, // Placeholder value
        graphs: 8, // Placeholder value
      }));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const projectColumns = [
    {
      title: 'Project Name',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (text: string, record: any) => (
        <Link to={`/dag?projectId=${record.projectId}&mode=MPC`}>{text}</Link>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Compute Mode',
      dataIndex: 'computeMode',
      key: 'computeMode',
      render: (mode: string) => (
        <Tag color={mode === 'TEE' ? 'orange' : 'blue'}>{mode || 'MPC'}</Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: () => <Badge status="processing" text="Active" />,
    },
  ];

  const nodeColumns = [
    {
      title: 'Node Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: 'Type',
      dataIndex: 'nodeType',
      key: 'nodeType',
      render: (type: string) => (
        <Tag color={type === 'TEE' ? 'orange' : 'blue'}>{type || 'MPC'}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'READY') color = 'success';
        else if (status === 'NOT_READY') color = 'error';
        else if (status === 'CONNECTING') color = 'processing';

        return <Badge status={color as any} text={status || 'UNKNOWN'} />;
      },
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
          Federated Learning Dashboard
        </h1>
        <p style={{ color: '#666' }}>
          Overview of your federated learning infrastructure
        </p>
      </div>

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Link to="/home">
            <Card>
              <Statistic
                title={
                  <Space>
                    <AppstoreOutlined style={{ color: '#1890ff' }} />
                    <span>Projects</span>
                  </Space>
                }
                value={stats.projects}
                valueStyle={{ color: '#3f8600' }}
                prefix={<ProjectOutlined />}
              />
            </Card>
          </Link>
        </Col>
        <Col span={6}>
          <Link to="/nodes">
            <Card>
              <Statistic
                title={
                  <Space>
                    <TeamOutlined style={{ color: '#52c41a' }} />
                    <span>Nodes</span>
                  </Space>
                }
                value={stats.nodes}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Link>
        </Col>
        <Col span={6}>
          <Link to="/data-table">
            <Card>
              <Statistic
                title={
                  <Space>
                    <DatabaseOutlined style={{ color: '#722ed1' }} />
                    <span>Data Tables</span>
                  </Space>
                }
                value={stats.dataTables}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Link>
        </Col>
        <Col span={6}>
          <Link to="/graphs">
            <Card>
              <Statistic
                title={
                  <Space>
                    <AppstoreOutlined style={{ color: '#fa8c16' }} />
                    <span>Graphs</span>
                  </Space>
                }
                value={stats.graphs}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Link>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={14}>
          <Card
            title="Recent Projects"
            extra={<Link to="/home">View All</Link>}
            loading={loading}
          >
            <Table
              dataSource={recentProjects}
              columns={projectColumns}
              rowKey="projectId"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="System Health" loading={loading}>
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <span>CPU Usage</span>
                <span>42%</span>
              </div>
              <Progress percent={42} strokeColor="#52c41a" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <span>Memory Usage</span>
                <span>65%</span>
              </div>
              <Progress percent={65} strokeColor="#1890ff" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <span>Disk Usage</span>
                <span>30%</span>
              </div>
              <Progress percent={30} strokeColor="#722ed1" />
            </div>
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <span>Network Traffic</span>
                <span>Low</span>
              </div>
              <Tag color="green">Normal</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: '16px' }}>
        <Col span={14}>
          <Card
            title="Connected Nodes"
            extra={<Link to="/nodes">View All</Link>}
            loading={loading}
          >
            <Table
              dataSource={recentNodes}
              columns={nodeColumns}
              rowKey="nodeId"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="Quick Actions" loading={loading}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Link to="/home?tab=node-management">
                <Card
                  hoverable
                  style={{ width: '100%', textAlign: 'center' }}
                  cover={
                    <TeamOutlined
                      style={{
                        fontSize: '24px',
                        margin: '16px auto',
                        display: 'block',
                      }}
                    />
                  }
                >
                  <Card.Meta
                    title="Register Node"
                    description="Connect a new federated learning node"
                  />
                </Card>
              </Link>
              <Link to="/home?tab=project-management">
                <Card
                  hoverable
                  style={{ width: '100%', textAlign: 'center' }}
                  cover={
                    <ProjectOutlined
                      style={{
                        fontSize: '24px',
                        margin: '16px auto',
                        display: 'block',
                      }}
                    />
                  }
                >
                  <Card.Meta
                    title="New Project"
                    description="Create a new federated learning project"
                  />
                </Card>
              </Link>
              <Link to="/data-source">
                <Card
                  hoverable
                  style={{ width: '100%', textAlign: 'center' }}
                  cover={
                    <DatabaseOutlined
                      style={{
                        fontSize: '24px',
                        margin: '16px auto',
                        display: 'block',
                      }}
                    />
                  }
                >
                  <Card.Meta
                    title="Add Data Source"
                    description="Connect to a new data source"
                  />
                </Card>
              </Link>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
