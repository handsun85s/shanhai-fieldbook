# 架构与维护

## 十八卷主线

`journey.html` 是与原游戏同源的轻量入口。它通过 `journey.ts` 打开主线，不下载自由探索所需的 Phaser。首页、山海舆图与全书地图也可打开同一份 `campaign.ts`。四座自由行山通过经过白名单校验的 `mountain` 参数回到原场景。

`chapter-studies.ts` 保存十八个代表站、引文所在段及题目。累计卷印按答对题目的连续记录计算。`book-field.ts` 绘制卷中和逐段步道，`study-plate.ts` 管理图版热点，`south-stops.ts` 管理五处南山专属考察。十八卷主线、原句收集和南山山印分别保存。`public/book/` 按卷提供固定原文与对齐简体，`book-reader.ts` 按需载入，全文检索才请求其他卷。[经文来源](book-sources.md)

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
8. `minimap.ts` / `minimap.css` 提供两种场景共用的常驻小地图。SVG 使用各山原始场景坐标和宽高，只更新人物 transform、附近地点与记录状态；不新增独立动画循环或存档键。底图为游戏导航示意。
9. `navigation.mjs` 的同一河道/桥梁坐标服务渲染、碰撞和寻路；`environment.ts` 生成可复现的树木障碍与静态背景。寻路经桥、检查路径可见性并分段移动，防止大帧时间穿越障碍。
10. `creatures.ts` 统一五种动物三帧图集、原文特征与观察圈；`observation.ts` 管理观察→原文→证据→笔记；`learning.ts` / `notebook.mjs` 校验个人笔记与回想。新增 `shanhai-evidence-v1` 和 `shanhai-sound-v1` 键，不覆盖旧考察记录。
11. `comparison-data.mjs` 提供三项跨山对照及完整性校验；`comparison.ts` 处理选择、逐条反馈、独占试听与键盘焦点。使用 `shanhai-comparison-v1` 保存部分选择，恢复时重新验证完成条件，不改写考察记录。
12. `local-map.ts` 将 `navigation.mjs` 河道与桥梁投影到全图的山内层；小地图默认打开该层。地图选点在原生 dialog 的 close 事件完成停步处理后才派发 `localmaptravel`，避免新路线被关闭清理取消；两个场景分别接收并使用现有寻路器。

存档键保持 `shanhai-zhaoyao-v1`、`shanhai-expeditions-v1`，不迁移或清除已有合法记录。存储不可用时不声称已保存。不同浏览器、设备或域名互不共享记录；GitHub Pages 与旧 Sites 域名之间不会自动迁移。

## 运行、检查与发布

Node.js >=22；`npm ci`，`npm run dev`。`npm test` 验证存档与地图规则；`npm run build` 做类型检查和根目录构建。

GitHub Pages 使用 `npm run build:pages`（base=/shanhai-fieldbook/），`npm run preview -- --base=/shanhai-fieldbook/` 可本地检查同样的子路径。产物位于 dist，不提交构建文件。

`.github/workflows/pages.yml`：PR 跑测试和构建；main 测试、构建通过才上传产物和部署。仓库 Settings → Pages 使用 GitHub Actions。源码在 handsun85s/shanhai-fieldbook，公开游戏地址为 https://handsun85s.github.io/shanhai-fieldbook/ 。登录凭据仅由本机 Git Credential Manager 或 GitHub Actions 提供，仓库不包含令牌。

部署方法依据 [Vite 6 静态部署说明](https://v6.vite.dev/guide/static-deploy) 与 [GitHub Pages 文档](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)。

## 维护风险

Phaser 使主脚本约 1.75 MB（gzip 约 413 KB），插画累计体积较大。第二批素材采用无损 WebP、按山加载；sharp 只在开发时转码。保留构建警告；低端手机实测前不声称性能已达标。部分源码仍为早期紧凑格式，后续改动时按模块逐步整理。

回退使用 `git revert <本轮提交>` 并重新发布，避免硬重置覆盖其他人的工作。具体版本和验收见 progress.md；历史美术与实现文档保留原始背景，当前声音以 WORLD_INTERACTION.md 为准。
