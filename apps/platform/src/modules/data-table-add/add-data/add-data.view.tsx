import {
  Button,
  Descriptions,
  Form,
  Input,
  Select,
  Space,
  message,
  notification,
} from 'antd';
import { Drawer } from 'antd';
import { debounce } from 'lodash';
import { parse } from 'query-string';
import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'umi';

import { AccessWrapper, hasAccess, Platform } from '@/components/platform-wrapper';
import { useModel } from '@/util/valtio-helper';

import {
  DataTableStructure,
  DataTableStructureService,
} from '../component/dataTableStructure/data-table-structure.view';
import { HttpQueryExample } from '../component/httpQueryExample';
import { OdpsPartition } from '../component/odpsPartition/odps-partition.view';
import {
  UploadTable,
  UploadTableView,
} from '../component/upload-table/upload-table.view';

import { AddDataSheetService, DataSourceType } from './add-data-service';
import styles from './index.less';

/**
 * 添加数据抽屉组件
 *
 * 整体执行逻辑：
 * 1. 由父组件（data-manager.view.tsx）控制 visible 显隐，onClose 用于关闭后的回调（如刷新列表）；
 * 2. 抽屉打开(visible=true)时会拉取“数据源列表”，用于填充“所属数据源”下拉框；
 * 3. 用户选择数据源后，会根据数据源类型（OSS/HTTP/ODPS/MYSQL/LOCAL）动态渲染不同的表单项；
 *    - 非 LOCAL 类型：展示通用表单（表名、所属节点、描述、空缺值、字段结构等），最终点击“确定”调用 addDataSheet 提交；
 *    - LOCAL 类型：展示 UploadTable 上传组件，走独立的上传/提交流程（UploadInstance.submit）；
 * 4. 若是自治模式(AUTONOMY)，还需要额外拉取“所属节点”列表(queryNodeNameList)；
 * 5. 若数据源类型是 ODPS，还需要额外拉取 ODPS 项目信息(queryOdpsSourceDetail)。
 */
export const DataAddDrawer = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  // 用于展示“部分节点创建失败”等通知信息
  const [notificationApi, contextHolder] = notification.useNotification();
  // LOCAL（本地上传）数据源对应的上传组件状态管理 model
  const UploadInstance = useModel(UploadTableView);
  // 控制“提交”按钮是否禁用（本地上传场景使用）
  const [disabled, setDisabled] = useState(false);
  // 数据表结构（字段列表）相关状态管理 model，如字段校验错误等
  const dataTableStructureService = useModel(DataTableStructureService);
  // 添加数据表的核心业务 service：数据源列表、节点列表、提交逻辑等都在这里
  const addDataSheetService = useModel(AddDataSheetService);
  const {
    queryDataSourceList, // 拉取数据源列表的方法
    dataSourceList, // 数据源列表（原始数据，含每个数据源的 type 等信息）
    dataSourceOptions, // 数据源下拉框使用的 options（label/value 结构）
    addDataSheetLoading, // “确定”按钮的 loading 状态
    addDataSheet, // 提交新增数据表的方法
    nodeNameOptions, // 所属节点下拉框的 options（自治模式使用）
    queryNodeNameList, // 拉取所属节点列表的方法
    queryOdpsSourceDetail, // 拉取 ODPS 数据源详情（项目名）的方法
  } = addDataSheetService;

  // 是否为“自治模式”（P2P 部署下，需要选择所属节点）
  const isAutonomy = hasAccess({ type: [Platform.AUTONOMY] });

  const [form] = Form.useForm();
  // 监听整个表单所有字段的值变化，用于计算“确定”按钮是否可点击
  const values = Form.useWatch([], form);
  // 单独监听“所属数据源”字段的值
  const dataSourceFormValue = Form.useWatch('dataSource', form);
  // 根据选中的数据源 id，反查出该数据源的类型（OSS/HTTP/ODPS/MYSQL/LOCAL），
  // 用于控制下方表单项的动态渲染
  const dataSourceFormValueType = dataSourceList.find(
    (item) => item.datasourceId === dataSourceFormValue,
  )?.type;
  const { search } = useLocation();
  // 当前所属节点 id（从 URL query 中获取）
  const { ownerId } = parse(search);

  // 监听表单值变化，实时计算“确定”按钮是否可点击（submitDisabled）
  // 校验规则：
  // 1. 自治模式下必须选择了所属节点(nodeIds)，非自治模式默认视为已满足；
  // 2. ODPS 类型必须填写 odpsSheetName + tableName，其他类型必须填写 address + tableName；
  // 3. 字段结构(features)不能为空；
  // 三者同时满足才启用“确定”按钮，否则禁用
  useEffect(() => {
    const hasNodeIds = isAutonomy ? (values?.nodeIds || []).length !== 0 : true;
    const hasValue =
      dataSourceFormValueType === DataSourceType.ODPS
        ? values?.odpsSheetName && values?.tableName
        : values?.address && values?.tableName;
    if (hasValue && values?.features?.length !== 0 && hasNodeIds) {
      addDataSheetService.submitDisabled = false;
    } else {
      addDataSheetService.submitDisabled = true;
    }
  }, [values]);

  // 拉取数据源列表（用于“所属数据源”下拉框），传入当前节点 ownerId
  const getDataSourceList = useCallback(async () => {
    await queryDataSourceList(ownerId as string);
  }, [ownerId]);

  // 抽屉每次由隐藏变为显示(visible=true)时执行：
  // 1. 重新拉取一次最新的数据源列表；
  // 2. 重置 features 字段为默认的一条空结构，避免残留上一次的数据
  useEffect(() => {
    if (visible) {
      getDataSourceList();
      form.setFieldValue('features', [{}]);
    }
  }, [visible]);

  // 拉取 ODPS 数据源详情，主要是为了获取 odpsProjectName（表名前缀展示用）
  const getOdpsSourceProject = useCallback(async () => {
    await queryOdpsSourceDetail({
      ownerId: ownerId as string,
      datasourceId: dataSourceFormValue,
      type: DataSourceType.ODPS,
    });
  }, [ownerId, dataSourceFormValue]);

  // 根据当前选中的数据源，拉取该数据源可用的“所属节点”列表（自治模式使用）
  const getNodeNameList = useCallback(async () => {
    await queryNodeNameList(ownerId as string, dataSourceFormValue);
  }, [ownerId, dataSourceFormValue]);

  // 监听“所属数据源”选择的变化：
  // - 若选择了数据源：
  //   - 自治模式下，拉取该数据源对应的所属节点列表；
  //   - 若数据源类型是 ODPS，额外拉取 ODPS 项目信息；
  // - 若未选择数据源（清空）：直接清空所属节点的 options
  useEffect(() => {
    if (dataSourceFormValue) {
      if (hasAccess({ type: [Platform.AUTONOMY] })) {
        getNodeNameList();
        const dataSourceType = dataSourceList.find(
          (item) => item.datasourceId === dataSourceFormValue,
        )?.type;
        dataSourceType === DataSourceType.ODPS && getOdpsSourceProject();
      }
    } else {
      addDataSheetService.nodeNameOptions = [];
    }
  }, [dataSourceFormValue]);

  // useEffect(() => {
  //   if (form && dataSourceFormValueType === DataSourceType.OSS) {
  //     form.setFieldValue('tableNullStrs', '""');
  //   }
  // }, [form, dataSourceFormValueType]);

  // 关闭抽屉时的统一清理逻辑：
  // 1. 调用父组件传入的 onClose（通常会刷新表格列表 + 将 showDataAddDrawer 置为 false）；
  // 2. 重置表单所有字段；
  // 3. 清空字段结构的校验错误信息；
  // 4. 重置本地上传组件（UploadTableView）的步骤和已选文件信息
  const handleClose = () => {
    onClose();
    form.resetFields();
    dataTableStructureService.featuresError = [];
    UploadInstance.step = 0;
    UploadInstance.fileInfo = undefined;
  };

  // 校验表单字段，若校验失败，专门提取 features（字段结构）相关的报错，
  // 交给 dataTableStructureService.featuresError 用于在字段结构组件里高亮展示错误
  const validateForm = async (options = {}) => {
    try {
      const validateRes = await form.validateFields(options);
      return validateRes;
    } catch (e: any) {
      const { errorFields } = e;
      const featuresError = errorFields.filter((i: any) => i.name[0] === 'features');
      dataTableStructureService.featuresError = featuresError;
      throw e;
    }
  };

  // 点击“确定”按钮的提交逻辑（非 LOCAL 数据源走这里）：
  // 1. 先校验表单；
  // 2. 找到当前选中的数据源详情(currentDataSource)；
  // 3. 若数据源类型是 OSS/ODPS/MYSQL，需要把“空缺值”字符串解析成数组一起提交；
  // 4. 组装最终提交参数：附加数据源名称、类型、所属节点（自治模式用用户选的节点，非自治模式固定为当前 ownerId）；
  // 5. 调用 addDataSheet 提交，根据返回结果：
  //    - 成功：提示成功；若是“自治模式 + OSS”场景，需要额外判断是否有部分节点创建失败，
  //      如果有则用 notification 展示失败节点详情，否则直接关闭抽屉；
  //    - 失败：提示错误信息并关闭抽屉；
  //    - 异常：仅关闭 loading 状态（不关闭抽屉，方便用户重试）
  const handleOk = async () => {
    const validateRes = await validateForm();
    dataTableStructureService.featuresError = [];
    const currentDataSource = dataSourceList.find(
      (item) => item.datasourceId === validateRes.dataSource,
    );

    // OSS/ODPS/MYSQL 类型才需要“空缺值”配置，其他类型不传该字段
    const nullStrs =
      currentDataSource?.type === DataSourceType.OSS ||
      currentDataSource?.type === DataSourceType.ODPS ||
      currentDataSource?.type === DataSourceType.MYSQL
        ? {
            nullStrs: validateRes.tableNullStrs
              ? JSON.parse(`[${validateRes.tableNullStrs}]`)
              : [],
          }
        : {};

    const formValues = {
      ...validateRes,
      ...nullStrs,
      datasourceName: currentDataSource?.name,
      datasourceType: currentDataSource?.type,
      // 自治模式下使用用户勾选的所属节点列表，否则固定为当前登录/所在节点
      nodeIds: isAutonomy ? values.nodeIds : [ownerId],
    };
    try {
      addDataSheetService.addDataSheetLoading = true;
      const { status, data } = await addDataSheet(
        formValues,
        currentDataSource?.type as DataSourceType,
      );
      addDataSheetService.addDataSheetLoading = false;
      if (status && status.code === 0) {
        message.success('添加成功');
        // autonomy 模式下，并且是添加oss数据。要展示多节点创建失败的情况
        if (isAutonomy && currentDataSource?.type === DataSourceType.OSS) {
          // 部分节点创建成功
          //  TODO: 部分节点创建
          const errorNodesObj = data?.failedCreatedNodes || {};
          const errorNodeList = Object.keys(errorNodesObj).map((id) => ({
            nodeId: id,
            errorMessage: errorNodesObj[id],
          }));
          if (errorNodeList.length !== 0) {
            // 存在部分节点创建失败，用通知展示每个失败节点及原因，同时关闭抽屉
            notificationApi.info({
              message: '部分节点创建失败',
              duration: 3,
              description: (
                <Space direction="vertical">
                  {errorNodeList.map((node) => {
                    return (
                      <Descriptions key={node.nodeId}>
                        <Descriptions.Item label={node.nodeId}>
                          {node.errorMessage}
                        </Descriptions.Item>
                      </Descriptions>
                    );
                  })}
                </Space>
              ),
            });
            handleClose();
            return;
          }
        }
        handleClose();
      } else {
        message.error(status?.msg || '添加失败');
        handleClose();
      }
    } catch (error) {
      addDataSheetService.addDataSheetLoading = false;
    }
  };

  // “所属数据源”下拉框变化时的回调：
  // 1. 若从 LOCAL 类型切走，重置上传组件状态；
  // 2. 清空字段结构相关的错误状态；
  // 3. 重置整个表单，仅保留新选择的数据源值和默认的一条空 features
  const handelDataSourceChange = (value: string) => {
    if (dataSourceFormValueType === DataSourceType.LOCAL) {
      UploadInstance.reset();
    }
    dataTableStructureService.featuresError = [];
    dataTableStructureService.showFeatureErrorChecked = false;
    form.resetFields();
    form.setFieldsValue({
      features: [{}],
      dataSource: value,
    });
  };

  return (
    <>
      {contextHolder}
      {/* 抽屉容器：visible 由父组件控制显隐；关闭时统一走 handleClose 做清理 */}
      <Drawer
        title="添加数据"
        width={750}
        open={visible}
        onClose={handleClose}
        footer={
          <div className={styles.actions}>
            <Space>
              <Button onClick={handleClose}>取消</Button>
              {/*
                footer 按钮根据数据源类型分两种提交方式：
                - LOCAL（本地上传）：走 UploadInstance.submit()，即文件上传的独立提交逻辑；
                  按钮禁用条件：还未进入上传第二步(step===0)，或外部 disabled 控制；
                  提交成功后关闭抽屉并重置上传状态；
                - 非 LOCAL：走 handleOk()，即普通表单校验 + addDataSheet 提交逻辑；
                  按钮禁用由 addDataSheetService.submitDisabled 控制（见上方 useEffect 计算规则）
              */}
              {dataSourceFormValueType &&
              dataSourceFormValueType === DataSourceType.LOCAL ? (
                <Button
                  disabled={UploadInstance.step === 0 || disabled}
                  type="primary"
                  loading={UploadInstance.submitting}
                  onClick={debounce(async () => {
                    try {
                      await UploadInstance.submit();
                      handleClose();
                    } catch (e) {
                      return;
                    }
                    UploadInstance.reset();
                  }, 1000)}
                >
                  提交
                </Button>
              ) : (
                <Button
                  disabled={addDataSheetService.submitDisabled}
                  type="primary"
                  loading={addDataSheetLoading}
                  onClick={handleOk}
                >
                  确定
                </Button>
              )}
            </Space>
          </div>
        }
      >
        <Form form={form} layout="vertical" autoComplete="off" requiredMark="optional">
          {/* 所属数据源：始终展示，选中后触发 handelDataSourceChange 重置表单及拉取节点/ODPS信息 */}
          <Form.Item
            name="dataSource"
            label="所属数据源"
            rules={[{ required: true, message: '请输入数据地址' }]}
          >
            <Select
              placeholder="请选择"
              options={dataSourceOptions}
              onChange={handelDataSourceChange}
            />
          </Form.Item>
          {/* 以下为不同数据源类型专属的“地址/表名”输入项，仅当类型匹配时渲染 */}
          {dataSourceFormValueType === DataSourceType.OSS && (
            <Form.Item
              name="address"
              label="数据文件地址"
              rules={[{ required: true, message: '数据文件地址' }]}
            >
              <Input placeholder="请输入文件在OSS上相对预设路径的地址，预设路径随选择的OSS数据源变化" />
            </Form.Item>
          )}
          {dataSourceFormValueType === DataSourceType.HTTP && (
            <Form.Item
              name="address"
              label="HTTP地址"
              rules={[{ required: true, message: '请输入HTTP地址' }]}
            >
              <Input placeholder="请输入" />
            </Form.Item>
          )}
          {dataSourceFormValueType === DataSourceType.ODPS && (
            <Form.Item
              name="odpsSheetName"
              label="输入表名称"
              rules={[{ required: true, message: '请输入ODPS表名' }]}
            >
              {/* addonBefore 展示的是拉取到的 ODPS 项目名（getOdpsSourceProject 结果） */}
              <Input
                addonBefore={addDataSheetService.odpsProjectName}
                placeholder="请输入ODPS表名"
              />
            </Form.Item>
          )}
          {dataSourceFormValueType === DataSourceType.MYSQL && (
            <Form.Item
              name="address"
              label="数据表地址"
              rules={[{ required: true, message: '原始表地址' }]}
            >
              <Input placeholder="请输入原始表地址" />
            </Form.Item>
          )}

          {/*
            非 LOCAL 类型的通用表单区域：
            表名 + 所属节点（自治模式） + 描述 + 空缺值（OSS/ODPS/MYSQL） + 字段结构 + ODPS分区（ODPS专属）
          */}
          {dataSourceFormValueType &&
            dataSourceFormValueType !== DataSourceType.LOCAL && (
              <>
                <Form.Item
                  name="tableName"
                  label="数据表名称"
                  rules={[
                    { required: true, message: '请输入数据表名称' },
                    { max: 32, message: '数据表名称长度限制32字符' },
                    {
                      pattern: /^([a-zA-Z0-9-_\u4e00-\u9fa5]*)$/,
                      message: '名称可由中文/英文/数字/下划线/中划线组成',
                    },
                  ]}
                >
                  <Input placeholder="名称可由中文/英文/数字/下划线/中划线组成，长度限制32" />
                </Form.Item>
                {/* 仅自治模式(P2P)展示所属节点多选框，节点选项来自 queryNodeNameList */}
                <AccessWrapper accessType={{ type: [Platform.AUTONOMY] }}>
                  <Form.Item
                    name="nodeIds"
                    label="所属节点"
                    rules={[{ required: true, message: '请选择所属节点' }]}
                  >
                    <Select
                      placeholder="请选择"
                      options={nodeNameOptions}
                      mode="multiple"
                    />
                  </Form.Item>
                </AccessWrapper>
                {/* HTTP 类型额外展示查询示例说明 */}
                {dataSourceFormValueType === DataSourceType.HTTP && (
                  <HttpQueryExample />
                )}
                <Form.Item name="tableDesc" label="描述">
                  <Input.TextArea placeholder="100字符以内" maxLength={100} />
                </Form.Item>

                {/* OSS/ODPS/MYSQL 类型才需要配置“空缺值”，用于数据解析时识别缺失值 */}
                {dataSourceFormValueType === DataSourceType.OSS ||
                dataSourceFormValueType === DataSourceType.ODPS ||
                dataSourceFormValueType === DataSourceType.MYSQL ? (
                  <Form.Item
                    name="tableNullStrs"
                    tooltip={'不填充则纯空为空字符，默认""为空缺值'}
                    label={<>空缺值</>}
                    initialValue={'""'}
                    rules={[
                      {
                        validator: (_, val) => {
                          try {
                            JSON.parse(`[${val}]`);
                            return Promise.resolve();
                          } catch (error) {
                            return Promise.reject(`空缺值填写错误，请检查`);
                          }
                        },
                      },
                    ]}
                  >
                    <Input.TextArea
                      placeholder={'""（可输入多个，用,隔开，例：",,","-999"）'}
                      rows={2}
                    />
                  </Form.Item>
                ) : null}
                {/* 数据表字段结构编辑组件（对应 features 表单字段），内部有自己独立的校验错误状态 */}
                <DataTableStructure />
                {/* ODPS 类型额外展示分区配置组件 */}
                {dataSourceFormValueType === DataSourceType.ODPS && <OdpsPartition />}
              </>
            )}
          {/* LOCAL 类型：整体替换为文件上传组件，走独立的上传/提交流程 */}
          {dataSourceFormValueType &&
            dataSourceFormValueType === DataSourceType.LOCAL && (
              <UploadTable
                setDisabled={setDisabled}
                nodeNameOptions={nodeNameOptions}
              />
            )}
        </Form>
      </Drawer>
    </>
  );
};
