/**
 * ==============================================================================
 * 创建/注册数据源弹窗组件
 * ==============================================================================
 *
 * 文件位置：secretpad/frontend-src/apps/platform/src/modules/data-source-list/components/create-data-source/index.tsx
 *
 * 作用：
 *   该组件提供 SecretPad 平台“注册数据源”的 UI 入口。用户在数据管理页面
 *   点击“注册数据源”后，会弹出一个 Drawer 抽屉，让用户选择数据源类型
 *   （OSS / ODPS / MYSQL 等），填写连接信息，并选择要注册到的节点。
 *
 * 核心流程：
 *   1. 用户选择数据源类型并填写表单（endpoint、ak/sk、bucket 等）。
 *   2. 用户选择目标节点（AUTONOMY/P2P 模式可添加多个节点，其他模式仅当前节点）。
 *   3. 点击“提交”后，调用 DataSourceService.addDataSource()。
 *   4. DataSourceService 将表单数据转换为后端要求的 CreateDatasourceRequest，
 *      最终调用后端接口 POST /api/v1alpha1/datasource/create。
 *   5. 后端收到请求后，会按数据源类型分发给对应的 DatasourceHandler，
 *      并通过 gRPC 调用 Kuscia 创建 DomainDataSource CR。
 *
 * 与后端的对应关系：
 *   - 前端 Controller: DataSourceController.create
 *   - 后端 Service:    DatasourceServiceImpl.createDatasource
 *   - OSS 处理器:      OssKusciaControlDatasourceHandler
 *   - Kuscia 接口:     DomainDataSourceService.CreateDomainDataSource (gRPC :8083)
 *
 * 注意：
 *   - HTTP 类型在界面上已被注释，当前版本未启用。
 *   - ODPS 类型名称会自动加上 "ODPS-" 前缀。
 *   - AUTONOMY（自治/P2P）模式下支持向多个节点注册，最多 5 个。
 * ==============================================================================
 */

import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  Radio,
  Select,
  Space,
  Switch,
  Tooltip,
  message,
  notification,
} from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'umi';

import { hasAccess, Platform } from '@/components/platform-wrapper';
import {
  DataSourceService,
  DataSourceType,
} from '@/modules/data-source-list/data-source-list.service';
import { NodeService } from '@/modules/node';
import { useModel } from '@/util/valtio-helper';

import styles from './index.less';

/**
 * CreateDataSourceModal
 * ------------------------------------------------------------------------------
 * props:
 *   - visible:  控制 Drawer 是否显示
 *   - onClose:  关闭抽屉的回调（通常由父组件控制 visible 状态并刷新列表）
 *
 * 内部使用 Valtio 状态管理：
 *   - dataSourceService: 封装数据源相关的 API 调用与节点列表状态。
 *   - nodeService:       获取当前节点信息，用于非 AUTONOMY 模式默认选中当前节点。
 */
export const CreateDataSourceModal: React.FC<{
  onClose: () => void;
  visible: boolean;
}> = ({ visible, onClose }) => {
  // 通过 Valtio 获取数据源服务实例，负责调用 addDataSource / queryAutonomyNodeList
  const dataSourceService = useModel(DataSourceService);
  // 通过 Valtio 获取节点服务实例，用于读取 currentNode（当前登录节点）
  const nodeService = useModel(NodeService);

  // 从 URL 查询参数中读取 ownerId，表示当前数据源的归属节点/项目所有者
  const [searchParams] = useSearchParams();
  const ownerId = searchParams.get('ownerId');

  // Ant Design 通知 API，用于 AUTONOMY 模式下展示“部分节点创建失败”的详情
  const [notificationApi, contextHolder] = notification.useNotification();

  // Ant Design Form 实例，用于表单校验、取值、重置
  const [form] = Form.useForm();
  // 实时监听整个表单值变化，用于控制“提交”按钮的禁用状态
  const values = Form.useWatch([], form);
  // 实时监听 nodeIds 字段变化，用于在节点下拉框中禁用已选节点
  const nodeIdsValue = Form.useWatch('nodeIds', form);
  // 提交按钮是否禁用：当表单校验未通过时置为 true
  const [disabled, setDisabled] = useState(true);
  // const [nodeStatus, setNodeStatus] = useState('pending');

  /**
   * closeHandler
   * ------------------------------------------------------------------------------
   * 关闭抽屉并重置表单。
   * 注意：这里只重置表单字段，不会清空 dataSourceService.nodeOptions，
   * 因为节点列表在下次打开时会重新加载或复用。
   */
  const closeHandler = () => {
    onClose();
    form.resetFields();
  };

  /**
   * handleOk
   * ------------------------------------------------------------------------------
   * 点击“提交”按钮后的处理函数，核心注册逻辑入口。
   *
   * 执行步骤：
   *   1. 调用 form.validateFields() 进行表单校验。
   *   2. 如果是 ODPS 类型，自动在 name 前拼接 "ODPS-" 前缀（产品约定）。
   *   3. 调用 dataSourceService.addDataSource({ ...value, ownerId })。
   *   4. 如果后端返回 status.code === 0：
   *        - 普通模式：提示“注册成功”并关闭抽屉。
   *        - AUTONOMY 模式：检查 data.failedCreatedNodes，若存在失败节点，
   *          用 notification 展示每个失败节点及其错误信息，再关闭抽屉。
   *   5. 如果失败：提示错误信息并关闭抽屉。
   *
   * 向后端传递的数据结构（API.CreateDatasourceRequest）大致如下：
   *   {
   *     type: 'OSS' | 'ODPS' | 'MYSQL',
   *     name: string,
   *     dataSourceInfo: {
   *       endpoint: string,
   *       ak?: string,
   *       sk?: string,
   *       bucket?: string,
   *       prefix?: string,
   *       virtualhost?: boolean,
   *       // ODPS: project, accessId, accessKey
   *       // MYSQL: user, password, database
   *     },
   *     nodeIds: [{ nodeId: string }, ...], // 提交前会被 service 提取为 string[]
   *     ownerId: string
   *   }
   */
  const handleOk = async () => {
    await form.validateFields().then(async (value) => {
      // ODPS 数据源名称自动加前缀，便于列表中区分数据源类型
      if (value.type === DataSourceType.ODPS) {
        value.name = 'ODPS-' + value.name;
      }

      // 调用 DataSourceService.addDataSource，最终发起 POST /api/v1alpha1/datasource/create
      const { status, data } = await dataSourceService.addDataSource({
        ...value,
        ownerId: ownerId,
      });
      if (status && status.code === 0) {
        message.success(`「${value.name}」注册成功」`);
        if (isAutonomyMode) {
          // AUTONOMY 模式下可能同时向多个节点注册，需要处理部分失败场景
          const errorNodesObj = data?.failedCreatedNodes || {};
          const errorNodeList = Object.keys(errorNodesObj).map((id) => ({
            nodeId: id,
            errorMessage: errorNodesObj[id],
          }));
          if (errorNodeList.length !== 0) {
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
            closeHandler();
            return;
          }
        }
        closeHandler();
      } else {
        message.error(status?.msg || '注册失败');
        closeHandler();
      }
    });
  };

  /**
   * getNodeList
   * ------------------------------------------------------------------------------
   * AUTONOMY 模式下调用，获取所有可用节点列表。
   * 实际逻辑在 DataSourceService.queryAutonomyNodeList 中：
   *   - 调用 InstController.listNode() 拉取节点列表。
   *   - 过滤出 nodeStatus === NodeState.READY 的节点。
   *   - 将结果写入 dataSourceService.nodeOptions，供下拉框使用。
   */
  const getNodeList = useCallback(async () => {
    await dataSourceService.queryAutonomyNodeList();
  }, []);

  // 判断当前平台是否为 AUTONOMY（自治/P2P）模式，决定节点选择策略
  const isAutonomyMode = hasAccess({ type: [Platform.AUTONOMY] });

  /**
   * useEffect 1：根据表单校验状态控制“提交”按钮
   * ------------------------------------------------------------------------------
   * 当 visible 打开且表单值发生变化时，进行仅校验（validateOnly: true）。
   * 校验通过则启用提交按钮，否则禁用。
   * 这样可以实现实时按钮状态联动，而不触发错误提示。
   */
  useEffect(() => {
    if (visible) {
      form.validateFields({ validateOnly: true }).then(
        () => {
          setDisabled(false);
        },
        () => {
          setDisabled(true);
        },
      );
    }
  }, [values, visible]);

  /**
   * useEffect 2：打开弹窗时初始化节点选项
   * ------------------------------------------------------------------------------
   * AUTONOMY 模式：
   *   - 从服务端拉取全部可用节点列表，用户可动态添加/删除节点。
   * 其他模式（CENTER / EDGE 等）：
   *   - 节点下拉框仅允许选择当前节点（nodeService.currentNode）。
   *
   * 注意：代码中存在两段完全相同的 useEffect，可能是历史遗留或冗余，
   * 实际效果相同，都会按 visible 变化执行。
   */
  useEffect(() => {
    if (visible) {
      // p2p 模式下有多个节点，其他模式下只允许当前节点
      if (isAutonomyMode) {
        getNodeList();
      } else {
        dataSourceService.nodeOptions = [
          {
            value: nodeService.currentNode?.nodeId,
            label: nodeService.currentNode?.nodeName,
          },
        ];
      }
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      // p2p 模式下有多个节点，其他模式下只允许当前节点
      if (isAutonomyMode) {
        getNodeList();
      } else {
        dataSourceService.nodeOptions = [
          {
            value: nodeService.currentNode?.nodeId,
            label: nodeService.currentNode?.nodeName,
          },
        ];
      }
    }
  }, [visible]);

  // const testNode = () => {
  // const nodeId = form.getFieldValue('nodeId');
  // todo 接口调用
  // 点击之后，变成loading
  // setNodeStatus('testing');
  // 接口返回之后 变成成功或者失败
  // setNodeStatus('succeed');
  // setNodeStatus('failed');
  // };

  // const nodeTestContent = {
  //   pending: (
  //     <Button type="link" className={styles.check} onClick={testNode}>
  //       校验
  //     </Button>
  //   ),
  //   testing: (
  //     <Button type="link" className={styles.testing} icon={<LoadingOutlined />}>
  //       校验中
  //     </Button>
  //   ),
  //   failed: (
  //     <Tag bordered={false} color="error">
  //       校验失败
  //     </Tag>
  //   ),
  //   succeed: (
  //     <Tag bordered={false} color="success">
  //       校验成功
  //     </Tag>
  //   ),
  // };

  /**
   * nodeOptionsFilter
   * ------------------------------------------------------------------------------
   * 根据当前已选择的节点（nodeIdsValue）对下拉选项进行过滤，
   * 已选中的节点会被 disabled，避免重复选择同一节点。
   *
   * nodeIds 的表单结构是数组：
   *   nodeIds: [{ nodeId: 'alice' }, { nodeId: 'bob' }]
   * 每一项对应 Form.List 中的一个动态表单项。
   */
  const nodeOptionsFilter = dataSourceService.nodeOptions.map((item) => {
    if (
      (nodeIdsValue || []).some(
        (node: { nodeId: string }) => node?.nodeId === item.value,
      )
    ) {
      return {
        ...item,
        disabled: true,
      };
    } else {
      return {
        ...item,
        disabled: false,
      };
    }
  });

  /**
   * JSX 渲染
   * ------------------------------------------------------------------------------
   * 整体结构：
   *   <notification contextHolder>
   *     <Drawer 抽屉>
   *       <Form 表单>
   *         - 数据源类型选择（Radio.Group）
   *         - 根据 type 动态渲染不同连接信息表单项
   *         - 节点连接配置（Form.List 动态增减）
   *       </Form>
   *     </Drawer>
   *   </>
   *
   * 表单字段命名约定：
   *   - type:        数据源类型（DataSourceType）
   *   - name:        显示名称（ODPS 会自动加前缀）
   *   - dataSourceInfo: 各类型连接信息对象
   *       * OSS:   endpoint, ak, sk, virtualhost, bucket, prefix
   *       * MYSQL: endpoint, user, password, database
   *       * ODPS:  project, endpoint, accessId, accessKey
   *   - nodeIds:     节点数组 [{ nodeId }]
   */
  return (
    <>
      {contextHolder}
      <Drawer
        title="注册数据源"
        width={700}
        open={visible}
        onClose={closeHandler}
        footer={
          <div className={styles.actions}>
            <Space>
              <Button onClick={closeHandler}>取消</Button>
              <Button type="primary" onClick={handleOk} disabled={disabled}>
                提交
              </Button>
            </Space>
          </div>
        }
      >
        <Form
          form={form}
          autoComplete="off"
          layout="vertical"
          requiredMark="optional"
          className={styles.manualColInfo}
        >
          {/*
            数据源类型选择
            ----------------------------------------------------------------------
            当前支持：OSS、ODPS、MYSQL。
            HTTP 类型已注释，未启用。
            initialValue 默认为 OSS。
          */}
          <Form.Item
            name="type"
            label="数据源类型"
            rules={[{ required: true, message: '请选择数据源类型' }]}
            initialValue={DataSourceType.OSS}
          >
            <Radio.Group>
              <Radio value={DataSourceType.OSS}>
                <div>
                  OSS
                  <Tooltip
                    title={
                      <div style={{ maxWidth: '245px', whiteSpace: 'nowrap' }}>
                        OSS存储支持CSV文件类型的数据资产
                      </div>
                    }
                  >
                    <ExclamationCircleOutlined
                      style={{
                        marginLeft: '9px',
                        cursor: 'pointer',
                        color: '#00000073',
                      }}
                    />
                  </Tooltip>
                </div>
              </Radio>
              {/* <Radio value={DataSourceType.HTTP}>
              <Space>HTTP</Space>
            </Radio> */}
              <Radio value={DataSourceType.ODPS}>
                <Space>ODPS</Space>
              </Radio>
              <Radio value={DataSourceType.MYSQL}>
                <Space>MYSQL</Space>
              </Radio>
            </Radio.Group>
          </Form.Item>

          {/*
            根据 type 动态渲染连接信息表单
            ----------------------------------------------------------------------
            使用 Form.Item dependencies={['type']} + render props 模式。
            当 type 字段变化时，会根据当前值重新渲染对应类型的表单项。
          */}
          <Form.Item dependencies={['type']} noStyle>
            {({ getFieldValue }) => {
              return getFieldValue('type') === DataSourceType.OSS ? (
                <>
                  {/*
                    OSS 数据源连接信息
                    ------------------------------------------------------------------
                    name:        用户自定义显示名称
                    endpoint:    OSS endpoint，如 oss-cn-hangzhou.aliyuncs.com
                    ak / sk:     AccessKey ID / Secret
                    virtualhost: 是否使用 virtual hosted-style 访问
                    bucket:      OSS bucket 名称
                    prefix:      预设路径前缀（可选）
                  */}
                  <Form.Item
                    label="显示名称"
                    name={'name'}
                    rules={[
                      { required: true, message: '请输入显示名称' },
                      { max: 32, message: '长度限制32' },
                      {
                        pattern: /^[\u4E00-\u9FA5A-Za-z0-9-_]+$/,
                        message: '只能包含中文/英文/数字/下划线/中划线',
                      },
                    ]}
                  >
                    <Input placeholder="名称可由中文/英文/数字/下划线/中划线组成，长度限制32" />
                  </Form.Item>
                  <Form.Item
                    label="endpoint名称"
                    name={['dataSourceInfo', 'endpoint']}
                    rules={[
                      { required: true, message: '请输入endpoint名称' },
                      { max: 64, message: '长度限制64' },
                      // {
                      //   pattern: /^[a-zA-Z]([a-zA-Z0-9-_]*)$/,
                      //   message: '英文字母开头，可由英文/数字/下划线/中划线组成',
                      // },
                    ]}
                  >
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item
                    label="AccessKeyID"
                    name={['dataSourceInfo', 'ak']}
                    rules={[{ required: true, message: '请输入AccessKeyID' }]}
                  >
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item
                    label="AccessKeySecret"
                    name={['dataSourceInfo', 'sk']}
                    rules={[{ required: true, message: '请输入AccessKeySecret' }]}
                  >
                    <Input.Password
                      autoComplete="new-text-field"
                      placeholder="请输入"
                    />
                  </Form.Item>
                  <Form.Item
                    label="virtualhost"
                    required
                    name={['dataSourceInfo', 'virtualhost']}
                    valuePropName="checked"
                  >
                    <Switch defaultChecked={false} />
                  </Form.Item>
                  <Form.Item
                    label="bucket"
                    name={['dataSourceInfo', 'bucket']}
                    rules={[
                      { required: true, message: '请输入bucket' },
                      { max: 63, min: 3, message: '长度限制3~63字节' },
                      {
                        pattern: /^[a-z0-9]([a-z0-9-]*)$/,
                        message: '小写字母或者数字开头，可由小写字母/数字/中划线组成',
                      },
                    ]}
                  >
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item label="预设路径" name={['dataSourceInfo', 'prefix']}>
                    <Input placeholder="请输入" />
                  </Form.Item>
                </>
              ) : getFieldValue('type') === DataSourceType.HTTP ? (
                /*
                  HTTP 数据源（当前未启用）
                  ------------------------------------------------------------------
                  该分支在界面上已被注释，仅保留代码结构作为扩展入口。
                */
                <Form.Item
                  label="显示名称"
                  name={['dataSourceInfo', 'name']}
                  rules={[
                    { required: true, message: '请输入模型名称' },
                    { max: 32, message: '长度限制32' },
                    {
                      pattern: /^[\u4E00-\u9FA5A-Za-z0-9-_]+$/,
                      message: '只能包含中文/英文/数字/下划线/中划线',
                    },
                  ]}
                >
                  <Input placeholder="名称可由中文/英文/数字/下划线/中划线组成，长度限制32" />
                </Form.Item>
              ) : getFieldValue('type') === DataSourceType.MYSQL ? (
                <>
                  {/*
                    MYSQL 数据源连接信息
                    ------------------------------------------------------------------
                    注意：当前 MYSQL 数据源暂不支持模型训练、特征处理类组件，
                    因此顶部增加 Alert 提示。

                    name:     显示名称
                    endpoint: 数据库地址，表单输入 [hostname|ip]:port，
                              前端会拼接前缀 jdbc:mysql://
                    user:     数据库用户名
                    password: 数据库密码
                    database: 数据库名
                  */}
                  <Alert
                    message="MYSQL 数据暂不支持使用模型训练、特征处理类型组件"
                    type="info"
                    style={{ marginBottom: 16 }}
                  />
                  <Form.Item
                    label="显示名称"
                    name={['name']}
                    rules={[
                      { required: true, message: '请输入名称' },
                      { max: 32, message: '长度限制32' },
                      {
                        pattern: /^[\u4E00-\u9FA5A-Za-z0-9-_]+$/,
                        message: '只能包含中文/英文/数字/下划线/中划线',
                      },
                    ]}
                  >
                    <Input placeholder="名称可由中文/英文/数字/下划线/中划线组成，长度限制32" />
                  </Form.Item>
                  <Form.Item
                    label="endpoint名称"
                    name={['dataSourceInfo', 'endpoint']}
                    rules={[
                      { required: true, message: '请输入endpoint名称' },
                      { max: 64, message: '长度限制64' },
                    ]}
                  >
                    <Input
                      addonBefore={'jdbc:mysql://'}
                      placeholder="请输入endpoint 例如: [hostname | ip]:port "
                    />
                  </Form.Item>
                  <Form.Item
                    label="user"
                    name={['dataSourceInfo', 'user']}
                    rules={[{ required: true, message: '请输入user' }]}
                  >
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item
                    label="password"
                    name={['dataSourceInfo', 'password']}
                    rules={[{ required: true, message: '请输入password' }]}
                  >
                    <Input.Password
                      autoComplete="new-text-field"
                      placeholder="请输入"
                    />
                  </Form.Item>
                  <Form.Item
                    label="database"
                    name={['dataSourceInfo', 'database']}
                    rules={[
                      { required: true, message: '请输入database' },
                      { max: 63, min: 3, message: '长度限制3~63字节' },
                      {
                        pattern: /^[a-zA-Z_]([A-Za-z0-9-_]*)$/,
                        message: '字母或下划线开头，可由字母/数字/中划线/下划线组成',
                      },
                    ]}
                  >
                    <Input placeholder="请输入" />
                  </Form.Item>
                </>
              ) : (
                <>
                  {/*
                    ODPS 数据源连接信息
                    ------------------------------------------------------------------
                    project:   ODPS Project 名称
                    name:      显示名称，输入框带 addonBefore={'ODPS-'}
                               提交时 handleOk 会自动再补一次 "ODPS-" 前缀
                    endpoint:  ODPS endpoint
                    accessId:  阿里云 AccessKey ID
                    accessKey: 阿里云 AccessKey Secret
                  */}
                  <Form.Item
                    label="ODPS Project名称"
                    name={['dataSourceInfo', 'project']}
                    rules={[
                      { required: true, message: '请输入ODPS Project名称' },
                      { max: 32, message: '长度限制32' },
                      {
                        pattern: /^[\u4E00-\u9FA5A-Za-z0-9-_]+$/,
                        message: '只能包含中文/英文/数字/下划线/中划线',
                      },
                    ]}
                  >
                    <Input placeholder="名称可由中文/英文/数字/下划线/中划线组成，长度限制32" />
                  </Form.Item>

                  <Form.Item
                    label="显示名称"
                    name={['name']}
                    rules={[
                      { required: true, message: '请输入名称' },
                      { max: 32, message: '长度限制32' },
                      {
                        pattern: /^[\u4E00-\u9FA5A-Za-z0-9-_]+$/,
                        message: '只能包含中文/英文/数字/下划线/中划线',
                      },
                    ]}
                  >
                    <Input
                      placeholder="名称可由中文/英文/数字/下划线/中划线组成，长度限制32"
                      addonBefore={'ODPS-'}
                    />
                  </Form.Item>

                  <Form.Item
                    label="endpoint名称"
                    name={['dataSourceInfo', 'endpoint']}
                    rules={[
                      { required: true, message: '请输入endpoint名称' },
                      { max: 64, message: '长度限制64' },
                    ]}
                  >
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item
                    label="AccessKeyID"
                    name={['dataSourceInfo', 'accessId']}
                    rules={[{ required: true, message: '请输入AccessID' }]}
                  >
                    <Input placeholder="请输入" />
                  </Form.Item>
                  <Form.Item
                    label="AccessKeySecret"
                    name={['dataSourceInfo', 'accessKey']}
                    rules={[{ required: true, message: '请输入AccessKey' }]}
                  >
                    <Input.Password
                      autoComplete="new-text-field"
                      placeholder="请输入"
                    />
                  </Form.Item>
                </>
              );
            }}
          </Form.Item>

          {/*
            节点连接配置
            ------------------------------------------------------------------------------
            使用 Form.List 实现动态节点选择：
              - AUTONOMY 模式：initialValue=[{}]，只给一个空对象，用户可以点击
                “添加节点连接配置”最多增加到 5 个节点。
              - 其他模式：initialValue=[{ nodeId: currentNode.nodeId }]，
                默认选中当前节点且不可删除。

            每个节点表单项：
              - 展示“节点: N”序号
              - 下拉框选择 nodeId（已选节点禁用）
              - 当 fields.length > 1 时显示删除按钮
          */}
          <div className={styles.nodeTitle}>节点连接配置</div>
          <Form.List
            name="nodeIds"
            initialValue={
              isAutonomyMode
                ? [{}]
                : [
                    {
                      nodeId: nodeService.currentNode?.nodeId,
                    },
                  ]
            }
          >
            {(fields, { add, remove }) => (
              <Space direction="vertical">
                <div className={styles.nodeContent}>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space
                      key={key}
                      style={{
                        display: 'flex',
                      }}
                      align="baseline"
                    >
                      {`节点: ${name + 1}`}
                      <Form.Item
                        {...restField}
                        name={[name, 'nodeId']}
                        rules={[{ required: true, message: '请选择节点' }]}
                      >
                        <Select
                          placeholder="请选择"
                          options={nodeOptionsFilter}
                          size="middle"
                          style={{ width: 160 }}
                        />
                      </Form.Item>
                      {fields.length > 1 && (
                        <DeleteOutlined onClick={() => remove(name)} />
                      )}
                    </Space>
                  ))}
                </div>
                {isAutonomyMode && (
                  <div>
                    <Tooltip
                      placement="right"
                      title={fields.length >= 5 ? '最多可添加5个节点' : ''}
                    >
                      <Button
                        disabled={fields.length >= 5}
                        type="link"
                        onClick={() => add()}
                        icon={<PlusOutlined />}
                        className={styles.addBtn}
                      >
                        添加节点连接配置
                      </Button>
                    </Tooltip>
                  </div>
                )}
              </Space>
            )}
          </Form.List>
          {/* 一期没有校验功能 */}
          {/* <span className={styles.nodeStatusTag}>
            {nodeTestContent[nodeStatus as keyof typeof nodeTestContent]}
          </span> */}
        </Form>
      </Drawer>
    </>
  );
};
