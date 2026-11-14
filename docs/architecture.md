# 架构与维护

## 决策与约束

沿用 Phaser 4 + TypeScript + Vite 静态应用。已有招摇场景使用 Phaser；其他三山使用 Canvas 2D。当前任务不重写引擎，避免改变既有交互。数据只保存在浏览器，不需要登录、数据库或付费服务；刷新保留知识记录，新增山不保存人物坐标。

## 模块与数据流

1. `content.ts` / `mountains.ts` 定义原文、释义、演绎说明、观察点和题目。
2. `main.ts` / `expeditions.ts` 展示场景并接收移动、观察和选择。
3. `progress.mjs` / `expedition-progress.mjs` 校验记录、去重并决定完成状态。
4. `storage.mjs` 读取/写入浏览器存储，显式返回失败；界面保留内存进度并提示。
5. `worldmap.ts` 取场景实际位置，结合 `world-data.mjs` 展示方位、路线与局部坐标。
6. `animal.ts` 展示点击动作；`sound.ts` 按需获取录音、缓存解码结果并管理取消播放。
7. `assets.ts` 统一加入 Vite BASE_URL，使同一份源代码支持域名根目录和 GitHub 仓库子路径。

存档键保持 `shanhai-zhaoyao-v1`、`shanhai-expeditions-v1`，不迁移或清除已有合法记录。存储不可用时不声称已保存。不同浏览器、设备或域名互不共享记录；GitHub Pages 与旧 Sites 域名之间不会自动迁移。

## 运行、检查与发布

Node.js >=22；`npm ci`，`npm run dev`。`npm test` 验证存档与地图规则；`npm run build` 做类型检查和根目录构建。

GitHub Pages 使用 `npm run build:pages`（base=/shanhai-fieldbook/），`npm run preview -- --base=/shanhai-fieldbook/` 可本地检查同样的子路径。产物位于 dist，不提交构建文件。

`.github/workflows/pages.yml`：PR 跑测试和构建；main 测试、构建通过才上传产物和部署。仓库 Settings → Pages 使用 GitHub Actions。源码在 handsun85s/shanhai-fieldbook，公开游戏地址为 https://handsun85s.github.io/shanhai-fieldbook/ 。登录凭据仅由本机 Git Credential Manager 或 GitHub Actions 提供，仓库不包含令牌。

部署方法依据 [Vite 6 静态部署说明](https://v6.vite.dev/guide/static-deploy) 与 [GitHub Pages 文档](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)。

## 维护风险

Phaser 使主脚本约 1.73 MB（gzip 约 404 KB），插画累计体积较大。保留构建警告；低端手机实测前不引入新框架或声称性能已达标。部分源码仍为早期紧凑格式，后续改动时按模块逐步整理，不在本轮大范围重排。

回退使用 `git revert <本轮提交>` 并重新发布，避免硬重置覆盖其他人的工作。具体版本和验收见 progress.md；历史美术与实现文档保留原始背景，当前声音以 WORLD_INTERACTION.md 为准。
