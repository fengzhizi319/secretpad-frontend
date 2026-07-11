import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import React from 'react';

import { useAppTheme } from './theme-context';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useAppTheme();
  return (
    <Tooltip title={theme === 'light' ? '切换深色模式' : '切换浅色模式'}>
      <Button
        type="text"
        shape="circle"
        icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
        onClick={toggleTheme}
      />
    </Tooltip>
  );
};
