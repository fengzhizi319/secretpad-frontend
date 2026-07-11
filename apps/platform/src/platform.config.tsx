import { ReactComponent as Logo } from '@/assets/logo.svg';

const hour = new Date().getHours();
let time = '';
if (hour < 12) {
  time = '上午';
} else if (hour > 18) {
  time = '晚上';
} else if (hour >= 12) {
  time = '下午';
}

export default {
  theme: {
    token: {
      // 与 docs/front-end/prototype 高保真原型保持一致的 Apple 设计系统
      colorPrimary: '#0071e3',
      colorSuccess: '#34c759',
      colorWarning: '#ff9500',
      colorError: '#ff3b30',
      colorInfo: '#0071e3',
      colorText: '#1d1d1f',
      colorTextSecondary: '#86868b',
      colorBorder: 'rgba(0, 0, 0, 0.08)',
      borderRadius: 10,
      fontSize: 14,
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Icons", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
    },
  },
  slogan: '科技护航数据安全', // 全局标语
  header: {
    logo: <Logo />, // 左上角Logo React Component
    rightLinks: true, // boolean | React Component
  },
  createProject: {
    showTemplate: true, // 创建项目时是否显示模板选项
  },
  home: {
    HomePageTitle: `${time}好，欢迎来到 c-life 隐私计算平台`,
  },
  guide: true, //
};
