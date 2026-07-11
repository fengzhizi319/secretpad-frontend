import Icon from '@ant-design/icons';
import {
  AppstoreOutlined,
  ClusterOutlined,
  DatabaseOutlined,
  FileProtectOutlined,
  MessageOutlined,
  RobotOutlined,
  SafetyOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { Button } from 'antd';
import React, { useEffect } from 'react';
import { history } from 'umi';

import { ReactComponent as ManagedNode } from '@/assets/menu-node.svg';
import { ReactComponent as projectManager } from '@/assets/project-manager.svg';
import { AllDataSourcesComponent } from '@/modules/all-data-sources';
import { AllDataTablesComponent } from '@/modules/all-data-tables';
import { DashboardComponent } from '@/modules/dashboard';
import { HomeLayout } from '@/modules/layout/home-layout';
import { HomeLayoutService } from '@/modules/layout/home-layout/home-layout.service';
import { ManagementLayoutComponent } from '@/modules/layout/management-layout';
import { LoginService } from '@/modules/login/login.service';
import { ManagedNodeListComponent } from '@/modules/managed-node-list';
import { PrivacyScenesComponent } from '@/modules/privacy-scenes';
import { ProjectListComponent } from '@/modules/project-list';
import { ResultManagerComponent } from '@/modules/result-manager/result-manager.view';
import { useModel } from '@/util/valtio-helper';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  key: string;
}

const buildExternalComponent = (label: string, path: string) => (
  <div style={{ padding: 40, textAlign: 'center' }}>
    <div style={{ marginBottom: 16, color: 'var(--sp-text-secondary)' }}>
      {label} 为独立页面，点击下方按钮跳转
    </div>
    <Button type="primary" onClick={() => history.push(path)}>
      进入{label}
    </Button>
  </div>
);

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: <AppstoreOutlined />,
    component: <DashboardComponent />,
    key: 'dashboard',
  },
  {
    label: '节点管理',
    icon: <Icon component={ManagedNode} />,
    component: <ManagedNodeListComponent />,
    key: 'node-management',
  },
  {
    label: '数据源',
    icon: <DatabaseOutlined />,
    component: <AllDataSourcesComponent />,
    key: 'data-source',
  },
  {
    label: '数据表',
    icon: <TableOutlined />,
    component: <AllDataTablesComponent />,
    key: 'data-management',
  },
  {
    label: '项目管理',
    icon: <Icon component={projectManager} />,
    component: <ProjectListComponent />,
    key: 'project-management',
  },
  {
    label: '结果管理',
    icon: <FileProtectOutlined />,
    component: <ResultManagerComponent />,
    key: 'result',
  },
  {
    label: '隐私组件场景',
    icon: <SafetyOutlined />,
    component: <PrivacyScenesComponent />,
    key: 'privacy-scenes',
  },
  {
    label: 'DAG 画布',
    icon: <ClusterOutlined />,
    component: buildExternalComponent('DAG 画布', '/dag'),
    key: 'dag',
  },
  {
    label: '消息中心',
    icon: <MessageOutlined />,
    component: buildExternalComponent('消息中心', '/message'),
    key: 'message',
  },
  {
    label: '模型管理',
    icon: <RobotOutlined />,
    component: buildExternalComponent('模型管理', '/model-submission'),
    key: 'model',
  },
];

const HomePage = () => {
  const homeLayoutService = useModel(HomeLayoutService);
  const loginService = useModel(LoginService);
  useEffect(() => {
    homeLayoutService.setSubTitle('Center');
    homeLayoutService.setBgClassName('centerBg');
    getUserInfo();
  }, []);

  const [hasNotNodeMenu, setHasNotNodeMenu] = React.useState(true);
  useEffect(() => {
    // EDGE 平台用户在center平台的账号不能展示节点注册页面
    if (
      loginService.userInfo?.platformType === 'CENTER' &&
      loginService.userInfo?.ownerType === 'EDGE'
    ) {
      setHasNotNodeMenu(true);
    } else {
      setHasNotNodeMenu(false);
    }
  }, [loginService.userInfo]);

  const getUserInfo = async () => {
    await loginService.getUserInfoAsync();
  };

  return (
    <HomeLayout>
      <ManagementLayoutComponent
        menuItems={
          hasNotNodeMenu
            ? menuItems.filter((item) => item.key !== 'node-management')
            : menuItems
        }
        defaultTabKey="dashboard"
      />
    </HomeLayout>
  );
};

export default HomePage;
