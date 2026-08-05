# aracaju-site

Site da **Aracaju Multimarcas** montado sobre o motor do `design-system/`
(tema "Normal is Boring": GSAP + ScrollTrigger + ScrollSmoother + SplitText +
Lenis), com todo o conteúdo e as imagens vindos do scrape em
`aracaju-multimarcas/`.

**Fontes:** as do design-system — Editorial New, Juana e Izmir.

Como abrir: sirva a pasta por HTTP (Live Server, `npx serve`, etc.). Abrir o
arquivo direto por `file://` não funciona porque o navegador bloqueia os
módulos e as fontes.

---

## Deploy (Vercel)

Site estático puro — sem build, sem `package.json`, sem backend. O
`vercel.json` na raiz do repositório (um nível acima daqui) faz todo o
trabalho:

- `outputDirectory: "aracaju-site"` — a Vercel publica só esta pasta, então
  não é preciso configurar Root Directory no painel.
- rewrite de `/contacto` → `/index.html`, para o link "Ficha Cadastral" não
  cair em 404 se for aberto em nova aba (no clique normal o `clicks.js`
  intercepta e abre o modal).
- `Cache-Control` longo (1 ano, `immutable`) para imagens, fontes e os
  vendors; 1 hora para o CSS e o JS do site, que ainda mudam e não têm hash
  no nome.
- `cleanUrls: false` de propósito: o logotipo navega para `index.html` via
  Swup, e com `cleanUrls` esse caminho vira um redirecionamento 308 no meio
  da transição.

Pela CLI: `npx vercel` na raiz do repositório (o `.vercelignore` mantém
`design-system/` e `aracaju-multimarcas/` fora do upload). Por Git: importar
o repositório no painel, sem tocar em nenhuma configuração.

---

## Estrutura

```
aracaju-site/
├── index.html                  ← a home inteira
└── assets/
    ├── css/
    │   ├── main.css            4.550 linhas — todo o design do tema
    │   ├── brand.css           ajustes da Aracaju sobre o main.css
    │   └── vendor/swiper-bundle.min.css
    ├── fonts/                  editorialnew, juana, izmir
    ├── js/
    │   ├── vendor/             gsap, ScrollTrigger, ScrollSmoother, SplitText,
    │   │                       MorphSVG, lenis, Swup, swiper, lazyload
    │   └── site/               root, rollovers, animations, clicks, scroll,
    │                           main, preloader, contato
    └── img/
        ├── veiculos/           as 8 fotos do estoque
        ├── marcas/             fiat, ford, chevrolet, toyota, chery,
        │                       land-rover, renault
        ├── site/               vitrine, ficha-cadastral, venda-seu-carro,
        │                       logo, favicon, mapa
        └── ui/                 whatsapp, instagram, phone, mail, asterisco…
```

## Ordem de carga dos scripts

```
swiper → gsap → ScrollTrigger → Swup → ScrollSmoother → SplitText →
MorphSVG → preloader → root → rollovers → animations → clicks →
scroll → lenis → main → lazyload → contato
```

`root.js` precisa vir antes de tudo do tema: é ele que declara `is_mobile`,
`control` e as variáveis globais que os outros arquivos preenchem. E `lenis`
precisa vir antes de `main.js`, que faz `new Lenis()` logo no início.

## Seções da home

A home é uma faixa horizontal (`section.mod-scroll`, com `pin: "main"`) seguida
de seções verticais normais:

| Bloco | Conteúdo |
|---|---|
| `mod-scroll__intro` | "Seminovos com procedência que você confia" + menu + logotipo |
| `mod-scroll__images` | Hilux + flip Evoque/vitrine |
| `mod-scroll__text` | "Cada carro com história conferida antes da chave" |
| `mod-scroll__images-text` | flips sobre fundo preto + texto de serviços |
| `mod-scroll__carousel` | faixa "SEMINOVOS" em loop |
| `mod-scroll__terms` | 01 Procedência · 02 Transparência · 03 Confiança |
| `mod-scroll__projects` | **os 8 veículos**, o último com carrossel e fecho |
| `mod-scroll__cierre` | imagem de fechamento |
| `#veiculos` | **(Estoque) — Todos os veículos**: grade com os 8 carros |
| `mod-title--chapter` | "(Contato) — Agende sua visita" |
| `mod-media--double` | ficha cadastral + venda seu carro |
| `mod-title--lines` | "Atendimento que faz a diferença" |
| `mod-content--cols` | endereço, telefones, e-mail |
| `mod-content--center` | botões WhatsApp e "Venda seu veículo" |
| `marcas` | faixa com as 7 marcas |
| `mod-footer` | wordmark, veículo em destaque, rodapé |

Menu: **Home · Sobre · Veículos · Ficha Cadastral · Contato**, os mesmos cinco
do site original, repetidos em três lugares — o overlay do header
(`#menu-principal`), o menu do hero (`#menu-principal-1`) e o rodapé.
"Ficha Cadastral" (`href="contacto"`) abre o modal.

## Ficha cadastral — 5 passos

O modal reproduz a mesma sequência do site original (as telas estão em
`aracaju-multimarcas/fotosdosite/cadastro/`):

| Passo | Título | Campos |
|---|---|---|
| 1 | Dados pessoais | Nome*, CPF*, RG, Data de nascimento, Celular/WhatsApp*, E-mail, CNH (sim/não), Restrição (Serasa-SPC/Outro), Já financiou (sim/não) |
| 2 | Endereço | CEP, Rua, Número, Bairro, Cidade, Complemento |
| 3 | Dados profissionais | Profissão, Cargo, Renda mensal |
| 4 | Referências | Pessoal, Telefone, Banco, Agência, Conta corrente, Gerente |
| 5 | Descrição do bem | Marca, Modelo, Ano, Combustível, Valor da entrada |

\* obrigatórios — só eles travam o avanço; o resto a loja completa no
atendimento. Uma etapa por vez, com indicador numerado no topo e botões
Voltar/Próximo. No fim, `contato.js` monta a mensagem separada por seção e
abre o WhatsApp da loja — **não há backend**, então nada é gravado em lugar
nenhum.

O reCAPTCHA da tela original ficou de fora: sem servidor para validar o token
ele seria só enfeite.

Os grupos de rádio ficam fora de `.modal__content__form__wrap-input` de
propósito — o `main.js` assume que todo wrap-input tem um
`.modal__content__form__input` dentro e quebraria com um `null`.

Os modais (`#wrap-modals`) não são decorativos: o `root.js` procura
`.modal--contact` já no carregamento e para de executar se ele não existir.

## De onde vêm os dados

`dados.js` é a única porta de entrada de dados do site. Nada mais sabe se o
estoque veio de uma API ou do catálogo embutido — o `estoque.js` pede
`Dados.carregar()` e recebe uma lista já no formato do site.

**Para ligar na API**, tudo acontece no topo do `dados.js`:

1. `CONFIG.url` — o endereço.
2. `CONFIG.caminhoDaLista` — onde a lista está dentro da resposta, se não
   estiver na raiz (ex.: `'data.veiculos'`).
3. `CAMPOS` — os nomes de campo aceitos, em ordem de preferência. Cada linha
   aceita vários; o primeiro que existir no objeto ganha. Se a API usa um nome
   que não está lá, é só acrescentar — **é o único lugar do projeto que
   precisa saber disso**.
4. `CONFIG.filtraNoServidor` — se a API já filtra, os filtros viram query
   string em vez de peneira no navegador.

Enquanto `CONFIG.url` estiver vazio o site lê o `<script id="dados-veiculos">`
do HTML, no mesmo formato de saída. Dá para desenvolver e publicar sem a API
no ar, e se a API cair em produção o site volta para o catálogo embutido e
registra o erro no console — uma vitrine desatualizada é melhor que uma
vitrine em branco.

O `normalizar()` também resolve o caminho inverso: quando os campos vêm soltos
ele monta a ficha do modal, e quando vem só a ficha pronta ele extrai
marca/modelo/ano/km de dentro dela — que é o que os filtros precisam.

Formato de saída (o contrato que o resto do site consome):

| campo | tipo | |
|---|---|---|
| `slug` | string | identificador do card e do modal |
| `nome` / `completo` | string | curto para o card, longo para o modal |
| `preco` / `precoNumero` | string / number | texto formatado e valor para filtrar |
| `marca` `modelo` `ano` `km` `combustivel` | | usados pela busca |
| `capa` / `galeria` | string / string[] | foto do card e fotos do modal |
| `ficha` | [{rotulo, valor}] | a tabela do modal |
| `resumo` `destaques` `opcionais` | | |

## Busca do estoque

Chips de marca em cima, campos embaixo — marca, modelo, ano de/até, preço
de/até. **Todas as opções saem do próprio catálogo**: marca que não está no
estoque não vira chip, ano que ninguém tem não entra na lista. Só os preços
são faixas redondas de 20 mil em vez de um valor por veículo, porque uma lista
de preços exatos envelhece a cada carro vendido.

O chip procura o logotipo pelo nome da marca e, se não achar, por pedaço:
"Caoa Chery" acha `chery.png`, "FIAT AUTOMOVEIS" acha `fiat.png`. Marca sem
logotipo no projeto vira um chip com o nome escrito — não quebra nada.

Clicar num chip já marcado desmarca. Os campos filtram na hora do `change`; o
botão Buscar existe para quem prefere confirmar e para o Enter do teclado.

## Venda seu veículo

O cartão "Quer vender seu veículo?" abre um modal com marca, modelo, ano, KM,
nome do contato, telefone, e-mail e "o veículo é financiado?". Obrigatórios:
marca, modelo, nome e telefone. Como na ficha cadastral, **não há backend**:
o `venda.js` monta a mensagem e abre o WhatsApp da loja. O reCAPTCHA da tela
original ficou de fora pelo mesmo motivo de lá — sem servidor para validar o
token, seria só enfeite.

O link é `href="vender"`, e por isso ele precisou entrar na exceção do
`linkSelector` do Swup no `main.js`, ao lado de `contacto`: não é uma página,
é o gatilho de um modal. Sem a exceção o Swup tenta navegar para `/vender` e
derruba a home.

Os estilos de campo do tema estão presos a `.modal--contact`, então o
`brand.css` os repete para `.modal--venda` em vez de pendurar a classe do
outro modal neste — `root.js` e `clicks.js` pegam `.modal--contact` com
`querySelector` (singular) e passariam a encontrar o modal errado.

## Ícones

Telefone, e-mail, endereço e Instagram usam traçado do **Lucide** (ISC). A
biblioteca inteira são 414 KB para quatro desenhos, num site que já carrega
GSAP, Swiper, Lenis e Swup — então os quatro `<path>` foram copiados do pacote
para um sprite `<svg>` no topo do `<body>`. Para acrescentar outro ícone:
`npm pack lucide`, e o `<path>` está em `dist/esm/icons/<nome>.mjs`; copie
para um novo `<symbol>` com o mesmo viewBox e os mesmos atributos de traço.

O do WhatsApp não é do Lucide, que não tem ícones de marca (o Instagram saiu
na v1; o daqui veio da 0.544). É a marca própria, a mesma de
`assets/img/ui/whatsapp.svg`.

Todos herdam `currentColor`, então acompanham a tinta e o hover sem regra
extra. **Nos links do tema o ícone é irmão do `<a>`, nunca filho**: o
`setLink()` do `rollovers.js` passa SplitText no link e duplica o `innerHTML`
para montar o hover — um `<svg>` lá dentro sairia dobrado e picado.

E cuidado com a faixa de links do rodapé: o tema esconde o último `<span>`
dela (`span:last-of-type { display: none }`), que é o separador `|` sobrando.
Envolver o e-mail num `<span>` sem devolver esse separador faz o e-mail
desaparecer.

Os telefones viraram links `tel:` e o e-mail, `mailto:`.

## Estoque e o modal do veículo

A grade fica logo depois da faixa horizontal — onde a página passa a rolar para
baixo — em `#veiculos`, com 4 colunas no desktop, 3 em 1200px, 2 em 950px e 1
em 560px. Cada card abre o modal do veículo, que segue o arranjo da página de
detalhe do site original: galeria com miniaturas à esquerda, e embaixo dela os
opcionais; preço, ficha, "Proposta via WhatsApp" e "Simular financiamento" à
direita; depois o resumo e os destaques.

**Nenhum card está escrito no `index.html`** — o `estoque.js` desenha a grade
inteira a partir do que o `dados.js` entregar, e refaz a cada busca. Mexer no
estoque é mexer na fonte de dados (ver **De onde vêm os dados**), nunca no
HTML.

Como a grade nasce depois que o tema montou os ScrollTriggers dele, esses cards
não ganham a entrada animada das outras mídias: aparecem direto, que é o
comportamento certo para resultado de busca. O `ScrollTrigger.refresh()` depois
de cada desenho existe só para o pin da faixa horizontal não sair do lugar
quando a altura da página muda.

Os cliques nos cards são por **delegação na grade**, não por listener em cada
card: os cards são refeitos a cada filtro e levariam os listeners junto.

A galeria anda por setas, miniaturas e pelas setas do teclado; `Esc` fecha.

### As fotos

O scrape só tinha capturado **uma foto por carro, reduzida** (300×225, ~12 KB).
As galerias apontavam para `arquivos.boomsistemas.com.br`, então baixei as
**79 fotos em resolução cheia** direto de lá para
`assets/img/veiculos/<slug>/01.jpg…`. São 9 a 12 por veículo, ~15 MB no total.
São fotos da própria loja.

### "Home" e o logotipo

Este site tem uma página só, então "Home" é o topo dela — não um destino. O
tema apontava os três menus para `index.html` e o clique no logotipo chamava
`swup.navigate('index.html')`: os dois faziam o Swup dar uma visita completa,
com cortina de transição, conteúdo trocado, preloader de novo, a faixa
horizontal voltando ao começo e a URL virando `/index.html`. Para quem clicou,
é cair numa página sem contexto nenhum.

Agora os dois fecham o menu e sobem para o topo. `preventDefault()` sozinho não
resolvia — o Swup continuava assumindo o clique —, então `index.html` também
entrou na exceção do `linkSelector` no `main.js`, ao lado de `contacto` e
`vender`.

### O menu

É uma **faixa vertical preta encostada na direita** (`--faixa-menu`, 4.4rem),
só com os cinco links do site, girados -90° — a mesma receita do menu vertical
do hero (`.mod-scroll__intro__menu`): uma linha de itens com
`transform: rotate(-90deg)` e origem no canto inferior direito, o que faz o
bloco descer pela lateral com o primeiro item embaixo. O resto da página fica
escurecido atrás e serve de área de fechar; `Esc` também fecha.

O tema abria o menu como uma página inteira, com foto de veículo em destaque e
lista de modelos. Saiu tudo. O que cresce da direita para a esquerda é a
largura do próprio fundo: o `menu_tl` do `clicks.js` já animava
`.header__menu__bg` de 0 a 100%, só passou a medir a faixa em vez da viewport
(era `100vw`).

Como os blocos removidos eram alvo de `SplitText.create()` e de
`header_media.querySelector()`, esses trechos do `clicks.js` ganharam guarda —
com `null` o SplitText estoura e leva junto o `init()`.

Com o menu aberto o botão vira só um **X**, sem pílula: a classe `is-x` entra e
sai no `menu_tl`, junto com a troca do texto (que no tema alternava
"Menú"/"Cerrar", em espanhol). Como o `.header__btn` do tema tem
`filter: invert(100%)`, o X é declarado preto no CSS para sair branco na tela.

### O botão "Menu"

No tema, o botão do menu só era revelado por um ScrollTrigger, depois que a
faixa horizontal passava de 125% — e voltava a se esconder no `onEnterBack`.
Ou seja: **na primeira tela do site não existia botão de menu nenhum**, e quem
clicava onde ele costuma ficar não apertava coisa alguma (ele fica estacionado
em `translate3d(0,-180%,0)`, fora da viewport). O tema podia se dar a esse luxo
porque o hero tem o menu vertical próprio.

Agora o `header_btn_tl` toca junto com a página, em qualquer largura — como já
era no mobile — e nada o esconde de volta (`scroll.js`).

### Aviso de rolagem

A home tem dois sentidos de leitura, e isso não é óbvio para quem não está
acostumado com página que anda de lado. Um aviso fixo no pé da tela diz o
sentido do momento — "Role a página para o lado" com a seta deitada, "Role a
página para baixo" com a seta em pé — e traz o ícone do mouse, porque quem
manda nos dois casos é a rolagem.

Como o `rolagem.js` sabe em qual dos dois está: a faixa horizontal é um pin do
ScrollTrigger; enquanto `window.scrollY` for menor que o `end` desse pin, o
movimento na tela é lateral. O pin só nasce no `init()`, depois do preloader,
então há uma espera curta que para assim que ele aparece — sem ela a primeira
tela mostrava "para baixo", justamente a instrução errada na hora que mais
importa.

O lugar muda com o modo, porque o que está livre muda junto: na faixa
horizontal o pé do meio da tela está vazio; na parte vertical é o canto
esquerdo que sobra, já que o meio é onde a página centraliza os botões
grandes. Some com modal aberto, com o menu aberto e perto do fim da página.

### Âncoras

Links `#...` são interceptados pelo `estoque.js`. O motivo é o pin: a faixa
horizontal prende o `<main>` no ScrollTrigger, então o scroll nativo de uma
âncora cai no meio do pin. O cálculo soma a posição de layout do alvo ao trecho
de rolagem que o pin ainda vai consumir, e faz uma correção curta depois que a
rolagem assenta.

A ligação é por **delegação no `document`**, não por listener em cada `<a>`: o
`setLink()` reescreve o innerHTML dos itens de menu e recria os links.

## Mobile

O tema dimensiona quase tudo a partir de `99.9vw` com colunas de largura fixa.
Isso funciona enquanto a tela é larga e quebra quando não é: a palavra não cabe
na coluna e ou vaza, ou é hifenizada no meio, ou some da tela.

A regra geral do `brand.css` é uma só: **todo título de display tem um teto em
vw**, calculado para a palavra mais longa daquele bloco caber inteira. Como a
fonte é a mesma, a conta é sempre a mesma — nas capitulares da Juana cada
caractere ocupa ~0,64em, então uma palavra de N letras precisa de
`N × 0,64 × font-size`. Invertendo: `font-size ≤ largura / (N × 0,64)`. O
`min()` mantém o valor do tema quando a tela é grande o bastante; o teto só
entra quando faz falta.

Exemplo: "TRANSPARÊNCIA" tem 13 letras (8,3em). Numa tela de 390px a coluna tem
351px, então o corpo não pode passar de `351/8,3 ≈ 42px`, que é 10,4vw — daí o
`min(3.3rem, 9.8vw)` do bloco de termos, com folga.

O que mais mudou no mobile:

- **títulos do hero** em uma coluna só. O tema os divide em duas colunas de
  larguras fixas e "com procedência" não cabia na segunda.
- **as duas chamadas antes do rodapé** empilhadas. Lado a lado cada cartão
  ficava com 176x76px e o conteúdo precisa de ~105px: ícone, título e a linha
  de instrução ficavam cortados. A proporção saiu do `style=` inline do HTML
  para o CSS — inline ela ganharia de qualquer media query.
- **texto do botão Buscar** centralizado (vinha `text-align: start`).

### Outra armadilha do DOM serializado

O bloco "Cada carro com história conferida **antes da chave**" vinha do
snapshot com as linhas já embrulhadas em `<span class="cont">` e a última com
`style="left: -350px"` — um quadro de animação congelado no momento em que a
página foi salva. Dois estragos de uma vez: o `scroll.js` embrulhava por cima
do que já estava embrulhado, e no mobile, onde a faixa horizontal não corre, o
ScrollTrigger que desfaria o deslocamento nunca rodava — a frase ficava 350px
fora da tela, para sempre.

O conserto é o mesmo de sempre por aqui: **texto puro na marcação**, deixando o
JS montar o que é dele. O deslize da última linha também passou a ser só de
desktop, já que depende de `containerAnimation: scroll_tl`, que no mobile não
existe.

## Cuidado ao editar os menus

O `setRolloversMenu()` (em `rollovers.js`) **constrói** o menu no load: divide o
texto em caracteres, duplica tudo em dois `<span class="line">` para o hover e
injeta a seta em SVG. A marcação de autor é só o link com texto puro:

```html
<li class="link menu-item"><a href="#veiculos">Veículos</a></li>
```

O mesmo vale para a lista de veículos do menu: `.title` e `.place` levam texto
puro. Se você copiar do snapshot a versão já com os dois `.line` e o SVG, o JS
embrulha por cima do que já estava embrulhado e o menu passa a exibir **uma
letra por linha**.

## O que mudou no motor

Quatro ajustes nos arquivos copiados do design-system, todos comentados no
código:

- **`root.js`** — `triggerFlipCierreImage` passou a ser declarada junto das
  outras. Ela só era criada quando a página *não* tem `.mod-scroll`, mas o
  `scroll.js` a lê em quatro pontos → `ReferenceError`.
- **`scroll.js`** — `lastProject_content_tl.play()` ganhou guarda. Num salto
  direto até o fim (âncora, tecla End) a tween dispara antes de a timeline
  existir.
- **`animations.js`** — o morph do logotipo do rodapé (`#B_inicial` → `#B_final`
  etc.) só roda se os paths existirem. Aquele lettering era a marca antiga.
- **`main.js`** — o bloco que ligava/desligava o item `#menu-principal
  .no-show-scroll` virou opcional. Esse item só existia nas páginas de projeto
  do tema; sem ele o `querySelector` devolvia `null` e o `init()` morria ali,
  levando junto o `lenis.start()` (a página abria travada).
- **`main.css`** — os `url()` das fontes apontam para `../fonts/`, e os
  fallbacks `.woff` que o scraper nunca baixou foram removidos (o `.woff2` vem
  antes no `src` e é o que todo navegador atual usa).
- **`main.css`** — as 36 ocorrências de preto e branco que estavam escritas
  direto nas regras viraram `var(--tinta)`, `var(--papel)` e
  `var(--papel-escuro)`, com os valores originais no `:root`. Sozinho o arquivo
  continua desenhando o tema claro; quem inverte é o `brand.css` (ver **Cores**).
- **`rollovers.js`** — o `colorEnd` do hover dos botões era `'white'`/`'black'`
  fixo no JS. Passou a usar os mesmos tokens, senão o texto sumia dentro da
  mancha de hover.
- **`animations.js`** — o bloco do rodapé ganhou guarda. Ele fazia
  `SplitText.create()` no nome e no texto do card de veículo em destaque, que
  este rodapé não tem; com `null` o SplitText estoura e leva junto o resto do
  `init()`.

E em `brand.css`:

- `.logo` foi de `5.279em` para `7.9em` de largura. Essa caixa tem tamanho fixo:
  `.logo__normal` é `absolute` encostado à esquerda e `.logo__group` fica
  encostado à direita, sem um empurrar o outro. Os 5.279em foram medidos na
  palavra "Normal" — "ARACAJU" é mais larga e escrevia por cima do "multi" no
  preloader. **Se o nome mudar, este número precisa ser remedido.**
- `.logo__boring` perdeu o `transform: scale(-1,-1)` — na marca antiga girar a
  palavra era a piada; em "marcas" só deixava o texto de cabeça para baixo.
- O rodapé é a silhueta da marca sobre um wordmark tipográfico, os dois
  centralizados, em Editorial New, fechando com a assinatura
  COMPRA · VENDE · TROCA · FINANCIA. Saiu de lá o card com um veículo em destaque
  que o tema colocava em absolute à direita — era por causa dele que o wordmark
  ficava alinhado à esquerda e o bloco tinha `min-height`. As margens negativas
  da silhueta fecham a folga preta do PNG: medida na imagem, sobra 25,9% no
  topo e 39,6% na base, sobre uma altura que é 0,563 da largura.
- O `width: 80vw` do wrapper do hero passou a valer só acima de 950px. Abaixo
  disso o CSS dimensiona a grade dos títulos a partir de `99.9vw`, e o wrapper
  estreito jogava o conteúdo para fora da tela pela esquerda (o site original
  tem esse mesmo defeito no mobile).

## Cores

O site é preto com tinta pérola. O tema nasceu ao contrário — preto sobre
branco — e a inversão acontece num bloco só, no `:root` do `brand.css`:

| Token | Antes | Agora |
|---|---|---|
| `--tinta` | `#000000` | `--perola` `#EFEBE3` |
| `--papel` | `#FFFFFF` | `#000000` |
| `--papel-escuro` | `#000000` | `#000000` (não tem para onde inverter) |
| `--beige` | `#ECE4DA` | `#141414` |
| `--grey` | `#707070` | `#1C1C1C` |
| `--blue` | `#C7D7E9` | `#10141A` |

Bege, cinza e azul eram as três superfícies claras que alternavam os cards da
faixa horizontal, a seção dos termos e o overlay do menu. Viraram três pretos
ligeiramente diferentes, para a alternância continuar perceptível.

**Armadilha:** as classes utilitárias mantiveram os nomes do tema. No HTML,
`.bg-white` agora pinta de **preto** e `.c-black` escreve em **pérola**. Trocar
os nomes quebraria os ramos do JS que procuram `.mod-scroll__intro.bg-black`
(`preloader.js`, `main.js`, `scroll.js`).

O amarelo da marca (`--amarelo`, `#F5C518`) é o único bloco claro que sobrou —
o fecho da faixa horizontal e o passo ativo da ficha. Nele o texto continua
preto, por uma regra explícita.

Três lugares precisaram de tratamento próprio, todos comentados no `brand.css`:

- **logotipos das marcas** — PNG colorido sobre transparência. Em `grayscale`
  puro ficavam cinza-médio e sumiam; `brightness(1.75)` sobe o conjunto sem
  achatá-lo. Silhueta chapada (`brightness(0) invert(1)`) não serve: transforma
  Ford e Land Rover em elipses sólidas, sem o lettering interno.
- **asteriscos da faixa "SEMINOVOS"** — são `<img>` de um SVG com
  `fill="currentColor"`, e `currentColor` dentro de `<img>` não herda: resolve
  para preto. Levam `filter: invert(1)`.
- **setas da galeria** — o círculo continua branco, então o `‹ ›` ganhou
  `color: #000`; se herdasse a pérola sumiria dentro do círculo.

### Silhueta do hero

`assets/img/logo/logo-marca.png` é um traço branco sobre um retângulo **preto
opaco** — não tem canal alfa. Fica no canto inferior esquerdo do hero (a única
área livre: o `.mod-scroll__intro__logo` ocupa o topo à esquerda e o pé à
direita) e some no fundo por `mix-blend-mode: screen`, que sobre preto devolve
o próprio pixel. Não depende de recortar a imagem — mas depende do fundo ser
preto de verdade.

## Contato

O endereço divide a seção com um **mapa do Google** embutido. O `src` usa
`output=embed`, que não pede chave de API — se um dia o Google fechar essa
porta, o substituto é a Maps Embed API (`/maps/embed/v1/place`) com chave,
trocando só o `src`.

O iframe nasce com `pointer-events: none` e só liga no clique
(`mapa.js`). Sem isso o mapa engoliria a roda do mouse para dar zoom, e numa
página em que tudo é rolagem — ScrollSmoother, Lenis e a faixa horizontal
presa no pin — passar o cursor por cima prenderia o visitante.

O botão **Falar no WhatsApp** fica logo abaixo de "Agende sua visita"; embaixo
do mapa sobrou o de Ficha Cadastral.

As duas fotos antes do rodapé (ficha cadastral / venda seu carro) levam véu
escuro, ícone, título e uma linha de instrução, e o cartão inteiro é clicável —
o da esquerda abre o modal da ficha, o da direita abre o WhatsApp. Sem isso
eram duas imagens sem legenda e sem link. O véu mora dentro de
`.media__wrap-source`, não na raiz do cartão: preso na raiz ele se esticava
com o flex e sobrava um retângulo preto embaixo do cartão mais baixo.

## Limitações do material de origem

- As 79 fotos dos veículos vieram do servidor da loja em resolução cheia (ver
  acima). As demais imagens (banner, ficha cadastral, venda seu carro) são as
  do scrape.
- **Fontes e plugins são licenciados.** Editorial New, Juana e Izmir são
  comerciais (licença por projeto), e SplitText, MorphSVG e ScrollSmoother são
  Club GreenSock. Antes de publicar, é preciso licença própria — ou trocar por
  Instrument Serif/Fraunces + Inter, Splitting.js e o Lenis que já está aqui.

## Dados usados

8 veículos, extraídos das páginas de detalhe do scrape:

| # | Veículo | Ano | Combustível | KM | Preço |
|---|---|---|---|---|---|
| 01 | Punto Sporting Dualogic 1.8 | 2014 | Flex | 175.000 | R$ 43.000 |
| 02 | Tiggo 2 ACT 1.5 | 2019 | Flex | 67.500 | R$ 62.999 |
| 03 | Range R. Evoque Dynamic 2.0 | 2013 | Gasolina | 91.000 | R$ 100.000 |
| 04 | Fiesta SEL 1.6 | 2017 | Flex | 132.748 | R$ 53.000 |
| 05 | Hilux CD SRX 4x4 2.8 | 2017 | Diesel | 179.000 | R$ 178.000 |
| 06 | EcoSport SE Direct 1.5 | 2019 | Flex | 86.700 | R$ 67.000 |
| 07 | EcoSport Freestyle 2.0 | 2015 | Flex | 98.417 | R$ 55.000 |
| 08 | Onix Hatch LT 1.0 | 2025 | Flex | 55.953 | R$ 73.000 |

Contato: Av. Coelho e Campos, 910 — Santo Antônio, Aracaju/SE, CEP 49060-000 ·
(79) 98819-7051 · (79) 98109-0927 · aracajumultimarcas2020@gmail.com
