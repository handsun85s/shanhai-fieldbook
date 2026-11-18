# 四种风格 Playground

2026-11-18。用户不喜欢当前整体画面，要求四种不同风格的 playground 供选择。本轮交付为独立的可互动风格样片，不把任何方向提前应用到正式关卡。

入口：`playground.html`。四个可分享参数：`?style=animation`、`?style=pixel`、`?style=clay`、`?style=paper`。

| 编号 | 方向 | 场景与界面 |
| --- | --- | --- |
| 01 | 清新动画 | 明亮手绘动画场景、轻盈圆角、绿与珊瑚橙 |
| 02 | 复古像素 | 16-bit 像素景观、暮色、深蓝面板与方形边框 |
| 03 | 黏土微缩 | 手塑质感、柔和景深、圆润凸起按钮与暖奶油色 |
| 04 | 立体剪纸 | 纸片层叠、朱红靛蓝、纸签与错位投影 |

## 比较方法与范围

同样的杻阳山、鹿蜀、怪水、山石，保持知识文本一致。四款均可点击地面移动、点击观察点走近打开卡片、查看鹿蜀细节、听同一段已许可哼唱、记入手记。小地图随人物更新，切换风格保留本次观察记录和位置，刷新重置试玩记录；选择方向保存在独立的 `shanhai-style-choice-v1` 键。选择仅存于当前浏览器，不会自动向开发者发送，也不会修改正式游戏。

这是轻交互样片：背景是完整风格图，叠加移动旅人标记和观察热点；未制作各风格的完整角色骨骼、独立四山关卡、碰撞或完整寻路。小地图仅表示样片坐标，不用作古籍方位推断。场景中的兽首山峰、植被、溪流形状与光照明确标为美术演绎。

原文依据：[《山海经·南山经》杻阳段](https://zh.wikisource.org/zh-hans/山海經/南山經)，本轮实际查阅并核对赤金/白金、鹿蜀与怪水描述。声音复用 `public/assets/audio-v2/lushu.mp3`，CC0 来源见该目录 LICENSES.md。

## 实现与验收

`src/playground.ts` / `src/playground.css` 为独立界面；`vite.config.ts` 将原游戏和 playground 作为两个 HTML 入口构建。原游戏不导入样片样式，也不加载这些新图像。

验收：四种风格各自可直达，切换更新场景/界面/URL；点击观察点能到达并打开正确卡片；记录不重复；切换保留记录；选择刷新后恢复；关闭或切换停止音频；390×844 无横向溢出；原游戏与 Pages 子路径仍能构建和打开。

本轮实际浏览器结果：鹿蜀点击到达、细节放大、声音播放和收录通过；像素切换后保留 1/3；对比面板进入黏土通过；手机剪纸山石卡片与收录到 2/3 通过；选择并刷新恢复通过。手机尺寸验证为模拟视口，非真实设备。

## 图片生成记录

使用内置 image_gen 工具，每种风格独立调用，非 CLI。四张图已复制到项目 `public/assets/style-lab/`：animation.png、pixel.png、clay.png、paper.png。生成图各约 2.7–3.7 MB；完整样片首次浏览四款需下载约 12.7 MB 图片。图片原图保留，不覆盖原游戏素材。

每次生成提示由下列共同提示与对应风格提示直接拼接，`transparent_background=false`。

### 共同提示

```text
Use case: stylized-concept. Asset type: full-bleed landscape background for an interactive 2D Shan Hai Jing game art-style playground, for age 10+. Wide landscape composition approximately 16:9, no text, no lettering, no UI, no border, no watermark. Same setting in all variants: Niuyang mountain, a winding turquoise creek curving from upper right to lower left, a walkable broad meadow across the lower half, forest and fantastical Chinese mountains in the distance, one small interesting rock formation in the lower left and blue flowering plants in lower right. Main subject: ONE mythical Lushu at roughly 62 percent across and 55 percent down, in a clearing, its full body occupying roughly 22 percent of image width. A Lushu is anatomically horse-shaped, exactly four legs, a WHITE head, tawny body with clearly visible black TIGER STRIPES, a RED flowing tail, no antlers, no wings, not a deer, not a tiger. Clear readable silhouette and all limbs in frame. No people. Keep composition legible as an actual game scene, beautiful and polished.
```

### 01 / animation

```text
Style: premium hand-painted 2D animation adventure background, crisp deliberate silhouettes, softly painted cel-shaded horse, lush emerald and mint trees, clear cerulean creek, warm golden afternoon sunshine, rich coral-orange accent foliage, optimistic sense of discovery, broad expressive color shapes, detailed elegant environment, no parchment, no washed-out beige, no watercolor-paper texture.
```

### 02 / pixel

```text
Style: exceptionally beautiful 16-bit pixel art RPG landscape with deliberate visible square pixel clusters, pixel-perfect geometry, limited rich jewel-tone palette, deep indigo mountains and vivid emerald trees, amber flowers, turquoise water with pixel highlights, warm sunset sky. Main creature also strictly pixel art. No smooth gradients or painted strokes, no vector illustration. Crafted indie adventure pixel art with fine pixel-level detail, readable at small scale.
```

### 03 / clay

```text
Style: exquisite handcrafted stop-motion clay miniature diorama seen at gentle elevated three-quarter angle. Rounded sculpted trees, layered teal hills, real tiny clay grass and handcrafted river, subtly visible clay fingerprints, soft peach cream sky, playful sophisticated toy-like forms and warm studio sunlight, beautifully lit tactile surfaces and soft ambient shadows, a sculpted clay Lushu with white head, tiger stripes and red tail. Strong miniature physical material character, not flat illustration, not low-poly, not plastic shine.
```

### 04 / paper

```text
Style: sophisticated theatrical layered paper-cut diorama, Chinese folk papercut reimagined for a contemporary adventure game. Flat cut silhouettes with precise intricate cutouts, physical stacked card layers with visible deep cast shadows, bold vermilion and peach mountains, dark navy forest and turquoise river, cream sky, gold botanical details. The horse is a clearly layered cut-paper Lushu, white head and black stripes on ochre cut paper body and red paper tail. Distinctive composition with depth from separate paper planes, tactile fibrous paper, no painted rendering, no pixels, no clay.
```
