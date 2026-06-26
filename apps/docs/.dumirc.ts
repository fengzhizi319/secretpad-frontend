import { defineConfig } from 'dumi';

export default defineConfig({
  publicPath: '/secretpad-frontend/',
  base: '/secretpad-frontend/',
  themeConfig: {
    hd: { rules: [] },
    rtl: true,
    name: 'c-life 前端开发',
    logo: 'https://avatars.githubusercontent.com/u/103737651?s=48&v=4',
    footer: `Open-source MIT Licensed | Copyright © 2023-present
<br />
Powered by c-life`,
    prefersColor: { default: 'auto' },
    socialLinks: {
      github: 'https://github.com/fengzhizi319/secretpad-frontend',
    },
  },
});
