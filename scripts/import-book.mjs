// Import the pinned Wikisource transcriptions. No network or converter is needed to play.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const editions = [
  ['南山經', 2650929], ['西山經', 2650930], ['北山經', 442532], ['東山經', 310474],
  ['中山經', 8736800], ['海外南經', 310700], ['海外西經', 427605], ['海外北經', 442531],
  ['海外東經', 427604], ['海內南經', 311574], ['海內西經', 311596], ['海內北經', 1161063],
  ['海內東經', 12386685], ['大荒東經', 331930], ['大荒南經', 313874], ['大荒西經', 313887],
  ['大荒北經', 316477], ['海內經', 2642240]
];

function mainText(source) {
  let text = source
    .replace(/<!--[^]*?-->/g, '')
    .replace(/<gallery\b[^]*?<\/gallery>/gi, '')
    .replace(/<ref\b[^>]*>[^]*?<\/ref>/gi, '')
    .replace(/<references\s*\/>/gi, '')
    .replace(/^\s*\[\[Category:[^\n]*\]\]\s*$/gmi, '')
    .replace(/^=+[^\n]*?=+\s*$/gm, '');
  // Resolve inner templates first (rare-character templates also occur inside notes).
  while (text.includes('{{')) {
    const resolved = text.replace(/\{\{([^{}]*)\}\}/g, (_, body) => {
      const [name, reading] = body.split('|').map(field => field.trim());
      if (['!', '另', '另2'].includes(name)) return reading;
      if (['*', 'Textquality', 'header2', 'PD-old'].includes(name)) return '';
      throw new Error('Unknown transcription template: ' + name);
    });
    if (resolved === text) throw new Error('Unbalanced template in transcription');
    text = resolved;
  }
  text = text.replace(/\[\[([^|\]]+\|)?([^\]]+)\]\]/g, '$2').replace(/【\s*】/g, '');
  const passages = text.split(/\r?\n|　{2,}/u).map(p => p.trim()).filter(Boolean)
    .filter(p => !p.startsWith('建平元年四月丙戌，待詔太常屬臣望校治'));
  for (const p of passages) {
    if (/[{}<>\[\]�]/u.test(p)) throw new Error('Unresolved markup in ' + p);
  }
  return passages;
}

async function fetchEditions() {
  const params = new URLSearchParams({
    action: 'query', prop: 'revisions', rvprop: 'ids|content|sha1', rvslots: 'main',
    format: 'json', formatversion: '2', revids: editions.map(([, rev]) => rev).join('|')
  });
  const response = await fetch('https://zh.wikisource.org/w/api.php?' + params, {
    headers: {'User-Agent': 'ShanhaiFieldbook/1.0 (https://github.com/handsun85s/shanhai-fieldbook)'},
    signal: AbortSignal.timeout(45000)
  });
  if (!response.ok) throw new Error('Wikisource HTTP ' + response.status);
  return response.json();
}

// The optional snapshot must be an exact MediaWiki query response for the pinned revisions.
const [openccDirectory, snapshot] = process.argv.slice(2);
if (!openccDirectory) throw new Error('Usage: node scripts/import-book.mjs PATH_TO_OPENCC_JS [API_SNAPSHOT.json]');
const pkg = JSON.parse(await readFile(resolve(openccDirectory, 'package.json'), 'utf8'));
if (pkg.name !== 'opencc-js' || pkg.version !== '1.4.2') throw new Error('Expected opencc-js 1.4.2');
const {Converter} = await import(pathToFileURL(resolve(openccDirectory, 'dist/esm/t2cn.js')));
const simplify = Converter({from: 't', to: 'cn'});
const input = snapshot ? JSON.parse(await readFile(snapshot, 'utf8')) : await fetchEditions();
const chapters = editions.map(([title, oldid]) => {
  const page = input.query.pages.find(p => p.title === '山海經/' + title);
  const revision = page?.revisions.find(rev => rev.revid === oldid);
  if (!revision) throw new Error('Missing pinned edition for ' + title);
  const raw = revision.slots.main.content;
  if (createHash('sha1').update(raw).digest('hex') !== revision.sha1) throw new Error('Source checksum mismatch for ' + title);
  const passages = mainText(raw);
  return {
    title: simplify(title),
    source: 'https://zh.wikisource.org/w/index.php?oldid=' + oldid,
    passages,
    simplified: passages.map(simplify)
  };
});
const folder = new URL('../public/book/', import.meta.url);
await mkdir(folder, {recursive: true});
for (const [i, chapter] of chapters.entries()) {
  const filename = String(i + 1).padStart(2, '0') + '.json';
  await writeFile(new URL(filename, folder), JSON.stringify(chapter, null, 2) + '\n');
  console.log(filename, chapter.title, chapter.passages.length);
}
