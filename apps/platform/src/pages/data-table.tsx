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
  Select,
} from 'antd';
import { useEffect, useState } from 'react';

import * as DatatableController from '@/services/secretpad/DatatableController';
import { formatTimestamp } from '@/modules/dag-result/utils';

interface DataTableItem {
  datatableId?: string;
  datatableName?: string;
  datasourceId?: string;
  nodeId?: string;
  ownerId?: string;
  gmtCreate?: string;
  gmtModified?: string;
  schema?: any;
  description?: string;
}

const DataTablePage: React.FC = () => {
  const [dataTables, setDataTables] = useState<DataTableItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingDataTable, setEditingDataTable] = useState<DataTableItem | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadDataTables();
  }, []);

  const loadDataTables = async () => {
    try {
      setLoading(true);
      const response = await DatatableController.listDatatables({
        ownerId: '', // Will be populated with current user's node ID
      });

      if (response.code === 0) {
        setDataTables(response.data?.datatables || []);
      } else {
        message.error(response.msg || 'Failed to load data tables');
      }
    } catch (error) {
      console.error('Error loading data tables:', error);
      message.error('Failed to load data tables');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (datatableId: string) => {
    Modal.confirm({
      title: 'Confirm Deletion',
      content: 'Are you sure you want to delete this data table?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await DatatableController.deleteDatatable({
            datatableId,
            nodeId: '', // Will be populated with current user's node ID
          });

          if (response.code === 0) {
            message.success('Data table deleted successfully');
            loadDataTables();
          } else {
            message.error(response.msg || 'Failed to delete data table');
          }
        } catch (error) {
          console.error('Error deleting data table:', error);
          message.error('Failed to delete data table');
        }
      },
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      let response;

      if (editingDataTable) {
        // Note: The API doesn't seem to have an update endpoint for data tables
        // We'll treat this as a create operation for demonstration
        response = await DatatableController.createDataTable({
          datatableName: values.datatableName,
          datasourceId: values.datasourceId,
          nodeId: '', // Will be populated with current user's node ID
          ownerId: '', // Will be populated with current user's node ID
          schema: JSON.stringify(values.schema || {}),
          description: values.description,
        });
      } else {
        response = await DatatableController.createDataTable({
          datatableName: values.datatableName,
          datasourceId: values.datasourceId,
          nodeId: '', // Will be populated with current user's node ID
          ownerId: '', // Will be populated with current user's node ID
          schema: JSON.stringify(values.schema || {}),
          description: values.description,
        });
      }

      if (response.code === 0) {
        message.success(
          editingDataTable
            ? 'Data table updated successfully'
            : 'Data table created successfully',
        );
        setModalVisible(false);
        form.resetFields();
        setEditingDataTable(null);
        loadDataTables();
      } else {
        message.error(response.msg || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving data table:', error);
      message.error('Operation failed');
    }
  };

  const handleEdit = (record: DataTableItem) => {
    setEditingDataTable(record);
    form.setFieldsValue({
      datatableName: record.datatableName,
      datasourceId: record.datasourceId,
      description: record.description,
      schema: record.schema ? JSON.stringify(record.schema, null, 2) : '{}',
    });
    setModalVisible(true);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'datatableName',
      key: 'datatableName',
    },
    {
      title: 'Data Source ID',
      dataIndex: 'datasourceId',
      key: 'datasourceId',
    },
    {
      title: 'Node ID',
      dataIndex: 'nodeId',
      key: 'nodeId',
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
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: DataTableItem) => (
        <Space size="middle">
          <a onClick={() => handleEdit(record)}>Edit</a>
          <a onClick={() => handleDelete(record.datatableId!)}>Delete</a>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Data Table Management"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            New Data Table
          </Button>
        }
      >
        <Table
          dataSource={dataTables}
          columns={columns}
          rowKey="datatableId"
          loading={loading}
        />
      </Card>

      <Modal
        title={editingDataTable ? 'Edit Data Table' : 'Create Data Table'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingDataTable(null);
        }}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="datatableName"
                label="Name"
                rules={[{ required: true, message: 'Please enter data table name' }]}
              >
                <Input placeholder="Enter data table name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="datasourceId"
                label="Data Source ID"
                rules={[{ required: true, message: 'Please enter data source ID' }]}
              >
                <Input placeholder="Enter data source ID" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="nodeId" label="Node ID">
                <Input placeholder="Enter node ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ownerId" label="Owner ID">
                <Input placeholder="Enter owner ID" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Enter description" />
          </Form.Item>
          <Form.Item name="schema" label="Schema (JSON)">
            <Input.TextArea
              rows={6}
              placeholder='Enter table schema in JSON format, e.g., {"columns": [{"name": "id", "type": "string"}, {"name": "name", "type": "string"}]}'
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DataTablePage;
