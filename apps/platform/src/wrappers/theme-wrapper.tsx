import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import React from 'react';
import { Outlet } from 'umi';

import {
  appThemeConfig,
  ThemeProvider,
  useAppTheme,
} from '@/modules/theme/theme-context';

const ThemedApp: React.FC = () => {
  const { theme } = useAppTheme();
  return (
    <ConfigProvider theme={appThemeConfig[theme]} locale={zhCN}>
      <Outlet />
    </ConfigProvider>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <ThemedApp />
  </ThemeProvider>
);

export default App;
