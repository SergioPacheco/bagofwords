# Bag of Words — Laboratório de NLP

Aplicação educativa em português para acompanhar a transformação de textos em vetores. Funciona inteiramente no navegador, sem backend, bibliotecas externas ou envio de documentos.

**Acesse o laboratório online:** [https://sergiopacheco.github.io/bagofwords/bag-of-words.html](https://sergiopacheco.github.io/bagofwords/bag-of-words.html)

Abra o link em um navegador moderno. Não é necessário instalar dependências ou iniciar um servidor. Para usar localmente, baixe o arquivo `bag-of-words.html` e abra-o no navegador.

## Explorações

- **Documentos e vocabulário:** um documento por linha, com atualização automática. Linhas em branco são ignoradas.
- **Matriz e similaridade:** contagem, presença binária ou TF-IDF; matriz de cosseno e comparação de qualquer par. Clique em uma célula ou use os seletores para ver vetores, produto escalar, normas e ângulo.
- **Distâncias:** mapa 2D dos documentos, segmento entre o par selecionado e barras de distância a partir do documento A. Clique nos pontos ou nas barras para escolher B; todos os seletores de comparação ficam sincronizados.
- **Tokens:** texto original → normalização → tokens numerados → filtro de stopwords → termos → vetor alinhado ao vocabulário do conjunto.
- **Frequência:** até 20 termos com maior contagem ou soma dos pesos TF-IDF, considerando todos os documentos ou um documento selecionado. A medida do gráfico é independente do modo dos vetores.
- **N-gramas:** unigramas, bigramas e trigramas, com janelas que avançam um token e preservam parte da ordem local.

Os controles de stopwords e N-gramas afetam todas as explorações. A normalização preserva acentos e números, converte para minúsculas e trata pontuação como separador. A lista de stopwords é didática, pode ser consultada na interface e preserva a negação “não”. O filtro ocorre **antes** da formação dos N-gramas; as janelas podem atravessar frases no mesmo documento, mas nunca documentos diferentes.

## Roteiro para a aula

1. No exemplo inicial, compare os documentos 1–2 e 1–3: sinônimos não são reconhecidos pelo BoW.
2. Abra **Tokens** e ative a remoção de stopwords para acompanhar as palavras removidas e a mudança do vetor.
3. Abra **Frequência** e alterne entre contagem e TF-IDF.
4. Na aba principal, compare os documentos 4 e 5: com unigramas, o cosseno é 1,00, apesar da inversão de sentido.
5. Selecione bigramas: a similaridade passa a 0,75 com stopwords desativadas e peso de contagem.
6. Abra **Distâncias**: os documentos 4 e 5 passam de distância 0,00 com unigramas para 0,25 com bigramas. Observe as barras e a separação dos pontos.

O TF-IDF usa frequência bruta multiplicada por `ln((1 + N)/(1 + df)) + 1`. O IDF considera sempre o conjunto inteiro; o gráfico soma pesos quando mostra todos os documentos. A similaridade e o ângulo usam os vetores completos e a precisão numérica original. Os números na interface são arredondados.

Um vetor sem termos recebe similaridade zero por convenção, inclusive consigo mesmo; seu ângulo é indefinido. O desenho 2D ilustra as direções normalizadas com o ângulo calculado: não é um embedding nem uma projeção das dimensões do vocabulário.

O **mapa de distâncias** é uma projeção PCA dos vetores normalizados, usando todos os documentos com norma positiva. A interface informa a proporção de variação retida em duas dimensões. O mapa aproxima as distâncias euclidianas entre vetores unitários, relacionadas à distância de cosseno por `distância euclidiana = sqrt(2 × (1 − cosseno))`; as posições em pixels não são a própria distância de cosseno. As barras e o número do par usam `1 − cosseno` nos vetores completos, em escala fixa de 0 a 1.

Direções iguais coincidem no mapa; direções diferentes também podem se sobrepor ao perder dimensões, o que é indicado para o par selecionado. Um ponto com vários documentos permite alternar entre eles por clique, Enter ou espaço. Vetores vazios ficam fora do mapa e têm distância indefinida, mesmo que a matriz use cosseno zero por convenção.

## Limites e navegação

Até 200 documentos, 2.000 termos únicos e 100.000 caracteres por análise. Para manter a interface ágil, as matrizes exibem prévias de até 30 documentos e 60 colunas de termos; o vocabulário mostra até 100 termos e os passos de tokenização, até 120 itens por etapa. As prévias são identificadas na interface; cálculos, seletores de documentos e vetores individuais usam os dados completos.

As abas aceitam clique, setas esquerda/direita, Home e End. A matriz de similaridade tem uma única parada de Tab: use as setas para percorrer suas células e Enter ou espaço para escolher um par. **Voltar ao exemplo** restaura documentos, opções, seleções e modo de contagem. Entradas inválidas ocultam os resultados anteriores até a correção.

BPE, embeddings, busca, classificação e exportação ficam para etapas futuras.

## Verificação

Com Node.js 20 ou superior:

```sh
node tests/nlp.test.cjs
node tests/browser.test.cjs
```

O primeiro comando testa o núcleo de cálculos extraído do próprio HTML. O segundo requer `google-chrome` disponível no PATH e executa a aplicação real em larguras de 1280 e 390 pixels, verificando interações, atualização automática, acessibilidade por teclado, entrada inválida e texto tratado com segurança. Os arquivos temporários são removidos ao finalizar.
