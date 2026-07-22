English (US) | [简体中文](README.zh-Hans.md)

# SecretPad Frontend

> SecretFlow 隐私计算平台 Web 管理控制台前端，基于 React 18 + Umi 4 + Ant Design 5 构建
> 。

## 技术栈

| 技术       | 版本     | 用途            |
| ---------- | -------- | --------------- |
| React      | 18       | UI 框架         |
| Umi        | 4        | 应用框架        |
| Ant Design | 5        | 组件库          |
| TypeScript | 4.9      | 类型安全        |
| Valtio     | 1.x      | 状态管理        |
| @antv/x6   | 2.x      | DAG 画布        |
| pnpm + Nx  | 8.8 / 15 | Monorepo 工程化 |

## 项目结构

```
apps/
├── platform/       # 主应用 (SecretPad Web)
└── docs/           # Dumi 文档站
packages/
├── dag/            # @secretflow/dag DAG 图引擎
└── utils/          # @secretflow/utils 共享工具
tooling/
├── eslint/         # 共享 ESLint 配置
├── stylelint/      # 共享 Stylelint 配置
├── tsconfig/       # 共享 TypeScript 配置
├── jest/           # 共享 Jest 配置
└── tsup/           # 共享 tsup 构建配置
```

## 快速开始

### 环境要求

- Node.js >= 16.14.0（推荐 20.x，见 `.nvmrc`）
- pnpm 8.8.0

### 安装与开发

```bash
# 安装依赖并构建共享包
pnpm bootstrap

# 启动开发服务器 (http://localhost:8000)
pnpm --filter secretpad dev

# 构建
pnpm --filter secretpad build

# 测试
pnpm --filter secretpad test

# Lint / 格式化
pnpm --filter secretpad lint:js
pnpm fix
pnpm format-all
```

## 代码规范

- **Prettier**: printWidth 88, singleQuote, trailingComma all
- **ESLint**: `@secretflow/config-eslint` + 项目根覆盖
- **Stylelint**: `.less` 文件规范
- **Commit**: Conventional Commits (Husky + commitlint)
- **lint-staged**: 提交时自动运行 prettier / stylelint / eslint

## 部署

开发服务器通过 Umi proxy 将 `/api` 请求代理到后端 (默认 `https://localhost:8443`)。生产
构建产物位于 `apps/platform/dist/`，由后端 Spring Boot 静态资源服务。

## 贡献

See [CONTRIBUTING.md](CONTRIBUTING.md) for more info.

## 安全

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.
