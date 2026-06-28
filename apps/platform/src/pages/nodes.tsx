import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Badge,
} from 'antd';
import React, { useState, useEffect } from 'react';

import * as NodeController from '@/services/secretpad/NodeController';

const { TextArea } = Input;

interface NodePageState {
  nodes: API.NodeVO[];
  loading: boolean;
  modalVisible: boolean;
  editingNode: API.NodeVO | null;
  currentPage: number;
  pageSize: number;
  total: number;
}

const NodesPage: React.FC = () => {
  const [state, setState] = useState<NodePageState>({
    nodes: [],
    loading: false,
    modalVisible: false,
    editingNode: null,
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const [form] = Form.useForm();

  useEffect(() => {
    loadNodes();
  }, [state.currentPage, state.pageSize]);

  const loadNodes = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      const request: API.PageNodeRequest = {
        page: state.currentPage,
        size: state.pageSize,
      };

      const response = await NodeController.page(request);

      if (response.status?.code === 0) {
        setState((prev) => ({
          ...prev,
          nodes: response.data?.list || [],
          total: response.data?.total || 0,
          loading: false,
        }));
      } else {
        message.error(response.status?.msg || 'Failed to load nodes');
        setState((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error loading nodes:', error);
      message.error('Failed to load nodes');
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleCreateOrUpdate = async (values: any) => {
    try {
      let response;

      if (state.editingNode) {
        // Update existing node (only netAddress can be updated)
        const updateRequest: API.UpdateNodeRequest = {
          nodeId: state.editingNode.nodeId!,
          netAddress: values.address,
        };

        response = await NodeController.update(updateRequest);
      } else {
        // Create new node
        const nodeTypeToMode: Record<string, number> = {
          MPC: 1,
          TEE: 2,
          'MPC&TEE': 4,
        };
        const createRequest: API.CreateNodeRequest = {
          name: values.name,
          mode: nodeTypeToMode[values.nodeType] || 1,
        };

        response = await NodeController.createNode(createRequest);
      }

      if (response.status?.code === 0) {
        message.success(
          `${state.editingNode ? 'Updated' : 'Created'} node successfully`,
        );
        setState((prev) => ({ ...prev, modalVisible: false }));
        form.resetFields();
        loadNodes();
      } else {
        message.error(
          response.status?.msg ||
            `Failed to ${state.editingNode ? 'update' : 'create'} node`,
        );
      }
    } catch (error) {
      console.error(
        `Error ${state.editingNode ? 'updating' : 'creating'} node:`,
        error,
      );
      message.error(`Failed to ${state.editingNode ? 'update' : 'create'} node`);
    }
  };

  const handleDelete = async (nodeId: string) => {
    try {
      const response = await NodeController.deleteNode({ nodeId });

      if (response.status?.code === 0) {
        message.success('Node deleted successfully');
        loadNodes();
      } else {
        message.error(response.status?.msg || 'Failed to delete node');
      }
    } catch (error) {
      console.error('Error deleting node:', error);
      message.error('Failed to delete node');
    }
  };

  const handleRefresh = async (nodeId: string) => {
    try {
      const response = await NodeController.refresh({ nodeId });

      if (response.status?.code === 0) {
        message.success('Node refreshed successfully');
        loadNodes();
      } else {
        message.error(response.status?.msg || 'Failed to refresh node');
      }
    } catch (error) {
      console.error('Error refreshing node:', error);
      message.error('Failed to refresh node');
    }
  };

  const handleEdit = (record: API.NodeVO) => {
    setState((prev) => ({ ...prev, editingNode: record, modalVisible: true }));
    form.setFieldsValue({
      name: record.nodeName,
      address: record.netAddress,
      description: record.description,
      nodeType: record.type,
    });
  };

  const handleAdd = () => {
    setState((prev) => ({ ...prev, editingNode: null, modalVisible: true }));
    form.resetFields();
  };

  const columns = [
    {
      title: 'Node ID',
      dataIndex: 'nodeId',
      key: 'nodeId',
      width: 200,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{text}</span>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'nodeName',
      key: 'nodeName',
    },
    {
      title: 'Address',
      dataIndex: 'netAddress',
      key: 'netAddress',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'TEE' ? 'orange' : type === 'MPC' ? 'blue' : 'green'}>
          {type || 'Unknown'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'nodeStatus',
      key: 'nodeStatus',
      render: (status: string) => {
        let color = 'default';
        if (status === 'READY') color = 'success';
        else if (status === 'NOT_READY') color = 'error';
        else if (status === 'CONNECTING') color = 'processing';

        return <Badge status={color as any} text={status} />;
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: API.NodeVO) => (
        <Space size="middle">
          <Button
            size="small"
            icon={<SyncOutlined />}
            onClick={() => handleRefresh(record.nodeId!)}
            title="Refresh Status"
          />
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Edit"
          />
          <Popconfirm
            title="Delete the node"
            description="Are you sure to delete this node? This action cannot be undone."
            onConfirm={() => handleDelete(record.nodeId!)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger icon={<DeleteOutlined />} title="Delete" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Node Management"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Node
          </Button>
        }
      >
        <Table
          dataSource={state.nodes}
          columns={columns}
          rowKey="nodeId"
          loading={state.loading}
          pagination={{
            current: state.currentPage,
            pageSize: state.pageSize,
            total: state.total,
            onChange: (page, pageSize) => {
              setState((prev) => ({ ...prev, currentPage: page, pageSize }));
            },
          }}
        />
      </Card>

      <Modal
        title={state.editingNode ? 'Edit Node' : 'Add Node'}
        open={state.modalVisible}
        onCancel={() => {
          setState((prev) => ({ ...prev, modalVisible: false, editingNode: null }));
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateOrUpdate}>
          <Form.Item
            name="name"
            label="Node Name"
            rules={[{ required: true, message: 'Please enter node name' }]}
          >
            <Input placeholder="Enter node name" />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: 'Please enter node address' }]}
          >
            <Input placeholder="Enter node address (e.g., https://node.example.com)" />
          </Form.Item>

          <Form.Item
            name="nodeType"
            label="Node Type"
            rules={[{ required: true, message: 'Please select node type' }]}
          >
            <Select placeholder="Select node type">
              <Select.Option value="MPC">MPC (Multi-Party Computation)</Select.Option>
              <Select.Option value="TEE">
                TEE (Trusted Execution Environment)
              </Select.Option>
              <Select.Option value="TRUSTED">Trusted Node</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={4} placeholder="Enter node description" />
          </Form.Item>

          {!state.editingNode && (
            <>
              <Form.Item
                name="cert"
                label="Certificate"
                rules={[{ required: true, message: 'Please enter certificate' }]}
              >
                <TextArea rows={4} placeholder="Enter certificate content" />
              </Form.Item>

              <Form.Item
                name="privateKey"
                label="Private Key"
                rules={[{ required: true, message: 'Please enter private key' }]}
              >
                <TextArea rows={4} placeholder="Enter private key content" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default NodesPage;
