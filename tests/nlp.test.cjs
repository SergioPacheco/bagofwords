const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const { join } = require('node:path');

function lab() {
  const html = readFileSync(join(__dirname, '..', 'bag-of-words.html'), 'utf8');
  const source = html.match(/<script id="nlp-core">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(source, 'O núcleo NLP deve estar disponível no próprio HTML, sem dependências.');
  return runInNewContext(source + '\nNLP;');
}
const plain = value => JSON.parse(JSON.stringify(value));
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} ≠ ${expected}`);

test('normaliza caixa e Unicode sem perder acentos nem unir palavras separadas por pontuação', () => {
  assert.deepEqual(plain(lab().tokenize('O GATO, dormiu-no SOFA\u0301! 2026')), ['o', 'gato', 'dormiu', 'no', 'sofá', '2026']);
});

test('stopwords removem artigos e preposições, preservando a negação', () => {
  const data = lab().analyzeDocuments(['O gato não dormiu no sofá.'], { removeStopwords: true });
  assert.deepEqual(plain(data.filteredTokens[0]), ['gato', 'não', 'dormiu', 'sofá']);
  assert.deepEqual(plain(data.rawTokens[0]), ['o', 'gato', 'não', 'dormiu', 'no', 'sofá']);
});

test('contagem preserva repetições e alinha documentos ao mesmo vocabulário', () => {
  const data = lab().analyzeDocuments(['Gato gato cão', 'cão']);
  assert.deepEqual(plain(data.vocab), ['cão', 'gato']);
  assert.deepEqual(plain(data.counts), [[1, 2], [1, 0]]);
  assert.deepEqual(plain(data.df), [2, 1]);
});

test('bigramas preservam ordem e não atravessam documentos', () => {
  const data = lab().analyzeDocuments(['O cão mordeu o homem', 'O homem mordeu o cão'], { ngramSize: 2 });
  assert.deepEqual(plain(data.terms[0]), ['o cão', 'cão mordeu', 'mordeu o', 'o homem']);
  near(lab().cosineDetails(...data.counts).similarity, 0.75);
  assert.deepEqual(plain(lab().analyzeDocuments(['gato', 'sofá'], { ngramSize: 2 }).vocab), []);
});

test('trigramas usam os tokens após o filtro de stopwords', () => {
  const data = lab().analyzeDocuments(['O gato dormiu no sofá da sala'], { removeStopwords: true, ngramSize: 3 });
  assert.deepEqual(plain(data.terms[0]), ['gato dormiu sofá', 'dormiu sofá sala']);
});

test('TF-IDF usa frequência bruta e IDF suavizado calculado no conjunto inteiro', () => {
  const nlp = lab();
  const data = nlp.analyzeDocuments(['gato gato cão', 'cão']);
  const rows = nlp.weightedRows(data, 'tfidf');
  near(rows[0][0], 1);
  near(rows[0][1], 2.8109302162163288);
  assert.deepEqual(plain(nlp.weightedRows(data, 'binary')), [[1, 1], [1, 0]]);
});

test('frequência agrega contagens ou pesos e permite filtrar um documento', () => {
  const nlp = lab();
  const data = nlp.analyzeDocuments(['gato gato cão', 'cão']);
  assert.deepEqual(plain(nlp.frequencyRows(data, 'count')).map(x => [x.term, x.value]), [['cão', 2], ['gato', 2]]);
  assert.deepEqual(plain(nlp.frequencyRows(data, 'count', 1)).map(x => [x.term, x.value]), [['cão', 1]]);
  const weighted = nlp.frequencyRows(data, 'tfidf');
  assert.equal(weighted[0].term, 'gato');
  near(weighted[0].value, 2.8109302162163288);
});

test('cosseno retorna produto, normas e ângulo calculados nas dimensões completas', () => {
  const details = lab().cosineDetails([1, 0, 1], [0, 1, 1]);
  assert.equal(details.dot, 1);
  near(details.normA, Math.sqrt(2));
  near(details.normB, Math.sqrt(2));
  near(details.similarity, 0.5);
  near(details.angle, 60);
});

test('vetor zero tem similaridade zero por convenção e ângulo indefinido', () => {
  const details = lab().cosineDetails([0, 0], [1, 2]);
  assert.equal(details.similarity, 0);
  assert.equal(details.angle, null);
  const data = lab().analyzeDocuments(['O de a', '!!!'], { removeStopwords: true });
  assert.deepEqual(plain(data.vocab), []);
  assert.deepEqual(plain(data.counts), [[], []]);
});

test('a inversão cão/homem é invisível para unigramas e gato/felino não compartilham dimensão', () => {
  const nlp = lab();
  const data = nlp.analyzeDocuments(['O cão mordeu o homem', 'O homem mordeu o cão', 'gato', 'felino']);
  near(nlp.cosineDetails(data.counts[0], data.counts[1]).similarity, 1);
  assert.equal(nlp.cosineDetails(data.counts[2], data.counts[3]).similarity, 0);
});

test('rejeita entrada inválida e limita a carga antes de construir as visualizações', () => {
  const nlp = lab();
  assert.throws(() => nlp.analyzeDocuments([]), /documento/i);
  assert.throws(() => nlp.analyzeDocuments(Array(201).fill('gato')), /200/);
  assert.throws(() => nlp.analyzeDocuments([Array.from({ length: 2001 }, (_, i) => 'p' + i).join(' ')]), /2.000/);
});

test('distância de cosseno diferencia direção idêntica, parcial e ortogonal', () => {
  const nlp = lab();
  near(nlp.cosineDetails([1, 0], [2, 0]).distance, 0);
  near(nlp.cosineDetails([1, 0, 1], [0, 1, 1]).distance, 0.5);
  near(nlp.cosineDetails([1, 0], [0, 1]).distance, 1);
  assert.equal(nlp.cosineDetails([0, 0], [1, 0]).distance, null);
});

test('mapa de até três direções preserva as distâncias euclidianas dos vetores normalizados', () => {
  const nlp = lab();
  const map = nlp.projectDocuments([[1, 0], [0, 2], [3, 3]]);
  const length = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  assert.equal(map.points.length, 3);
  near(length(map.points[0], map.points[1]), Math.sqrt(2));
  near(length(map.points[0], map.points[2]), Math.sqrt(2 - Math.sqrt(2)));
  near(map.explained, 1);
});

test('mapa agrupa direções idênticas e exclui vetores sem direção sem perder seus índices', () => {
  const map = lab().projectDocuments([[1, 0], [0, 0], [4, 0], [0, 2]]);
  assert.deepEqual(plain(map.excluded), [1]);
  assert.deepEqual(plain(map.points.map(point => point.index)), [0, 2, 3]);
  near(map.points[0].x, map.points[1].x);
  near(map.points[0].y, map.points[1].y);
  near(Math.hypot(map.points[0].x - map.points[2].x, map.points[0].y - map.points[2].y), Math.sqrt(2));
});

test('mapa informa perda de informação em mais de duas dimensões', () => {
  const map = lab().projectDocuments([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]);
  near(map.explained, 2 / 3);
  assert.ok(map.points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)));
});

test('mapa aceita conjunto vazio, vetores todos vazios ou direções todas iguais', () => {
  const nlp = lab();
  assert.equal(nlp.projectDocuments([]).points.length, 0);
  assert.deepEqual(plain(nlp.projectDocuments([[], []]).excluded), [0, 1]);
  const map = nlp.projectDocuments([[1], [8], [2]]);
  assert.ok(map.points.every(point => Math.hypot(point.x, point.y) < 1e-10));
  near(map.explained, 1);
});
