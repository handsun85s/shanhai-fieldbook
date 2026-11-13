# 第二版美术依据与素材

2026-11-13。范围仍为招摇山一段，替换原先几何占位形象，采用工笔线描、淡彩与自然观察图鉴的视觉方向。六张图由图像生成工具生成，原图保留；项目素材位于 public/assets/art-v2/。这些是当代美术演绎，不是古代插图摹本，也不声称是神话物种的唯一复原。

## 可核对的依据

文本：维基文库《山海经·南山经》正文与附注：https://zh.wikisource.org/zh-hans/山海經/南山經

|对象|来自文本的约束|本作补充的表现|
|---|---|---|
|狌狌|状如禺、白耳、伏行人走|褐色体毛、脸部、比例、姿态切换频率；不等同某现代物种|
|祝余|状如韭而青华|细长带状叶与青蓝花；具体花序、根系、花瓣与青色色调为创作|
|迷榖|状如榖而黑理，其华四照；注文“榖，楮也”|参考楮的锯齿及部分裂叶；树形、花色、光效为创作|
|金玉|多金玉|粗糙山岩、青绿色断面、金色斑点；不指定矿物种、成分或晶形|
|背景树与旅人|没有相应具体外观描述|统一视觉氛围的完整创作，不作为物种识别依据|

## 集成方式

- 地图与图鉴复用同一 PNG，避免现场外观和观察题图不一致。
- 狌狌原图包含两个姿态，Phaser 运行时裁出伏行与直立帧；原图不被破坏。
- 观察面板和已解锁手记可打开图鉴，100%–300% 放大并滚动查看，支持关闭按钮与 Escape。
- 金玉是可选观察点，原有五项学习进度与存档不变。
- 地图支持 65%–160% 缩放；河道和道路使用平滑曲线，水面运动沿同一河道曲线。
- 所有图鉴均标出文本依据与演绎边界；没有把画面补充细节写成古籍知识。

## 素材与最终提示词

所有生成请求均设置 transparent_background: true。原始工具输出保留于用户的 .codex/generated_images 目录；项目内使用以下复制件。

### shengsheng

文件：`public/assets/art-v2/shengsheng.png`

```text
Use case: scientific-educational. Asset: transparent 2D game character sprite sheet, two poses of the SAME mythological beast 狌狌 Shengsheng from Shanhaijing. Fine Chinese gongbi natural-history illustration, exquisite brush hair and muted mineral pigments, softly shaded volume, sophisticated illustrated storybook, not cartoon emoji, not photoreal. Source constraints: its form resembles a primate (禺), conspicuously WHITE FUR on BOTH EARS; it moves on all fours and also runs upright like a person. Brown russet fur, expressive attentive dark eyes, natural primate face, proportionate small head, long limbs, hands and feet clearly anatomically coherent, no horns, no wings, no accessories. Wide landscape image, EXACTLY TWO separate full-body poses: LEFT half on all fours walking facing right three-quarter view; RIGHT half upright walking facing right three-quarter view. Both identical character design, clearly separated by generous transparent gutter, aligned ground baseline near bottom, complete feet and ears visible, roughly same physical scale. Each pose fits its own half with generous margins. True transparent background, no paper rectangle, no scenery, no shadows outside sprite, no text. Natural-history fantasy interpretation, not a modern gorilla or plush toy.
```

### zhuyu

文件：`public/assets/art-v2/zhuyu.png`

```text
Use case: scientific-educational. Asset: one transparent 2D botanical sprite and fieldbook specimen illustration of 祝余 Zhuyu from Shanhaijing. Exquisite Chinese gongbi botanical painting, fine precise outlines, mineral-pigment washes, highly detailed leaf veins and petals, coherent muted sage and teal palette. Source features: 其状如韭而青华: a clump of slim flat chive-like strap leaves emerging from basal tuft, elegantly arching long narrow leaves, small BLUE-GREEN flowers on slender stalks. Draw one naturally irregular clump with six delicate clusters of small blue-green flowers, clear leaf structure, no broad leaves, no red fruit, no giant fantasy orchid, no eyeballs. All plant visible from root crown to tips, three-quarter orthographic game view, no cut-off foliage. Isolated TRUE transparent background, no pot, no ground patch, no paper, no text or border. Beautiful high-detail herbarium-like specimen readable at small game scale. Flower details are artistic interpretation.
```

### migu

文件：`public/assets/art-v2/migu.png`

```text
Use case: scientific-educational. Asset: transparent 2D tree sprite and botanical fieldbook illustration of 迷榖 Migu from Shanhaijing. Fine Chinese gongbi landscape botanical art, highly detailed elegant fine brushwork and watercolor mineral pigments. Source features: shaped like 榖 (traditionally glossed as paper mulberry), conspicuous BLACK GRAIN/STRIATIONS in gnarled bark, flowers radiating a gentle light in all directions. One complete medium-height mature tree: twisting grey-brown trunk with dark nearly black flowing bark striations, visible exposed root flare, branching elegant silhouette, leaves resembling paper mulberry: broad ovate serrated leaves mixed with a few lobed leaves, sage green. Small pale ivory-green flower clusters among the leaves with subtle warm radiance, restrained bloom; not a bare dead tree decorated with yellow balls. Elegant asymmetric canopy with openings revealing branches. Three-quarter orthographic game perspective, complete tree centered, no crop, roots at bottom. True transparent background, no scenery, no paper rectangle, no label. Detailed enough for zoomed examination; rich natural form, not geometric circles.
```

### stone

文件：`public/assets/art-v2/stone.png`

```text
Use case: scientific-educational. Asset: transparent 2D environmental object sprite for a Chinese mythological exploration game, one small natural outcrop of rough stones evoking 招摇山 多金玉. Exquisite gongbi landscape painting with finely layered ink texture strokes and muted mineral washes. A cohesive cluster of 3 weathered grey-green rocks, one fractured face reveals a SUBTLE pale celadon, waxy translucent jade-like interior in natural rough matrix, another rock has a few SMALL dull warm metallic flecks in cracks. Predominantly natural rugged stone, fine geological texture, small moss patches and a fern at base. This is an artistic evocation of ancient 金玉, NOT exact mineral identification. Avoid giant crystal spikes, polished gems, gold bars, neon glow, jewelry, treasure chest. Three-quarter orthographic game view, distinct silhouette, complete boulders, isolated on true transparent background with no ground plane/paper/text/shadow rectangle. Beautiful understated detail, harmonious sage, slate, ochre.
```

### grove

文件：`public/assets/art-v2/grove.png`

```text
Create one beautiful mature Chinese broadleaf evergreen woodland tree as a transparent 2D exploration game asset, three-quarter slightly elevated view, delicate Chinese gongbi ink drawing and muted mineral pigment watercolor on paper. Elegant intricate grey-brown branching trunk, airy layered crown of individually visible small lanceolate olive green leaves, fine veins, light moss at exposed root base. Natural asymmetry, full tree silhouette entirely inside canvas with generous transparent margin. Warm cream highlights, sage and olive greens, restrained natural-history illustration, richly hand painted detail, sophisticated not cartoon. Soft small grounding shadow. No sky, no landscape, no lettering, no decorative frame. True transparent alpha background. This is an imaginative background woodland tree, not a precise botanical species identification. Height greater than width. Match gentle Chinese illustrated field-guide game aesthetic.
```

### traveler

文件：`public/assets/art-v2/traveler.png`

```text
One small young Chinese mountain explorer character, full body standing, facing right in three quarter profile, transparent 2D game sprite. Age about 12, calm curious expression, practical muted brick red loose tunic, sage-green trousers and cloth boots, small woven backpack, soft straw sunhat, holding a simple wooden walking staff. Delicate Chinese gongbi line and muted mineral watercolor, fine believable clothing folds, lovely warm hand-painted natural-history storybook aesthetic with realistic anatomy, not chibi or geometric cartoon. Top-down game slightly elevated view, full figure and staff entirely inside frame with generous clear margin, no scenery, no text, no weapons, true transparent background. Height greater than width.
```


