const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const { join } = require('node:path');
const { TextEncoder, TextDecoder } = require('node:util');

function core() {
  const html = readFileSync(join(__dirname, '..', 'bag-of-words-bpe.html'), 'utf8');
  const source = html.match(/<script id="bpe-core">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(source, 'O núcleo BPE deve estar separado da interface no HTML.');
  return runInNewContext(source + '\nBPE;', { TextEncoder, TextDecoder });
}
const plain = value => JSON.parse(JSON.stringify(value));

test('aprende pares reais, frequências e IDs em ordem determinística', () => {
  const bpe = core(), model = bpe.train('abab abab', 8);
  assert.deepEqual(plain(model.merges), [
    { left: 97, right: 98, id: 256, frequency: 4 },
    { left: 256, right: 256, id: 257, frequency: 2 }
  ]);
  assert.deepEqual(plain(model.vocab[256]), [97, 98]);
  assert.deepEqual(plain(model.vocab[257]), [97, 98, 97, 98]);
  assert.deepEqual(plain(bpe.train('abab abab', 8)), plain(model));
});
test('empates são resolvidos pelos IDs, independentemente da ordem de encontro', () => {
  const bpe = core();
  assert.deepEqual(plain(bpe.train('cd ab', 1).merges[0]), { left: 97, right: 98, id: 256, frequency: 1 });
});
test('conta sobreposições mas une ocorrências sem sobreposição', () => {
  const bpe = core(), model = bpe.train('aaa', 1);
  assert.equal(model.merges[0].frequency, 2);
  assert.deepEqual(plain(bpe.encode('aaa', model)), [256, 97]);
});
test('aplica somente o prefixo de regras solicitado e mantém a ordem aprendida', () => {
  const bpe = core(), model = bpe.train('abab abab', 8);
  assert.deepEqual(plain(bpe.encode('ababa', model, 0)), [97, 98, 97, 98, 97]);
  assert.deepEqual(plain(bpe.encode('ababa', model, 1)), [256, 256, 97]);
  assert.deepEqual(plain(bpe.encode('ababa', model, 2)), [257, 97]);
});
test('base contém todos os bytes e zero merges mantém cada byte', () => {
  const bpe = core(), model = bpe.train('a', 0);
  assert.equal(model.vocab.length, 256);
  for (let byte = 0; byte < 256; byte++) assert.deepEqual(plain(model.vocab[byte]), [byte]);
  assert.deepEqual(plain(bpe.encode('ç', model)), [195, 167]);
  assert.equal(bpe.decode([195, 167], model), 'ç');
});
test('reconstrói exatamente Unicode desconhecido, espaços, caixa, BOM e caracteres combinantes', () => {
  const bpe = core(), model = bpe.train('token token tokenization', 30);
  const examples = ['', 'tokenização', 'A  B\r\n\tC', '👩🏽‍💻🙂漢字', 'cafe\u0301 ≠ café', '\uFEFFinício\uFEFF', '\0\u0001\u00A0\u2028fim', '<img src=x onerror=alert(1)>'];
  for (const text of examples) {
    const ids = bpe.encode(text, model);
    assert.equal(bpe.decode(ids, model), text);
    const bytes = ids.flatMap(id => plain(model.vocab[id]));
    assert.deepEqual(plain(bytes), [...new TextEncoder().encode(text)]);
  }
});
test('treino não une palavras através de espaços e não normaliza letras', () => {
  const bpe = core(), model = bpe.train('ab cd A a', 100);
  assert.ok(!model.vocab.slice(256).some(bytes => bytes.includes(32)));
  assert.notDeepEqual(plain(bpe.encode('A', model)), plain(bpe.encode('a', model)));
  assert.equal(bpe.decode(bpe.encode('ab\tcd', model), model), 'ab\tcd');
});
test('corpus e orçamento de merges alteram as regras e as contagens', () => {
  const bpe = core(), base = bpe.train('abab abab', 0), trained = bpe.train('abab abab', 2), other = bpe.train('cdcd cdcd', 2);
  assert.equal(bpe.encode('abab', base).length, 4);
  assert.equal(bpe.encode('abab', trained).length, 1);
  assert.equal(bpe.encode('abab', other).length, 4);
});
test('para sem pares e valida limites, estágios, IDs e UTF-16 malformado', () => {
  const bpe = core(), model = bpe.train('a b', 100);
  assert.equal(model.merges.length, 0);
  assert.throws(() => bpe.train('', 1), /corpus/i);
  for (const n of [-1, 101, 1.5, NaN]) assert.throws(() => bpe.train('ab', n), /merge/i);
  assert.throws(() => bpe.train('a'.repeat(16001), 1), /16.000/);
  assert.throws(() => bpe.encode('🙂'.repeat(4001), model), /16.000/);
  assert.throws(() => bpe.encode('ab', model, 1), /etapa/i);
  assert.throws(() => bpe.decode([256], model), /ID/i);
  assert.throws(() => bpe.decode([195], model), /UTF-8/i);
  assert.throws(() => bpe.train('\ud800', 1), /UTF-16/i);
  assert.throws(() => bpe.encode('\udc00', model), /UTF-16/i);
});
test('reconstrução permanece exata em textos variados e em todas as etapas', () => {
  const bpe = core(), model = bpe.train('banana banana ação ação 🙂🙂 teste teste', 25);
  const alphabet = ['a', 'ç', '\n', '🙂', '\u0301', '漢', ' ', '\t'];
  let seed = 37;
  for (let sample = 0; sample < 40; sample++) {
    let text = '';
    for (let i = 0; i < sample; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; text += alphabet[seed % alphabet.length]; }
    for (let stage = 0; stage <= model.merges.length; stage++) assert.equal(bpe.decode(bpe.encode(text, model, stage), model), text);
  }
});

test('calcula os pares mais frequentes na etapa atual sem atravessar espaços', () => {
  const bpe = core(), model = bpe.train('abab abab', 2);
  assert.deepEqual(plain(bpe.pairFrequencies('ababa', model, 0).slice(0, 2)), [
    { left: 97, right: 98, frequency: 2 },
    { left: 98, right: 97, frequency: 2 }
  ]);
  assert.deepEqual(plain(bpe.pairFrequencies('ababa', model, 1).slice(0, 2)), [
    { left: 256, right: 97, frequency: 1 },
    { left: 256, right: 256, frequency: 1 }
  ]);
  assert.equal(bpe.pairFrequencies('ab ab', model, 0).some(pair => pair.left === 98 && pair.right === 32), false);
});
