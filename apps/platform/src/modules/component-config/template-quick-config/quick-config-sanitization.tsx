import { Form, Select } from 'antd';
import { parse } from 'query-string';
import { useEffect, useState } from 'react';
import { useLocation } from 'umi';

import {
  getProject,
  getProjectDatatable,
} from '@/services/secretpad/ProjectController';

import styles from './index.less';

const { Option } = Select;

/**
 * 数据脱敏快速配置面板。
 * 让用户选择数据表和需要脱敏的列，模板会自动生成 auto_mask 规则。
 */
export const QuickConfigSanitization = () => {
  const form = Form.useFormInstance();
  const { search } = useLocation();
  const { projectId } = parse(search) as { projectId: string };

  const [tables, setTables] = useState<
    {
      datatableId: string;
      datatableName: string;
      nodeId: string;
      nodeName: string;
    }[]
  >([]);

  const [columns, setColumns] = useState<{ value: string; label: string }[]>([]);

  const selectedTable = Form.useWatch('dataTable', form);

  useEffect(() => {
    const loadTables = async () => {
      const { data } = await getProject({ projectId });
      if (!data) return;
      const { nodes } = data;
      if (!nodes) return;

      const tableList: {
        datatableId: string;
        datatableName: string;
        nodeId: string;
        nodeName: string;
      }[] = [];

      nodes.forEach((node) => {
        const { datatables, nodeId, nodeName } = node;
        if (!datatables || !nodeId) return;
        datatables.forEach((table) => {
          if (table.datatableId && table.datatableName) {
            tableList.push({
              datatableId: table.datatableId,
              datatableName: table.datatableName,
              nodeId,
              nodeName: nodeName || '',
            });
          }
        });
      });

      setTables(tableList);

      if (tableList.length > 0) {
        const defaultTable =
          tableList.find(
            (t) => t.nodeName.toLowerCase().includes('alice') || t.nodeName === 'alice',
          ) || tableList[0];

        form.setFieldsValue({
          dataTable: { s: defaultTable.datatableId },
        });
      }
    };

    loadTables();
  }, [projectId, form]);

  useEffect(() => {
    const loadColumns = async () => {
      const tableId = selectedTable?.s;
      if (!tableId) {
        setColumns([]);
        return;
      }

      const table = tables.find((t) => t.datatableId === tableId);
      if (!table) {
        setColumns([]);
        return;
      }

      const { data: tableConfig } = await getProjectDatatable({
        projectId,
        nodeId: table.nodeId,
        datatableId: table.datatableId,
        type: 'CSV',
      });

      if (!tableConfig?.configs) {
        setColumns([]);
        return;
      }

      const configs = (tableConfig.configs || []) as { colName: string }[];
      const colOptions = configs.map(({ colName }) => ({
        value: colName,
        label: colName,
      }));
      setColumns(colOptions);
    };

    loadColumns();
  }, [selectedTable, tables, projectId, form]);

  return (
    <>
      <Form.Item
        label={<div className={styles.configItemLabel}>样本表</div>}
        name="dataTable"
        messageVariables={{ label: '样本表' }}
        rules={[{ required: true }]}
        valuePropName="value"
        colon={false}
        getValueProps={(value) => ({ value: value?.s })}
        getValueFromEvent={(value) => ({ s: value })}
      >
        <Select
          optionLabelProp="title"
          showSearch
          filterOption={(input: string, option?: { label: string; value: string }) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        >
          {tables.map((table) => (
            <Option
              key={table.datatableId}
              value={table.datatableId}
              label={`${table.datatableName} (${table.nodeName})`}
              title={`${table.datatableName} (${table.nodeName})`}
            >
              {`${table.datatableName} (${table.nodeName})`}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label={<div className={styles.configItemLabel}>脱敏列</div>}
        name="sanitizationCols"
        messageVariables={{ label: '脱敏列' }}
        rules={[{ required: true, message: '请选择至少一个需要脱敏的列' }]}
        colon={false}
      >
        <Select
          mode="multiple"
          showSearch
          options={columns}
          placeholder="选择需要脱敏处理的列（自动识别类型）"
          filterOption={(input: string, option?: { label: string; value: string }) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
      </Form.Item>
    </>
  );
};
