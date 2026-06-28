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
} from 'antd';
import { useEffect, useState } from 'react';

import { formatTimestamp } from '@/modules/dag-result/utils';
import * as DataSourceController from '@/services/secretpad/DataSourceController';

interface DataSourceItem {
  datasourceId?: string;
  datasourceName?: string;
  datasourceType?: string;
  ownerId?: string;
  gmtCreate?: string;
  gmtModified?: string;
  definition?: any;
}

const DataSourcePage: React.FC = () => {
  const [dataSources, setDataSources] = useState<DataSourceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingDataSource, setEditingDataSource] = useState<DataSourceItem | null>(
    null,
  );
  const [form] = Form.useForm();

  useEffect(() => {
    loadDataSourceList();
  }, []);

  const loadDataSourceList = async () => {
    try {
      setLoading(true);
      const response = await DataSourceController.list({
        ownerId: '', // Will be populated with current user's node ID
      });

      if (response.status?.code === 0) {
        setDataSources((response.data?.infos || []) as DataSourceItem[]);
      } else {
        message.error(response.status?.msg || 'Failed to load data sources');
      }
    } catch (error) {
      console.error('Error loading data sources:', error);
      message.error('Failed to load data sources');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (datasourceId: string) => {
    Modal.confirm({
      title: 'Confirm Deletion',
      content: 'Are you sure you want to delete this data source?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await DataSourceController.deleteUsingPOST({
            datasourceId,
            ownerId: '', // Will be populated with current user's node ID
          });

          if (response.status?.code === 0) {
            message.success('Data source deleted successfully');
            loadDataSourceList();
          } else {
            message.error(response.status?.msg || 'Failed to delete data source');
          }
        } catch (error) {
          console.error('Error deleting data source:', error);
          message.error('Failed to delete data source');
        }
      },
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      const createRequest: API.CreateDatasourceRequest = {
        name: values.datasourceName,
        type: values.datasourceType,
        dataSourceInfo: values.definition || {},
        ownerId: '', // Will be populated with current user's node ID
      };

      const response = await DataSourceController.create(createRequest);

      if (response.status?.code === 0) {
        message.success(
          editingDataSource
            ? 'Data source updated successfully'
            : 'Data source created successfully',
        );
        setModalVisible(false);
        form.resetFields();
        setEditingDataSource(null);
        loadDataSourceList();
      } else {
        message.error(response.status?.msg || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving data source:', error);
      message.error('Operation failed');
    }
  };

  const handleEdit = (record: DataSourceItem) => {
    setEditingDataSource(record);
    form.setFieldsValue({
      datasourceName: record.datasourceName,
      datasourceType: record.datasourceType,
      definition: record.definition ? JSON.parse(record.definition) : {},
    });
    setModalVisible(true);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'datasourceName',
      key: 'datasourceName',
    },
    {
      title: 'Type',
      dataIndex: 'datasourceType',
      key: 'datasourceType',
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
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: DataSourceItem) => (
        <Space size="middle">
          <a onClick={() => handleEdit(record)}>Edit</a>
          <a onClick={() => handleDelete(record.datasourceId!)}>Delete</a>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Data Source Management"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            New Data Source
          </Button>
        }
      >
        <Table
          dataSource={dataSources}
          columns={columns}
          rowKey="datasourceId"
          loading={loading}
        />
      </Card>

      <Modal
        title={editingDataSource ? 'Edit Data Source' : 'Create Data Source'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingDataSource(null);
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="datasourceName"
                label="Name"
                rules={[{ required: true, message: 'Please enter data source name' }]}
              >
                <Input placeholder="Enter data source name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="datasourceType"
                label="Type"
                rules={[{ required: true, message: 'Please select data source type' }]}
              >
                <Input placeholder="Enter data source type" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="definition" label="Definition (JSON)">
            <Input.TextArea
              rows={4}
              placeholder='Enter data source definition in JSON format, e.g., {"host": "localhost", "port": 3306, "database": "mydb"}'
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DataSourcePage;
