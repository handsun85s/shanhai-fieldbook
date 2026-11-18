# 《山海经》经文来源

本作收录中文维基文库《山海經》目录下五篇山经、十三篇海经的正文，共 868 段。底本含 31,213 个汉字，汉字数按 Unicode Han 字符统计，标点另计。游戏的卷一至卷十八依目录中的篇序编号。[维基文库总目录](https://zh.wikisource.org/wiki/山海經)

古籍原作在维基文库标为公有领域。电子录入和标点由中文维基文库贡献者整理，本作对可受保护的整理部分沿用 CC BY-SA 4.0。各卷数据的 `source` 和下表链接可查固定版本及编辑历史。本作另做了正文提取、分段和简体转换。[共享协议](https://creativecommons.org/licenses/by-sa/4.0/deed.zh-hans)

| 篇 | 固定底本 | 正文段数 |
| --- | --- | ---: |
| 1 | [南山经](https://zh.wikisource.org/w/index.php?oldid=2650929) | 43 |
| 2 | [西山经](https://zh.wikisource.org/w/index.php?oldid=2650930) | 82 |
| 3 | [北山经](https://zh.wikisource.org/w/index.php?oldid=442532) | 92 |
| 4 | [东山经](https://zh.wikisource.org/w/index.php?oldid=310474) | 51 |
| 5 | [中山经](https://zh.wikisource.org/w/index.php?oldid=8736800) | 213 |
| 6 | [海外南经](https://zh.wikisource.org/w/index.php?oldid=310700) | 23 |
| 7 | [海外西经](https://zh.wikisource.org/w/index.php?oldid=427605) | 23 |
| 8 | [海外北经](https://zh.wikisource.org/w/index.php?oldid=442531) | 22 |
| 9 | [海外东经](https://zh.wikisource.org/w/index.php?oldid=427604) | 16 |
| 10 | [海内南经](https://zh.wikisource.org/w/index.php?oldid=311574) | 18 |
| 11 | [海内西经](https://zh.wikisource.org/w/index.php?oldid=311596) | 24 |
| 12 | [海内北经](https://zh.wikisource.org/w/index.php?oldid=1161063) | 27 |
| 13 | [海内东经](https://zh.wikisource.org/w/index.php?oldid=12386685) | 44 |
| 14 | [大荒东经](https://zh.wikisource.org/w/index.php?oldid=331930) | 36 |
| 15 | [大荒南经](https://zh.wikisource.org/w/index.php?oldid=313874) | 33 |
| 16 | [大荒西经](https://zh.wikisource.org/w/index.php?oldid=313887) | 50 |
| 17 | [大荒北经](https://zh.wikisource.org/w/index.php?oldid=316477) | 32 |
| 18 | [海内经](https://zh.wikisource.org/w/index.php?oldid=2642240) | 39 |

## 整理方式

1. 从 MediaWiki 官方 API 下载各页固定版本的维基文本，并逐篇核对源文本 SHA-1。
2. 保留正文的顺序、标点和字形，按原有段落或段首缩进切分。正文中的“一曰”、各经山数汇总和全书篇末文字均随原文保留。编者所加标题、图廊、分类、旁注、脚注以及两处相同的校书署款从正文中移出。
3. 异文模板取正文栏，罕字模板取实际 Unicode 字符，例如“丽𪊨”中的第二字。个别字形、地名和断句因版本而异。固定版本链接保留维基文库的异读与校注，读者可以直接核对。
4. 简体栏用 OpenCC-JS 1.4.2 的通用繁体转大陆简体规则（t → cn），逐段与底本对应。古籍难字及异体字可以保留，查证时以原字栏和底本为准。[OpenCC-JS](https://github.com/nk2028/opencc-js)

## 复现

在仓库根目录运行以下命令。转换器只在导入时使用，游戏按卷读取静态 JSON。

```powershell
$converterDir = Join-Path ([IO.Path]::GetTempPath()) 'shanhai-import'
npm install --prefix $converterDir --ignore-scripts --no-save --package-lock=false opencc-js@1.4.2
node scripts/import-book.mjs (Join-Path $converterDir 'node_modules/opencc-js')
node --test tests/book-corpus.test.mjs
```

导入脚本也可接受固定版本 API 响应的本地 JSON 路径作为第二个参数，离线执行相同转换。段序用于本机存档，变更底本或重分段时需一同核对已收集段落的身份。
