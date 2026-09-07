---
name: "release-deploy"
description: "一键发布流程：更新文档 → 提交代码 → 部署到 GitHub Pages。用户说「发布」「收尾」「更新文档 提交代码 部署项目」时调用。"
---

# Release & Deploy 一条龙

执行标准发布流程：**更新文档 → 提交代码 → 部署到 GitHub Pages**。

## 触发时机

用户说出以下任意一种，就调用本 Skill 执行完整发布流程：

- "更新文档 提交代码 部署项目"
- "发布" / "上线" / "收尾"
- "累了，提交部署" 等类似意图

## 执行步骤

### 1. 更新文档

- 检查 `README.md` 是否与当前代码状态一致
- 重点核对：特性列表、项目结构、技术栈、Boss/成就/牌型等数量
- 删除已废弃文件的引用，新增文件补到结构里
- 有 `.trae.md` 的话也检查规则是否需要更新

### 2. 提交代码

- 先跑测试：`npm test`，确保全部通过再提交
- 用 `git status --short` / `git diff --stat` 看改动范围
- 使用 Conventional Commits 规范：`type(scope): description`
- 如果改动多且跨模块，写多行 body 列出主要变更点
- **不要提交**：`.env`、密钥、临时文件、node_modules、dist
- 提交后推送到 `origin master`（或当前主分支）

### 3. 部署到 GitHub Pages

- **默认部署 GitHub Pages**，不要部署到 IGA Pages 或其他平台
- 构建：`npm run build`
- 部署：`npx gh-pages -d dist`
- 部署成功后把线上地址发给用户
- 如果项目有自定义域名，提醒用户检查 CNAME

## 注意事项

- 测试失败时不要硬提交，先修复再继续
- 如果用户只说了其中一步（比如只说"提交"），只做那一步，不要全跑
- 部署失败时检查 base 路径、仓库名是否匹配
- 始终在项目根目录执行命令
