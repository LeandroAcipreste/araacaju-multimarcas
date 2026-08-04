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

## Estoque e o modal do veículo

A grade fica logo depois da faixa horizontal — onde a página passa a rolar para
baixo — em `#veiculos`, com 4 colunas no desktop, 3 em 1200px, 2 em 950px e 1
em 560px. Cada card abre o modal do veículo, que segue o arranjo da página de
detalhe do site original: galeria com miniaturas à esquerda; preço, ficha de 8
campos, "Proposta via WhatsApp" e "Simular financiamento" à direita; embaixo, o
resumo, os destaques e os opcionais.

Os dados ficam num `<script id="dados-veiculos" type="application/json">` no
fim do HTML e o `estoque.js` monta o resto. Para mexer no estoque é esse JSON
que muda — o HTML dos cards e o modal não guardam informação de veículo.

A galeria anda por setas, miniaturas e pelas setas do teclado; `Esc` fecha.

### As fotos

O scrape só tinha capturado **uma foto por carro, reduzida** (300×225, ~12 KB).
As galerias apontavam para `arquivos.boomsistemas.com.br`, então baixei as
**79 fotos em resolução cheia** direto de lá para
`assets/img/veiculos/<slug>/01.jpg…`. São 9 a 12 por veículo, ~15 MB no total.
São fotos da própria loja.

### Âncoras

Links `#...` são interceptados pelo `estoque.js`. O motivo é o pin: a faixa
horizontal prende o `<main>` no ScrollTrigger, então o scroll nativo de uma
âncora cai no meio do pin. O cálculo soma a posição de layout do alvo ao trecho
de rolagem que o pin ainda vai consumir, e faz uma correção curta depois que a
rolagem assenta.

A ligação é por **delegação no `document`**, não por listener em cada `<a>`: o
`setLink()` reescreve o innerHTML dos itens de menu e recria os links.

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

E em `brand.css`:

- `.logo` foi de `5.279em` para `7.9em` de largura. Essa caixa tem tamanho fixo:
  `.logo__normal` é `absolute` encostado à esquerda e `.logo__group` fica
  encostado à direita, sem um empurrar o outro. Os 5.279em foram medidos na
  palavra "Normal" — "ARACAJU" é mais larga e escrevia por cima do "multi" no
  preloader. **Se o nome mudar, este número precisa ser remedido.**
- `.logo__boring` perdeu o `transform: scale(-1,-1)` — na marca antiga girar a
  palavra era a piada; em "marcas" só deixava o texto de cabeça para baixo.
- O wordmark do rodapé é tipográfico no lugar do SVG de terceiros.
- O `width: 80vw` do wrapper do hero passou a valer só acima de 950px. Abaixo
  disso o CSS dimensiona a grade dos títulos a partir de `99.9vw`, e o wrapper
  estreito jogava o conteúdo para fora da tela pela esquerda (o site original
  tem esse mesmo defeito no mobile).

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
