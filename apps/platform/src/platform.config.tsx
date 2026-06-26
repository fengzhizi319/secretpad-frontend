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
      colorPrimary: '#2563eb',
      borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      boxShadowSecondary: '0 6px 24px rgba(0, 0, 0, 0.12)',
    },
  },
  slogan: 'c-life，让数据流通更安全', // 全局标语
  header: {
    logo: <Logo />, // 左上角Logo React Component
    rightLinks: true, // boolean | React Component
  },
  createProject: {
    showTemplate: true, // 创建项目时是否显示模板选项
  },
  home: {
    HomePageTitle: `${time}好👋，欢迎来到 c-life 开源平台`,
  },
  guide: true, //
};
