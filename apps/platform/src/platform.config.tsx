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
      colorPrimary: '#0068fa',
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
    HomePageTitle: `${time}好👋，欢迎来到 c-life 隐私计算平台`,
  },
  guide: true, //
};
