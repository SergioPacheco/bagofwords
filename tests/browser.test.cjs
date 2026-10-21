// Integração no Chrome real, sem instalar bibliotecas nem servir a aplicação.
const assert = require('node:assert/strict');
const { readFileSync, writeFileSync, mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

async function browserChecks() {
  const results = [];
  const $ = id => document.getElementById(id);
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const change = (id, value) => { $(id).value = value; $(id).dispatchEvent(new Event('change', { bubbles: true })); };
  const docs = value => { $('docs').value = value; $('vectorize').click(); };
  const test = async (name, fn) => { try { await fn(); results.push({ name, pass: true }); } catch (error) { results.push({ name, pass: false, error: error.message }); } };

  await test('exemplo mantém seis documentos e as três seções', () => {
    check($('matrix').rows.length === 7, 'Matriz inicial incorreta');
    check($('similarity').rows.length === 7, 'Similaridade inicial incorreta');
    check($('similarity45').textContent === '1,00', 'Ordem deveria ser invisível no exemplo inicial');
  });
  await test('abas e teclado tornam cada painel acessível', () => {
    const tokens = document.querySelector('[data-tab="tokens"]');
    tokens.click();
    check(!$('panel-tokens').hidden && $('panel-main').hidden, 'Painéis não alternaram');
    tokens.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    check(!$('panel-frequency').hidden && document.activeElement.dataset.tab === 'frequency', 'Teclado não moveu a aba');
  });
  await test('matriz usa uma parada de Tab e navegação por setas', () => {
    document.querySelector('[data-tab="main"]').click();
    const buttons = [...$('similarity').querySelectorAll('button')];
    check(buttons.filter(button => button.tabIndex === 0).length === 1, 'Matriz cria paradas de Tab para todas as células');
    const selected = buttons.find(button => button.tabIndex === 0);
    selected.focus();
    selected.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    check(document.activeElement.dataset.a === '1' && document.activeElement.dataset.b === '1', 'Seta não moveu o foco para a próxima linha');
    document.activeElement.click();
    check($('compareA').value === '1' && $('compareB').value === '1', 'Célula não selecionou o par');
  });
  await test('tokenização mostra original, normalização, repetições e vetor alinhado', () => {
    docs('O GATO, gato!\ncão');
    change('tokenDoc', '0');
    check($('tokenOriginal').textContent === 'O GATO, gato!', 'Texto original perdido');
    check($('tokenNormalized').textContent === 'o gato gato', 'Normalização incorreta');
    check($('tokenRaw').querySelectorAll('.token-step').length === 3, 'Repetições perdidas');
    check($('tokenVector').textContent.includes('2'), 'Contagem não aparece no vetor');
  });
  await test('stopwords recalculam matriz e destacam os tokens removidos', () => {
    $('stopwords').click();
    check($('tokenFiltered').querySelectorAll('.removed').length === 1, 'Stopword não destacada');
    check(!Array.from($('matrix').rows[0].cells).some(cell => cell.textContent === 'o'), 'Stopword ficou no vocabulário');
  });
  await test('frequência alterna contagem/TF-IDF e documento', () => {
    docs('gato gato cão\ncão');
    change('freqDoc', '-1');
    change('freqMode', 'tfidf');
    check($('frequencyChart').querySelector('.bar-term').textContent === 'gato', 'Ranking TF-IDF incorreto');
    check($('frequencyChart').textContent.includes('2,81'), 'Peso esperado não exibido');
    change('freqDoc', '1');
    check($('frequencyChart').querySelectorAll('.bar-row').length === 1, 'Filtro de documento não aplicado');
    check($('frequencyChart').textContent.includes('cão'), 'Termo do documento incorreto');
  });
  await test('N-gramas atualizam o cosseno e evidenciam inversão de ordem', () => {
    $('reset').click();
    change('compareA', '3'); change('compareB', '4');
    change('ngramSize', '2');
    check($('cosineValue').textContent === '0,75', 'Cosseno dos bigramas deveria ser 0,75');
    check($('ngramTerms').textContent.includes('o gato'), 'Bigramas não renderizados');
    check($('matrix').rows[0].textContent.includes('mordeu o'), 'Matriz não acompanha N-gramas');
  });
  await test('comparação exibe valores matemáticos e ângulo real', () => {
    $('reset').click();
    docs('gato cão\nsofá cão');
    change('compareA', '0'); change('compareB', '1');
    check($('cosineValue').textContent === '0,50', 'Cosseno incorreto');
    check($('angleValue').textContent === '60,00°', 'Ângulo incorreto');
    check($('comparisonMath').textContent.includes('1,41'), 'Normas não aparecem');
  });
  await test('edição atualiza os resultados automaticamente', async () => {
    $('docs').value = 'gato\ngato';
    $('docs').dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 350));
    check($('cosineValue').textContent === '1,00', 'Resultado ficou desatualizado após editar');
  });
  await test('vetor vazio exibe ângulo indefinido sem NaN ou Infinity', () => {
    $('stopwords').click();
    docs('o de a\ngato');
    check($('cosineValue').textContent === '0,00', 'Convenção para vetor zero incorreta');
    check($('angleValue').textContent === 'Indefinido', 'Ângulo do vetor zero não é definido');
    check(!/NaN|Infinity/.test($('comparisonMath').textContent), 'Divisão inválida exibida');
  });
  await test('entrada vazia invalida resultados e permite recuperar pelo exemplo', () => {
    docs('   \n');
    check($('error').textContent.length > 0 && $('analysisViews').hidden, 'Resultados antigos exibidos como atuais');
    $('reset').click();
    check(!$('analysisViews').hidden && !$('error').textContent, 'Reset não recuperou a aplicação');
    check($('ngramSize').value === '1' && !$('stopwords').checked, 'Reset não restaurou opções');
  });
  await test('seleções continuam válidas quando a quantidade de documentos diminui', () => {
    change('compareA', '5'); change('compareB', '4');
    docs('gato');
    check($('compareA').value === '0' && $('compareB').value === '0', 'Seletores fora dos limites');
    check($('cosineValue').textContent === '1,00', 'Um único documento não foi comparado');
  });
  await test('texto com tags é exibido como texto e não executado', () => {
    docs('<img src=x onerror="window.injected=true"> gato');
    check(!window.injected && !$('tokens').querySelector('img'), 'HTML do usuário executado');
    check($('tokenOriginal').textContent.startsWith('<img'), 'Texto original foi alterado');
  });
  await test('conteúdo cabe na largura da janela', () => {
    $('reset').click();
    document.querySelector('[data-tab="main"]').click();
    check(document.documentElement.scrollWidth <= innerWidth, 'Página tem rolagem horizontal');
    for (const tab of document.querySelectorAll('[role="tab"]')) {
      tab.click();
      check(document.documentElement.scrollWidth <= innerWidth, 'Aba ' + tab.textContent + ' excede a largura');
    }
  });
  await test('mapa reúne documentos iguais e mostra distância exata do par selecionado', () => {
    $('reset').click();
    document.querySelector('[data-tab="distances"]').click();
    check(!$('panel-distances').hidden, 'Aba de distâncias não apareceu');
    change('distanceA', '3'); change('distanceB', '4');
    check($('mapDistanceValue').textContent === '0,00', 'Direções iguais deveriam ter distância zero');
    check([...$('distanceMap').querySelectorAll('.map-point')].some(point => point.dataset.docs === '3,4'), 'Documentos 4 e 5 não coincidem');
    change('ngramSize', '2');
    check($('mapDistanceValue').textContent === '0,25', 'Mapa não acompanha os bigramas');
    check($('distanceMap').querySelector('.map-link'), 'Segmento do par não foi desenhado');
    check($('distanceBars').querySelector('[data-doc="4"]').textContent.includes('0,25'), 'Barra não exibe distância real');
  });
  await test('pontos do mapa selecionam o documento B por clique e teclado', () => {
    $('reset').click();
    document.querySelector('[data-tab="distances"]').click();
    const point = $('distanceMap').querySelector('.map-point[data-docs="5"]');
    point.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    check($('compareB').value === '5' && $('distanceB').value === '5', 'Clique não sincronizou os seletores');
    check($('mapDistanceValue').textContent === '1,00', 'Documento sem termos compartilhados deveria estar à distância 1');
    const first = [...$('distanceMap').querySelectorAll('.map-point')].find(point => point.dataset.docs.split(',').includes('0'));
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    check($('distanceB').value === '0' && $('mapDistanceValue').textContent === '0,00', 'Teclado não selecionou o ponto');
  });
  await test('mapa e barras tratam vetores vazios como distância indefinida', () => {
    docs('!!!\ngato\nsofá');
    change('distanceA', '0'); change('distanceB', '1');
    check($('mapDistanceValue').textContent === 'Indefinida', 'Vetor vazio apareceu com distância definida');
    check($('distanceMap').querySelectorAll('.map-point').length === 2, 'Vetor vazio foi projetado');
    check($('mapExcluded').textContent.includes('Doc 1'), 'Documento excluído não foi explicado');
    check(!$('distanceMap').querySelector('.map-link'), 'Ligação inválida foi desenhada');
    check(!/NaN|Infinity/.test($('distanceMap').outerHTML), 'Mapa tem coordenadas inválidas');
    const excluded = $('mapExcluded').querySelector('button');
    excluded.focus(); excluded.click();
    check($('mapExcluded').contains(document.activeElement), 'Seleção de vetor vazio perdeu o foco do teclado');
  });
  await test('mapa usa documentos além da prévia e mantém a página responsiva', () => {
    docs(Array.from({ length: 35 }, (_, i) => 'termo' + i).join('\n'));
    change('distanceA', '0'); change('distanceB', '34');
    check($('mapDistanceValue').textContent === '1,00', 'Último documento ficou fora do cálculo');
    check($('distanceBars').querySelectorAll('.distance-row').length === 35, 'Barras omitem documentos');
    check($('distanceMap').querySelector('[data-docs="34"]'), 'Último documento ficou fora do mapa');
    check(document.documentElement.scrollWidth <= innerWidth, 'Mapa ultrapassa a largura da tela');
    $('reset').click();
  });
  document.querySelector('[data-tab="main"]')?.click();
  results.push(...(window.runtimeErrors || []).map(error => ({ name: 'Erro de JavaScript', pass: false, error })));
  const output = document.createElement('pre');
  output.id = 'browser-test-results';
  output.textContent = JSON.stringify(results);
  document.body.append(output);
}

const dir = mkdtempSync(join(tmpdir(), 'bagofwords-browser-'));
try {
  const source = readFileSync(join(__dirname, '..', 'bag-of-words.html'), 'utf8');
  const html = source.replace('<head>', '<head><script>window.runtimeErrors=[];window.addEventListener("error",e=>runtimeErrors.push(e.message));</script>')
    .replace('</body>', `<script>(${browserChecks.toString()})().catch(error=>{document.body.insertAdjacentHTML('beforeend','<pre id="browser-test-results">'+JSON.stringify([{pass:false,error:error.message}])+'</pre>')});</script></body>`);
  const target = join(dir, 'checks.html');
  writeFileSync(target, html);
  for (const width of [1280, 390]) {
    const chrome = spawnSync('google-chrome', ['--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-proxy-server', '--user-data-dir=' + join(dir, 'profile-' + width), '--window-size=' + width + ',1000', '--virtual-time-budget=3000', '--dump-dom', 'file://' + target], { encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024 });
    assert.equal(chrome.status, 0, chrome.stderr || 'Chrome não concluiu');
    const match = [...chrome.stdout.matchAll(/<pre id="browser-test-results">([\s\S]*?)<\/pre>/g)].at(-1);
    assert.ok(match, 'Chrome não produziu os resultados: ' + chrome.stderr);
    const results = JSON.parse(match[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
    for (const result of results) console.log(`${width}px ${result.pass ? 'PASS' : 'FAIL'} ${result.name || ''}${result.error ? ': ' + result.error : ''}`);
    assert.ok(results.every(result => result.pass), 'Falha na integração em ' + width + 'px');
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
