# Bag of Words — Laboratório de NLP

Aplicação educativa em português para acompanhar a transformação de textos em vetores. Funciona inteiramente no navegador, sem backend, bibliotecas externas ou envio de documentos.

**Páginas disponíveis:**

- [`bag-of-words.html`](./bag-of-words.html) — versão original e enxuta do laboratório de **Bag of Words**. Mostra documentos, vocabulário, matriz documento-termo, contagem, presença binária, TF-IDF e o que o algoritmo não entende: ordem e sinônimos.
- [`bag-of-words-bpe.html`](./bag-of-words-bpe.html) — laboratório completo de BoW, com guia passo a passo, explorações de similaridade, distâncias, frequência, N-gramas e a aba expandida de **Tokenização BPE**.
- [`tokenizador-hands-on.html`](./tokenizador-hands-on.html) — clone básico e independente do **TensorFlow Embedding Projector**. Exibe grupos de palavras em 2D/3D, permite girar, aproximar, buscar pontos, consultar vizinhos e ler a teoria pelo ícone de sanduíche.

**Acesse a versão original online:** [https://sergiopacheco.github.io/bagofwords/bag-of-words.html](https://sergiopacheco.github.io/bagofwords/bag-of-words.html)

As páginas são independentes e nenhuma substitui outra. Abra o arquivo desejado em um navegador moderno. Não é necessário instalar dependências ou iniciar um servidor. Todas funcionam localmente e não enviam documentos ou dados para serviços externos.

## Qual página usar?

- Para uma introdução curta à representação por contagem, comece por `bag-of-words.html`.
- Para acompanhar a aula completa de BoW e avançar até BPE, use `bag-of-words-bpe.html`.
- Para estudar embeddings, grupos, projeções e visualização de pontos, use `tokenizador-hands-on.html`. Esta página é uma demonstração visual: não executa um modelo de linguagem real nem gera embeddings com `sentence-transformers`.

## Aprender passo a passo

Na página completa `bag-of-words-bpe.html`, o guia começa com seis etapas: **texto → tokens → vocabulário → contagem → vetor → comparação**. Dois documentos curtos (`gato gato cão` e `cão`) permitem acompanhar de onde vem cada número.

- Faça uma previsão antes de **Revelar esta etapa**.
- Na etapa **Contagem**, clique em **Próximo token**: a ocorrência e a célula correspondente ficam destacadas, e o contador aumenta uma unidade. Cada documento usa sua própria linha no mesmo vocabulário.
- Use **Embaralhar palavras** para mudar a ordem mantendo as repetições. Na etapa de contagem, isso reinicia os contadores para comparar o resultado.
- **Etapa anterior** permite revisar respostas; **Recomeçar o guia** restaura a atividade.
- **Explorar o laboratório** preserva os documentos da exploração. **Usar estes textos no laboratório** carrega explicitamente o exemplo curto e restaura unigramas e contagem.

O guia distingue a construção da representação BoW da comparação por cosseno. A pontuação de similaridade não é uma probabilidade nem uma medida de compreensão do significado.

## Explorações

- **Documentos e vocabulário:** um documento por linha, com atualização automática. Linhas em branco são ignoradas.
- **Matriz e similaridade:** contagem, presença binária ou TF-IDF; matriz de cosseno e comparação de qualquer par. Clique em uma célula ou use os seletores para ver vetores, produto escalar, normas e ângulo.
- **Distâncias:** mapa 2D dos documentos, segmento entre o par selecionado e barras de distância a partir do documento A. Clique nos pontos ou nas barras para escolher B; todos os seletores de comparação ficam sincronizados.
- **Tokens:** texto original → normalização → tokens numerados → filtro de stopwords → termos → vetor alinhado ao vocabulário do conjunto.
- **Frequência:** até 20 termos com maior contagem ou soma dos pesos TF-IDF, considerando todos os documentos ou um documento selecionado. A medida do gráfico é independente do modo dos vetores.
- **N-gramas:** unigramas, bigramas e trigramas, com janelas que avançam um token e preservam parte da ordem local.
- **Experimentos prontos:** sinônimos, inversão da ordem, repetição proporcional e expansão do vocabulário. Cada experimento apresenta uma pergunta e uma explicação; carregar restaura unigramas, contagem e stopwords desativadas. O experimento de vocabulário permite adicionar um documento com uma palavra inédita e observar os zeros nas linhas anteriores.
- **Inspeção de TF-IDF:** no modo TF-IDF, selecione uma célula da matriz para ver TF, DF, número de documentos, IDF suavizado e multiplicação final. A matriz usa uma parada de Tab; as setas movem entre pesos e Enter ou espaço seleciona uma célula.

Os controles de stopwords e N-gramas afetam todas as explorações. A normalização preserva acentos e números, converte para minúsculas e trata pontuação como separador. A lista de stopwords é didática, pode ser consultada na interface e preserva a negação “não”. O filtro ocorre **antes** da formação dos N-gramas; as janelas podem atravessar frases no mesmo documento, mas nunca documentos diferentes.

## Roteiro para a aula

Comece pelo guia, pedindo que a turma antecipe as contagens. Depois, abra **Explorar o laboratório** para seguir o roteiro abaixo com o exemplo de seis documentos:

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

## Tokenização BPE — O modelo não lê letras

Abra **Explorar o laboratório → Tokenização BPE**. A nova aba funciona de forma independente da vetorização BoW, inclusive quando os documentos da exploração têm uma entrada inválida.

1. Edite o corpus e ajuste o controle de **0 a 100 merges**. Clique em **Treinar BPE**. Os pares e as frequências da tabela são calculados com os textos informados; não existem divisões de palavras fixadas previamente.
2. O treinamento aplica todas as regras aprendidas. Use **Reiniciar** para voltar à base e **Próxima etapa**, **Etapa anterior** ou as linhas da tabela para aplicar um prefixo das regras, sempre na ordem aprendida.
3. Digite qualquer texto e clique em **Tokenizar**. Veja os bytes iniciais, os blocos coloridos com IDs, a quantidade de tokens, a sequência completa de IDs e a reconstrução exata. Os exemplos incluem tokenização/tokenization, desenvolvedor/developer e autenticação/authentication.
4. Compare português e inglês: as duas colunas usam o mesmo modelo e a mesma etapa. As contagens dependem do corpus; não reproduzem GPT, Qwen ou outros modelos reais.
5. Confira a mesma frase como vetor de contagens BoW e como sequência BPE. Essa comparação não modifica os documentos nem as opções do laboratório.

O núcleo `BPE` está em um script próprio, separado da renderização. O vocabulário inicial contém **todos os 256 bytes UTF-8**, com IDs de 0 a 255; cada merge recebe um novo ID a partir de 256. A frequência dos pares é recalculada após cada união. Empates usam o menor ID esquerdo e, depois, o menor ID direito. Contam-se candidatos sobrepostos, mas cada regra é aplicada da esquerda para a direita, sem sobreposição.

Cada trecho sem espaços e cada caractere de espaço é um segmento independente: merges não atravessam esses limites. Não há normalização de caixa, acentos, espaços ou pontuação. Bytes que ainda não formam um caractere completo aparecem em hexadecimal; a reconstrução concatena os bytes antes de decodificar. Assim, emojis e caracteres ausentes do corpus continuam representáveis. Texto UTF-16 malformado é rejeitado com mensagem explícita.

Corpus e entrada BPE aceitam até **16.000 bytes UTF-8** cada. Se acabarem os pares, o treino termina antes do número de merges solicitado. Editar o corpus ou o limite invalida os resultados até um novo treino. Prévias de 200 blocos são identificadas; as contagens, os IDs e a reconstrução usam todos os tokens, e a entrada tokenizada permite mostrar todos os blocos.

Esta é uma demonstração educacional de BPE em bytes, não um modelo de linguagem. IDs identificam tokens; os embeddings que um modelo associaria a esses IDs não são calculados aqui. Referência conceitual: [implementação educacional de BPE do tiktoken](https://github.com/openai/tiktoken/blob/main/tiktoken/_educational.py), consultada sem incorporar dependências ou modelos.

No laboratório de BoW/BPE, embeddings reais, busca semântica, classificação e exportação ficam para etapas futuras. O mapa de distâncias dessa página usa PCA; ela não implementa t-SNE. Para explorar uma visualização separada de pontos, grupos, busca e projeções locais, use `tokenizador-hands-on.html`.

## Visualizador de embeddings — `tokenizador-hands-on.html`

Esta página é uma demonstração independente inspirada no **TensorFlow Embedding Projector**. Ela não substitui os laboratórios de BoW e BPE e não executa um modelo de linguagem real.

- **Canvas 2D/3D:** os pontos representam itens da amostra local; arraste para girar, use a roda do mouse ou os botões para aproximar e clique em um ponto para selecioná-lo.
- **Amostras:** `Palavras agrupadas` possui 30 palavras em três grupos didáticos — Animais, Tecnologia e Natureza. `Conceitos de IA` possui uma segunda amostra com 24 itens. Os grupos são metadados da demonstração, não categorias aprendidas automaticamente.
- **Projeção:** PCA, t-SNE e UMAP aparecem como modos exploratórios locais. As posições são didáticas e não reproduzem os algoritmos completos nem embeddings produzidos por um modelo externo.
- **Busca e painel direito:** busque uma palavra ou grupo; os pontos que correspondem ficam destacados. O painel direito mostra o item selecionado, grupo, posição, vetor, distância e vizinhos mais próximos.
- **Aparência:** altere o método de colorização, o tipo de rótulo, a grade e o tamanho dos pontos. Essas opções mudam a visualização, não os dados originais.
- **Teoria:** abra o ícone de sanduíche para consultar embeddings, vetores, grupos, documentos, metadados, projeções, vizinhança, interpretação e limitações.
- **Arquivo local:** o controle de carregamento aceita CSV, TSV ou TXT com o rótulo na primeira coluna e valores numéricos nas colunas seguintes. O arquivo é processado somente no navegador.

Como a amostra é sintética e educativa, proximidade visual não deve ser interpretada como prova de significado. Uma projeção para duas ou três dimensões pode distorcer distâncias e sobrepor pontos; use os metadados e os vizinhos como apoio para formular hipóteses.

## Verificação

Com Node.js 20 ou superior:

```sh
node tests/nlp.test.cjs
node tests/bpe.test.cjs
node tests/browser.test.cjs
```

O comando de NLP extrai o núcleo da versão original `bag-of-words.html`; o comando de BPE extrai o núcleo da versão completa `bag-of-words-bpe.html`. Os testes BPE verificam frequências, determinismo, ordem dos merges, estágios, fallback em bytes, reconstrução de Unicode, limites e erros.

O último comando requer `google-chrome` e `firefox` disponíveis no PATH e executa as mesmas interações em ambos, solicitando larguras de 1280 e 390 pixels. Em modo headless, estes navegadores podem expor 500px como largura CSS mínima para a janela estreita; o teste garante que a viewport não fique menor que a solicitada e valida todo o layout responsivo nesse limite. Inclui todas as explorações anteriores, guia, acessibilidade por teclado, atualizações, segurança de texto e a nova aba BPE. O HTML é aberto diretamente por `file://`; um coletor temporário em `127.0.0.1` recebe apenas os resultados durante os testes. A aplicação continua sem servidor ou chamadas de rede. Perfis e arquivos temporários são removidos ao finalizar. Para verificar apenas um navegador, use `node tests/browser.test.cjs --browser=firefox` ou `--browser=google-chrome`.
