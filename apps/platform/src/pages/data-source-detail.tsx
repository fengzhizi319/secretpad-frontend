import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Descriptions,
  Table,
  Tag,
  Space,
  message,
  Popconfirm,
  Form,
  Input,
  Select,
} from 'antd';
import React, { useState, useEffect } from 'react';
import { history, useParams } from 'umi';

import * as DataSourceController from '@/services/secretpad/DataSourceController';

const { TextArea } = Input;

const DataSourceDetailPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [dataSource, setDataSource] = useState<API.DatasourceDetailAggregateVO | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [editing, setEditing] = useState<boolean>(false);
  const [editForm] = Form.useForm();

  useEffect(() => {
    loadDataSourceDetail();
  }, [id]);

  const loadDataSourceDetail = async () => {
    try {
      setLoading(true);
      const response = await DataSourceController.detail({
        datasourceId: id || '',
        ownerId: '', // This would come from user context
      });

      if (response.status?.code === 0) {
        setDataSource(response.data || null);
        if (editing) {
          editForm.setFieldsValue({
            name: response.data?.name,
            description: response.data?.info?.description,
            type: response.data?.type,
            endpoint: response.data?.info?.endpoint,
            username: response.data?.info?.username,
            database: response.data?.info?.database,
          });
        }
      } else {
        message.error(response.status?.msg || 'Failed to load data source');
      }
    } catch (error) {
      console.error('Error loading data source:', error);
      message.error('Failed to load data source');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await DataSourceController.deleteUsingPOST({
        datasourceId: id || '',
        ownerId: '', // This would come from user context
      });

      if (response.status?.code === 0) {
        message.success('Data source deleted successfully');
        history.push('/data-source');
      } else {
        message.error(response.status?.msg || 'Failed to delete data source');
      }
    } catch (error) {
      console.error('Error deleting data source:', error);
      message.error('Failed to delete data source');
    }
  };

  const handleEditToggle = () => {
    if (editing) {
      // Save changes
      handleSave();
    } else {
      setEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      const values = await editForm.validateFields();

      // In a real scenario, we'd have an update API
      // For now, we'll recreate the data source
      const request: API.CreateDatasourceRequest = {
        name: values.name,
        type: values.type,
        dataSourceInfo: {
          endpoint: values.endpoint,
          username: values.username,
          database: values.database,
          description: values.description,
        },
        ownerId: '', // This would come from user context
      };

      const response = await DataSourceController.create(request);

      if (response.status?.code === 0) {
        message.success('Data source updated successfully');
        setEditing(false);
        loadDataSourceDetail(); // Reload the updated data
      } else {
        message.error(response.status?.msg || 'Failed to update data source');
      }
    } catch (error) {
      console.error('Error saving data source:', error);
      message.error('Validation failed');
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    loadDataSourceDetail(); // Reload to discard changes
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => history.push('/data-source')}
        >
          Back to Data Sources
        </Button>
      </div>

      <Card
        title={
          <Space>
            {dataSource?.name}
            <Tag color={dataSource?.type === 'MYSQL' ? 'blue' : 'green'}>
              {dataSource?.type}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={handleEditToggle}
              type={editing ? 'default' : 'primary'}
            >
              {editing ? 'Save' : 'Edit'}
            </Button>
            <Popconfirm
              title="Delete the data source"
              description="Are you sure to delete this data source? This action cannot be undone."
              onConfirm={handleDelete}
              okText="Yes"
              cancelText="No"
            >
              <Button danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        }
      >
        {editing ? (
          <Form
            form={editForm}
            layout="vertical"
            initialValues={{
              name: dataSource?.name,
              description: dataSource?.info?.description,
              type: dataSource?.type,
              endpoint: dataSource?.info?.endpoint,
              username: dataSource?.info?.username,
              database: dataSource?.info?.database,
            }}
          >
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: 'Please enter data source name' }]}
            >
              <Input placeholder="Enter data source name" />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <TextArea rows={4} placeholder="Enter data source description" />
            </Form.Item>

            <Form.Item
              name="type"
              label="Type"
              rules={[{ required: true, message: 'Please select data source type' }]}
            >
              <Select placeholder="Select data source type">
                <Select.Option value="MYSQL">MySQL</Select.Option>
                <Select.Option value="OCEANBASE">OceanBase</Select.Option>
                <Select.Option value="HIVE">Hive</Select.Option>
                <Select.Option value="ODPS">ODPS</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="endpoint" label="Endpoint">
              <Input placeholder="Enter endpoint (e.g., host:port)" />
            </Form.Item>

            <Form.Item name="username" label="Username">
              <Input placeholder="Enter username" />
            </Form.Item>

            <Form.Item name="database" label="Database">
              <Input placeholder="Enter database name" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" onClick={handleSave}>
                  Save Changes
                </Button>
                <Button onClick={handleCancelEdit}>Cancel</Button>
              </Space>
            </Form.Item>
          </Form>
        ) : (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Name">{dataSource?.name}</Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag color={dataSource?.type === 'MYSQL' ? 'blue' : 'green'}>
                {dataSource?.type}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>
              {dataSource?.info?.description || 'No description provided'}
            </Descriptions.Item>
            <Descriptions.Item label="Endpoint">
              {dataSource?.info?.endpoint || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Username">
              {dataSource?.info?.username || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Database">
              {dataSource?.info?.database || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Status" span={2}>
              {dataSource?.status || 'N/A'}
            </Descriptions.Item>
          </Descriptions>
        )}

        {/* Related Data Tables */}
        <div style={{ marginTop: '24px' }}>
          <h3>Data Tables in this Source</h3>
          <Table
            columns={[
              {
                title: 'Table Name',
                dataIndex: 'tableName',
                key: 'tableName',
              },
              {
                title: 'Schema',
                dataIndex: 'schema',
                key: 'schema',
              },
              {
                title: 'Description',
                dataIndex: 'description',
                key: 'description',
              },
              {
                title: 'Actions',
                key: 'actions',
                render: () => (
                  <Space>
                    <Button size="small" type="link">
                      View Details
                    </Button>
                    <Button size="small" type="link">
                      Add to Project
                    </Button>
                  </Space>
                ),
              },
            ]}
            dataSource={[]}
            pagination={false}
            rowKey="tableName"
          />
        </div>
      </Card>
    </div>
  );
};

export default DataSourceDetailPage;
