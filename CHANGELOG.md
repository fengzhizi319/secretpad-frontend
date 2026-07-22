# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- SECURITY.md / SECURITY.zh-Hans.md 安全漏洞报告流程
- CHANGELOG.md（本文件）
- .nvmrc 固定 Node.js 版本
- CI 多 Node 版本矩阵测试 (18.x / 20.x / 22.x)
- README 增强：架构说明、开发指南、构建部署

### Changed

- 清理 root package.json 中错放的运行时依赖（移至 apps/platform）
- CI workflow 升级 Node 版本矩阵

## [1.0.0] - 2024-06-01

### Added

- SecretPad 前端平台 (React 18 + Umi 4 + Ant Design 5)
- DAG 画布引擎 (@secretflow/dag)
- 共享工具包 (@secretflow/utils)
- 隐私计算组件模板（脱敏/DP/K-匿名/查询混淆）
- Valtio 状态管理
- pnpm + Nx monorepo 工程化
- ESLint + Stylelint + Prettier 代码规范
- Husky + lint-staged + commitlint 提交规范
- Jest + React Testing Library 测试
- GitHub Actions CI (lint + typecheck + test)
