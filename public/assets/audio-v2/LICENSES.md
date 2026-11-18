# 声音录音素材与许可

制作日期：2026-11-14。以下是原文声音比喻的录音示例，不是神兽实录，也不是古代声音复原。哼唱、木裂和婴儿声都来自真实录音，替代上一版的简单合成音符。

三个来源在各自 Freesound 素材页均标注 **Creative Commons 0（CC0 1.0）**：https://creativecommons.org/publicdomain/zero/1.0/ 。公开分享的高质量 MP3 预览可直接访问；没有使用需要登录的原始 WAV 下载。

## 鹿蜀：lushu.mp3

- 原素材：woman humming
- 作者：PSsoundproject
- 来源：https://freesound.org/people/PSsoundproject/sounds/183565/
- 公开音频：https://cdn.freesound.org/previews/183/183565_3363267-hq.mp3
- 作者说明：本人哼唱一段无名、民谣风格的旋律。
- 使用原录音的 2.000–7.000 秒；输出 5.000 秒。
- 对应原文“其音如谣”及注文“如人歌声”；未改音高、未合成旋律。
- 输出 SHA-256：69a903130b4049b0c0695d1da06024e574c0ba5d30f40d6817148ddd2c46cd2e

## 旋龟：xuangui.mp3

- 原素材：dry branches cracking.aiff
- 作者：SoundCollectah
- 来源：https://freesound.org/people/SoundCollectah/sounds/109357/
- 公开音频：https://cdn.freesound.org/previews/109/109357_1868848-hq.mp3
- 作者说明：户外录制干树枝裂开的声音。
- 使用原录音的 0.000–4.593 秒；输出约 4.593 秒。
- 对应“其音如判木”及注文的破木声；取真实木质纤维裂响作为声音参照。
- 输出 SHA-256：e6e8e1e11b548eefc6d56696e4adf252aa96e35169c35c2a88013058d9b3bd66

## 九尾狐：ninefox.mp3

- 原素材：Crying baby 1
- 作者：MBPL
- 来源：https://freesound.org/people/MBPL/sounds/667199/
- 公开音频：https://cdn.freesound.org/previews/667/667199_14585550-hq.mp3
- 作者说明：婴儿分三次呼吸发出的哭声，作者已削弱无关噪声。
- 使用原录音的 0.000–3.224 秒；输出约 3.224 秒。
- 对应“其音如婴儿”；“哭声”是本次示例的具体选择，原文并未指定情绪或确切哭腔。
- 输出 SHA-256：f4e1b17c44027393917dcf56c1c44a881e720dddfce78182df25bf09c4d94026

## 处理与验证

使用 FFmpeg 解码，混为单声道 44.1 kHz；裁剪后加 60 ms 淡入、180 ms 淡出。线性增益取“目标 RMS −24 dBFS”与“样本峰值上限 −7 dBFS”两项中较低者，保留木裂瞬态。以 128 kbps MP3 输出。未使用生成音、变声或移调。

重新解码检查三段文件非静音、无数字削波。解码后峰值分别为 −14.43、−6.61、−9.59 dBFS；整体 RMS 分别为 −24.45、−34.11、−24.45 dBFS。木裂为稀疏瞬态，所以整体 RMS 较低。机器测量详情及原始预览文件 SHA-256 见 audio-metadata.json。

未通过现场扬声器进行听觉验收；素材类型依据作者的录音描述和公开元数据核实。最终听感、播放音量与儿童适龄体验仍需实际试听。

## 夔的远雷参照

《大荒东经》写夔“其声如雷”。游戏采用 Fission9 于 2019 年 10 月 16 日用 Zoom H4n Pro 录制的远雷示例，文件为 `kui.mp3`。使用作者公开提供的约 8 秒 MP3 预览，点击才播放。[原录音与 CC0 许可](https://freesound.org/people/Fission9/sounds/581124/) · [源音频](https://cdn.freesound.org/previews/581/581124_9395330-hq.mp3)
