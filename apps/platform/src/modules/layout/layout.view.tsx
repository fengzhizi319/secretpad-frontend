import { App } from 'antd';
import { Outlet } from 'umi';
import ErrorBoundary from '@/components/error-boundary';

import styles from './index.less';

export enum GlobalLayout {
  main = 'main',
  drawer = 'drawer',
}

const GlobalLayoutComponent = () => {
  return (
    <App style={{ height: '100%' }}>
      <div className={styles.root}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>
    </App>
  );
};

export default GlobalLayoutComponent;
