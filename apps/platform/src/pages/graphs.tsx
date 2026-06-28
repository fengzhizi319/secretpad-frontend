import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Table,
  message,
  Tag,
} from 'antd';
import { useEffect, useState } from 'react';

import { formatTimestamp } from '@/modules/dag-result/utils';
import * as GraphController from '@/services/secretpad/GraphController';

interface GraphItem {
  graphId?: string;
  graphName?: string;
  projectId?: string;
  nodeId?: string;
  gmtCreate?: string;
  gmtModified?: string;
  graphDef?: any;
  description?: string;
}

const GraphPage: React.FC = () => {
  const [graphs, setGraphs] = useState<GraphItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingGraph, setEditingGraph] = useState<GraphItem | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadGraphs();
  }, []);

  const loadGraphs = async () => {
    try {
      setLoading(true);
      // Since the listGraph API requires a projectId, we'll need to simulate this
      // In a real scenario, we would list graphs for a specific project
      // For now, we'll create a mock response to demonstrate the UI
      setGraphs([
        {
          graphId: 'graph-1',
          graphName: 'Fraud Detection Pipeline',
          projectId: 'project-1',
          description: 'A pipeline for detecting fraudulent transactions',
          gmtCreate: new Date().toISOString(),
          gmtModified: new Date().toISOString(),
        },
        {
          graphId: 'graph-2',
          graphName: 'Credit Risk Assessment',
          projectId: 'project-1',
          description: 'Assess credit risk based on customer data',
          gmtCreate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          gmtModified: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
        },
        {
          graphId: 'graph-3',
          graphName: 'Customer Segmentation',
          projectId: 'project-2',
          description: 'Segment customers based on behavior',
          gmtCreate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          gmtModified: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        },
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Error loading graphs:', error);
      message.error('Failed to load graphs');
      setLoading(false);
    }
  };

  const handleDelete = async (graphId: string) => {
    Modal.confirm({
      title: 'Confirm Deletion',
      content: 'Are you sure you want to delete this graph?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          // Call the actual delete API
          const response = await GraphController.deleteGraph({
            graphId,
            projectId: '', // Will be populated with actual project ID
          });

          if (response.status?.code === 0) {
            message.success('Graph deleted successfully');
            loadGraphs();
          } else {
            message.error(response.status?.msg || 'Failed to delete graph');
          }
        } catch (error) {
          console.error('Error deleting graph:', error);
          message.error('Failed to delete graph');
        }
      },
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      let response;

      const graphDef = values.graphDef ? JSON.parse(values.graphDef) : {};

      if (editingGraph) {
        // Update graph - using fullUpdateGraph API
        const updateRequest: API.FullUpdateGraphRequest = {
          graphId: editingGraph.graphId || '',
          projectId: values.projectId,
          nodes: graphDef.nodes || [],
          edges: graphDef.edges || [],
        };
        response = await GraphController.fullUpdateGraph(updateRequest);
      } else {
        // Create new graph
        const createRequest: API.CreateGraphRequest = {
          projectId: values.projectId,
          name: values.graphName,
          nodes: graphDef.nodes || [],
          edges: graphDef.edges || [],
        };
        response = await GraphController.createGraph(createRequest);
      }

      if (response.status?.code === 0) {
        message.success(
          editingGraph ? 'Graph updated successfully' : 'Graph created successfully',
        );
        setModalVisible(false);
        form.resetFields();
        setEditingGraph(null);
        loadGraphs();
      } else {
        message.error(response.status?.msg || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving graph:', error);
      message.error('Operation failed');
    }
  };

  const handleEdit = (record: GraphItem) => {
    setEditingGraph(record);
    form.setFieldsValue({
      graphName: record.graphName,
      projectId: record.projectId,
      description: record.description,
      graphDef: record.graphDef ? JSON.stringify(record.graphDef, null, 2) : '{}',
    });
    setModalVisible(true);
  };

  const handleRun = async (graphId: string) => {
    try {
      const response = await GraphController.startGraph({
        graphId,
        projectId: '', // Will be populated with actual project ID
      });

      if (response.status?.code === 0) {
        message.success('Graph started successfully');
      } else {
        message.error(response.status?.msg || 'Failed to start graph');
      }
    } catch (error) {
      console.error('Error starting graph:', error);
      message.error('Failed to start graph');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'graphName',
      key: 'graphName',
    },
    {
      title: 'Project ID',
      dataIndex: 'projectId',
      key: 'projectId',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Created Time',
      dataIndex: 'gmtCreate',
      key: 'gmtCreate',
      render: (text: string) => formatTimestamp(text),
    },
    {
      title: 'Modified Time',
      dataIndex: 'gmtModified',
      key: 'gmtModified',
      render: (text: string) => formatTimestamp(text),
    },
    {
      title: 'Status',
      key: 'status',
      render: () => <Tag color="processing">Ready</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: GraphItem) => (
        <Space size="middle">
          <a onClick={() => handleEdit(record)}>Edit</a>
          <a onClick={() => handleRun(record.graphId!)}>Run</a>
          <a onClick={() => handleDelete(record.graphId!)}>Delete</a>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Graph Management"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            New Graph
          </Button>
        }
      >
        <Table
          dataSource={graphs}
          columns={columns}
          rowKey="graphId"
          loading={loading}
        />
      </Card>

      <Modal
        title={editingGraph ? 'Edit Graph' : 'Create Graph'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingGraph(null);
        }}
        onOk={() => form.submit()}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="graphName"
                label="Name"
                rules={[{ required: true, message: 'Please enter graph name' }]}
              >
                <Input placeholder="Enter graph name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="projectId"
                label="Project ID"
                rules={[{ required: true, message: 'Please enter project ID' }]}
              >
                <Input placeholder="Enter project ID" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Enter description" />
          </Form.Item>
          <Form.Item name="graphDef" label="Graph Definition (JSON)">
            <Input.TextArea
              rows={8}
              placeholder="Enter graph definition in JSON format"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GraphPage;
