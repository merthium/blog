import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export async function fixtureSite() {
  const root = await mkdtemp(join(tmpdir(), 'blog-reading-test-'));
  const content = join(root, 'content');
  await mkdir(join(content, 'posts'), { recursive: true });
  const documents = {
    'posts/basit-seviye-bir-crackme-cozumu.md': '---\ntitle: "Başlangıç Crackme"\ndate: 2025-01-01\ncategories: ["Reversing"]\ntags: ["crackme"]\n---\nİlk adımlar.',
    'posts/orta-seviye-crackme-cozumu.md': '---\ntitle: "Orta Seviye Crackme"\ndate: 2025-02-01\ncategories: ["Reversing"]\ntags: ["crackme"]\ndescription: "radare2 ile analiz"\n---\n## İnceleme\nentry0 incelemesi.\n\n![Register değerleri](/uploads/fixture.png)\n\n```text\n' + Array.from({length:40},(_,i)=>'line '+i+' '+ 'x'.repeat(160)).join('\n') + '\n```\n',
    'posts/ag.md': '---\ntitle: "Ağ Güvenliği"\ndate: 2025-03-01\ncategories: ["Network"]\ntags: ["güvenlik"]\n---\nWireshark ve nftables kullanımı.',
    'posts/hidden-draft.md': '---\ntitle: "SECRET DRAFT"\ndraft: true\n---\nNot public',
    'author.md': '---\ntitle: "Yazar"\n---\nYazar bilgisi.',
    'search.md': '---\ntitle: "Ara"\nlayout: "search"\nsearchHidden: true\ncomments: false\nhideMeta: true\n---\n',
  };
  for (const [path, text] of Object.entries(documents)) await writeFile(join(content, path), text);
  return { root, content, output: join(root, 'public') };
}
