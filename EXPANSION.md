# 新山岳与声音（2026-11-13）

本轮新增堂庭、杻阳、青丘三座可探索山岳，每座三个观察点、独立持久化记录。并非完成整部《山海经》；中间未制作山岳已在舆图注明。原招摇山存档键保持不变。

文本依据：https://zh.wikisource.org/zh-hans/山海經/南山經 （正文与注文分开表述）。白猿、黄金、水玉来自堂庭段；鹿蜀与旋龟、怪水东流来自杻阳段；九尾狐、山阳之玉、英水南流来自青丘段。没有把各山冒充为原文相邻。

声音：src/sound.ts 使用 Web Audio 原创合成。低音量滤波噪声营造风水环境；鹿蜀用旋律演绎“如谣”，旋龟用短促木质冲击音演绎“如判木”，九尾狐用轻柔起伏高音演绎“如婴儿”。不使用真实儿童录音，不声称复原古代叫声；狌狌与白猿没有加入正文未规定的叫声。全部问题可通过文字线索完成。用户手势后启动音频，可静音、调节音量，页面隐藏时淡出。

图像生成：透明 PNG，public/assets/art-v2/{lushu,xuangui,ninefox,whiteape,quartz}.png。沿用工笔淡彩方向。九尾狐经两轮修改，最终补足底部第九条尾巴；四足、九个分离尾尖人工检查。水玉依据注文单独制作水晶示意图；晶簇排列为演绎。

最终初始提示词：

## lushu

A complete full-body mythical Lushu from Shan Hai Jing: anatomically horse-shaped quadruped, white head clearly distinct, body with bold dark tiger stripes on tawny fur, vivid rusty-red flowing tail. Exactly four legs, no antlers, no wings. Facing right three quarter view. Delicate Chinese gongbi natural history illustration, muted mineral watercolor, fine hair detail, consistent with sophisticated educational field guide for children 10+. Entire animal inside frame, transparent background, no text, no ground, no scenery.

## xuangui

Complete full-body mythical Xuangui from Shan Hai Jing: turtle body and textured dark domed turtle shell, distinctive bird head with beak on long neck, long serpent-like tapering curved tail. Four turtle legs, exactly one bird head, no wings, no horns. Side three quarter view facing right. Delicate Chinese gongbi ink and muted mineral watercolor, detailed realistic natural history illustration for friendly educational game age10+, restrained sage ochre stone grey colors. Whole creature in frame with margins, transparent background, no scenery no text.

## ninefox

Full body mythical nine-tailed fox for Chinese natural history game. ONE elegant fox body with EXACTLY NINE large distinct tails fanning out separately, countable from their nine separate tips, warm ivory fox fur and subtle ochre accents, fine individual hairs, anatomically fox-like head and paws, four legs. Gentle alert wild creature, not human, no clothes, no jewelry. Chinese gongbi ink and mineral watercolor, very detailed refined field guide aesthetic. Entire body and ALL nine tails inside frame with margin. True transparent background, no scenery no text.

## whiteape

One complete full-body white-furred long-armed primate perched with feet on a small simple branch, white ape from Chinese ancient natural history. Clearly white ivory coat, long arms and slender limbs, dark kind face, no tail, no clothes no jewelry. Three quarter side view. Delicate Chinese gongbi ink outlines and muted mineral watercolor, exceptionally fine fur detail, refined field-guide illustration suitable age10+. Entire animal visible, transparent background with no scenery or text.

## ninefox 修正

第一轮：将尾部改成分离、可数的扇形；仍为八尾。第二轮保留已有八条尾巴，额外在最低处添加一条，透明背景。最终文件来自 exec-7de9f40c-d3fd-4e56-8f74-bc0c97ca87b7.png。

## quartz

Transparent natural history game asset of a single rough rock with a modest cluster of clear colorless QUARTZ crystals, recognizably hexagonal prisms with pointed terminations, some translucent cloudy inclusions and delicate fine facets. Small moss at base. Chinese gongbi mineral watercolor painted field guide, warm parchment-compatible lighting, accurate quartz morphology but not exaggerated glowing fantasy gems. Entire rock inside frame, no scenery, no lettering, true alpha background.

