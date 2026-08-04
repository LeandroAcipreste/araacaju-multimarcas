/*
 * estoque.js — a vitrine: barra de busca, grade de veículos e o modal com
 * galeria e ficha.
 *
 * Não sabe de onde vêm os dados. Pede tudo ao dados.js, que decide entre a API
 * e o catálogo embutido no HTML. Nenhum card fica escrito à mão no index.html:
 * mexer no estoque é mexer na fonte de dados.
 */
(function () {
  'use strict';

  var WHATSAPP = '5579988197051';

  /* Logotipos das marcas que já estão no projeto. Marca que a API mandar e não
     estiver aqui vira um chip só com o nome — não quebra nada. */
  var LOGOS = {
    'fiat': 'assets/img/marcas/fiat.png',
    'ford': 'assets/img/marcas/ford.png',
    'chevrolet': 'assets/img/marcas/chevrolet.png',
    'toyota': 'assets/img/marcas/toyota.png',
    'chery': 'assets/img/marcas/chery.png',
    'land-rover': 'assets/img/marcas/land-rover.png',
    'renault': 'assets/img/marcas/renault.png'
  };

  document.addEventListener('DOMContentLoaded', function () {
    var modal = document.querySelector('.modal--veiculo');
    var grade = document.querySelector('.estoque');
    if (!modal || !grade || !window.Dados) return;

    var form = document.querySelector('.filtros');
    var faixaMarcas = document.querySelector('.filtros__marcas');
    var intro = document.querySelector('.estoque__intro');
    var vazio = document.querySelector('.estoque__vazio');

    var TODOS = [];        // catálogo inteiro, como veio da fonte
    var VISIVEIS = [];     // o que está na tela depois dos filtros
    var PORSLUG = {};
    var filtros = { marca: '', modelo: '', anoDe: '', anoAte: '', precoDe: '', precoAte: '' };

    var conteudo = modal.querySelector('.modal__content');
    var elNome = modal.querySelector('.veiculo__nome');
    var elPreco = modal.querySelector('.veiculo__preco');
    var elFicha = modal.querySelector('.veiculo__ficha');
    var elFoto = modal.querySelector('.veiculo__foto__img');
    var elMinis = modal.querySelector('.veiculo__miniaturas');
    var elContador = modal.querySelector('.veiculo__contador');
    var elResumo = modal.querySelector('.veiculo__resumo');
    var elDestaques = modal.querySelector('.veiculo__destaques');
    var elOpcionais = modal.querySelector('.veiculo__opcionais');
    var elCta = modal.querySelector('.veiculo__cta');

    var atual = null, foto = 0, tl = null;

    // o root.js declara 'lenis' com let — existe no escopo global léxico,
    // mas não vira propriedade de window
    function temLenis() { return typeof lenis !== 'undefined' && lenis; }

    function el(tag, classe, texto) {
      var e = document.createElement(tag);
      if (classe) e.className = classe;
      if (texto !== undefined) e.textContent = texto;
      return e;
    }

    // ---- grade ------------------------------------------------------------

    function specs(v) {
      return [
        v.ano || '',
        v.combustivel || '',
        v.km ? v.km.toLocaleString('pt-BR') + ' km' : ''
      ].filter(Boolean).join(' · ');
    }

    /* O card mostra o preço sem centavos; o modal mostra o valor cheio. */
    function precoCurto(v) {
      if (!v.precoNumero) return v.preco;
      return 'R$ ' + v.precoNumero.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
    }

    function card(v, indice) {
      var art = el('article', 'estoque__item');
      art.setAttribute('data-veiculo', v.slug);

      var btn = el('button', 'estoque__item__btn');
      btn.type = 'button';

      var media = el('div', 'media estoque__item__media');
      media.setAttribute('data-delay', '0');
      var wrap = el('div', 'media__wrap-source image');
      wrap.style.aspectRatio = '4 / 3';
      var img = el('img', 'media__source w-100');
      img.src = v.capa;
      img.alt = v.completo;
      img.loading = 'lazy';
      wrap.appendChild(img);
      media.appendChild(wrap);

      var info = el('div', 'estoque__item__info');
      info.appendChild(el('span', 'estoque__item__num f-izmir t-parrafo', ('0' + (indice + 1)).slice(-2)));
      info.appendChild(el('h3', 'estoque__item__nome f-regular t-titulo t-upper', v.nome));
      info.appendChild(el('p', 'estoque__item__specs f-izmir t-parrafo', specs(v)));
      info.appendChild(el('p', 'estoque__item__preco f-edit t-titulo', precoCurto(v)));

      btn.appendChild(media);
      btn.appendChild(info);
      art.appendChild(btn);
      return art;
    }

    function desenharGrade() {
      grade.innerHTML = '';
      VISIVEIS.forEach(function (v, i) { grade.appendChild(card(v, i)); });

      if (vazio) vazio.hidden = VISIVEIS.length > 0;
      if (intro) {
        intro.textContent = VISIVEIS.length === TODOS.length
          ? TODOS.length + (TODOS.length === 1 ? ' veículo disponível.' : ' veículos disponíveis.') +
            ' Toque em um carro para ver as fotos e a ficha completa.'
          : VISIVEIS.length + ' de ' + TODOS.length + ' veículos atendem à sua busca.';
      }

      /* A grade nasce depois que o tema montou os ScrollTriggers dele, então
         estes cards não ganham a entrada animada das outras mídias — aparecem
         direto, que é o comportamento certo para um resultado de busca. O
         refresh só recalcula as alturas para o pin não sair do lugar. */
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }

    // ---- barra de busca ---------------------------------------------------

    /* O catálogo traz "Caoa Chery", e uma API pode trazer "FIAT AUTOMOVEIS" ou
       "Chevrolet do Brasil". Casa pelo nome exato e, se não achar, por pedaço —
       assim o logotipo aparece sem precisar padronizar o cadastro da loja. */
    function logoDe(marca) {
      var slug = Dados.slugificar(marca);
      if (LOGOS[slug]) return LOGOS[slug];
      var achado = Object.keys(LOGOS).filter(function (k) { return slug.indexOf(k) > -1; })[0];
      return achado ? LOGOS[achado] : '';
    }

    function chipMarca(marca) {
      var logo = logoDe(marca);
      var b = el('button', 'filtros__marca');
      b.type = 'button';
      b.setAttribute('data-marca', marca);
      b.setAttribute('aria-pressed', 'false');
      b.title = marca;

      if (logo) {
        var img = el('img', 'filtros__marca__logo');
        img.src = logo;
        img.alt = marca;
        img.loading = 'lazy';
        b.appendChild(img);
      } else {
        b.appendChild(el('span', 'filtros__marca__nome f-izmir t-parrafo t-upper', marca));
      }
      return b;
    }

    function encherSelect(sel, valores, rotulo, formatar) {
      if (!sel) return;
      sel.innerHTML = '';
      sel.appendChild(new Option(rotulo, ''));
      valores.forEach(function (v) {
        sel.appendChild(new Option(formatar ? formatar(v) : v, v));
      });
    }

    function montarBusca() {
      var op = Dados.opcoes(TODOS);

      if (faixaMarcas) {
        faixaMarcas.innerHTML = '';
        op.marcas.forEach(function (m) { faixaMarcas.appendChild(chipMarca(m)); });
      }

      encherSelect(form.querySelector('[name=modelo]'), op.modelos, 'Modelo');
      encherSelect(form.querySelector('[name=anoDe]'), op.anos, 'Selecione');
      encherSelect(form.querySelector('[name=anoAte]'), op.anos.slice().reverse(), 'Selecione');

      /* Faixas de preço redondas em vez de um valor por veículo: com o estoque
         girando, uma lista de preços exatos envelhece a cada carro vendido. */
      var faixas = degraus(op.precos);
      encherSelect(form.querySelector('[name=precoDe]'), faixas, 'Selecione', Dados.moeda);
      encherSelect(form.querySelector('[name=precoAte]'), faixas.slice().reverse(), 'Selecione', Dados.moeda);
    }

    function degraus(precos) {
      if (!precos.length) return [];
      var passo = 20000;
      var min = Math.floor(precos[0] / passo) * passo;
      var max = Math.ceil(precos[precos.length - 1] / passo) * passo;
      var saida = [];
      for (var p = Math.max(passo, min); p <= max; p += passo) saida.push(p);
      return saida;
    }

    function aplicar() {
      VISIVEIS = Dados.filtrar(TODOS, filtros);
      desenharGrade();
    }

    function ligarBusca() {
      if (!form) return;

      form.addEventListener('submit', function (ev) { ev.preventDefault(); aplicar(); });

      form.addEventListener('change', function (ev) {
        var campo = ev.target.name;
        if (campo && campo in filtros) {
          filtros[campo] = ev.target.value;
          aplicar();
        }
      });

      if (faixaMarcas) {
        faixaMarcas.addEventListener('click', function (ev) {
          var b = ev.target.closest('.filtros__marca');
          if (!b) return;
          var marca = b.getAttribute('data-marca');
          filtros.marca = (filtros.marca === marca) ? '' : marca;  // clicar de novo desmarca
          [].forEach.call(faixaMarcas.children, function (outro) {
            var on = outro.getAttribute('data-marca') === filtros.marca;
            outro.classList.toggle('is-on', on);
            outro.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          aplicar();
        });
      }

      var limpar = document.querySelector('.filtros__limpar');
      if (limpar) limpar.addEventListener('click', function () {
        Object.keys(filtros).forEach(function (k) { filtros[k] = ''; });
        form.reset();
        if (faixaMarcas) [].forEach.call(faixaMarcas.children, function (b) {
          b.classList.remove('is-on');
          b.setAttribute('aria-pressed', 'false');
        });
        aplicar();
      });
    }

    // ---- galeria ----------------------------------------------------------
    function mostrarFoto(i) {
      if (!atual || !atual.galeria.length) return;
      foto = (i + atual.galeria.length) % atual.galeria.length;
      elFoto.src = atual.galeria[foto];
      elFoto.alt = atual.completo + ' — foto ' + (foto + 1);
      elContador.textContent = (foto + 1) + '/' + atual.galeria.length;
      [].forEach.call(elMinis.children, function (b, n) {
        b.classList.toggle('is-on', n === foto);
      });
      var ativa = elMinis.children[foto];
      if (ativa && ativa.scrollIntoView) ativa.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }

    modal.querySelector('.veiculo__seta--ant').addEventListener('click', function () { mostrarFoto(foto - 1); });
    modal.querySelector('.veiculo__seta--prox').addEventListener('click', function () { mostrarFoto(foto + 1); });

    // ---- preenchimento do modal -------------------------------------------
    function lista(el, itens) {
      el.innerHTML = '';
      itens.forEach(function (t) {
        var li = document.createElement('li');
        li.textContent = t;
        el.appendChild(li);
      });
      var bloco = el.closest('.veiculo__bloco');
      if (bloco) bloco.hidden = !itens.length;
    }

    function preencher(v) {
      atual = v;
      elNome.textContent = v.completo;
      elPreco.textContent = v.preco;

      elFicha.innerHTML = '';
      v.ficha.forEach(function (f) {
        var dt = document.createElement('dt');
        dt.className = 'veiculo__ficha__rotulo f-izmir';
        dt.textContent = f.rotulo;
        var dd = document.createElement('dd');
        dd.className = 'veiculo__ficha__valor f-medium';
        dd.textContent = f.valor;
        elFicha.appendChild(dt);
        elFicha.appendChild(dd);
      });

      elResumo.textContent = v.resumo || '';
      elResumo.hidden = !v.resumo;
      lista(elDestaques, v.destaques || []);
      lista(elOpcionais, v.opcionais || []);

      elCta.href = 'https://wa.me/' + WHATSAPP + '?text=' +
        encodeURIComponent('Olá! Tenho interesse no ' + v.completo + ' — ' + v.preco + '.');

      elMinis.innerHTML = '';
      v.galeria.forEach(function (src, n) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'veiculo__mini';
        b.setAttribute('aria-label', 'Foto ' + (n + 1));
        var img = document.createElement('img');
        img.src = src;
        img.alt = '';
        img.loading = 'lazy';
        b.appendChild(img);
        b.addEventListener('click', function () { mostrarFoto(n); });
        elMinis.appendChild(b);
      });
      elMinis.hidden = v.galeria.length < 2;
      modal.querySelector('.veiculo__seta--ant').hidden = v.galeria.length < 2;
      modal.querySelector('.veiculo__seta--prox').hidden = v.galeria.length < 2;

      mostrarFoto(0);
    }

    // ---- abrir / fechar ---------------------------------------------------
    function timeline() {
      if (tl) return tl;
      tl = gsap.timeline({
        paused: true,
        onStart: function () { modal.classList.remove('d-none'); },
        onReverseComplete: function () { modal.classList.add('d-none'); },
      });
      tl.from(modal, { opacity: 0, duration: .5, ease: 'power1.inOut' }, 0);
      tl.from(conteudo, { opacity: 0, y: '4rem', duration: .6, ease: 'power3.out' }, .15);
      return tl;
    }

    function abrir(slug) {
      var v = PORSLUG[slug];
      if (!v) return;
      preencher(v);
      if (temLenis()) lenis.stop();
      conteudo.scrollTop = 0;
      timeline().play(0);
    }

    function fechar() {
      if (temLenis()) lenis.start();
      timeline().reverse();
    }

    modal.querySelector('.modal__close').addEventListener('click', fechar);
    modal.querySelector('.modal__bg').addEventListener('click', fechar);

    document.addEventListener('keydown', function (ev) {
      if (modal.classList.contains('d-none')) return;
      if (ev.key === 'Escape') fechar();
      if (ev.key === 'ArrowLeft') mostrarFoto(foto - 1);
      if (ev.key === 'ArrowRight') mostrarFoto(foto + 1);
    });

    // "Simular financiamento" fecha este modal e deixa o clicks.js abrir a ficha
    var simular = modal.querySelector('.veiculo__cta--sec');
    if (simular) simular.addEventListener('click', function () { fechar(); });

    /* Delegação: os cards são refeitos a cada busca, então listener preso em
       cada card morreria no primeiro filtro. */
    grade.addEventListener('click', function (ev) {
      var item = ev.target.closest('.estoque__item');
      if (item) abrir(item.getAttribute('data-veiculo'));
    });

    // ---- carga ------------------------------------------------------------
    Dados.carregar().then(function (r) {
      TODOS = r.veiculos;
      PORSLUG = {};
      TODOS.forEach(function (v) { PORSLUG[v.slug] = v; });
      VISIVEIS = TODOS;
      montarBusca();
      ligarBusca();
      desenharGrade();
    });

    // ---- âncoras ----------------------------------------------------------
    /*
     * A faixa horizontal prende o <main> (pin do ScrollTrigger), então tudo
     * que vem depois dela aparece deslocado: um href="#..." nativo cai no meio
     * do pin. A posição real de rolagem é a posição de layout do elemento mais
     * o trecho de scroll que o pin ainda vai consumir.
     */
    function pinPendente() {
      if (!window.ScrollTrigger) return 0;
      var t = ScrollTrigger.getAll().filter(function (x) { return x.pin; })[0];
      if (!t) return 0;
      return Math.max(0, t.end - Math.max(window.scrollY, t.start));
    }

    function rolarAte(el, tentativa) {
      if (!el) return;
      tentativa = tentativa || 0;
      var destino = window.scrollY + el.getBoundingClientRect().top + pinPendente() - 40;

      // Enquanto o pin está ativo o alvo se move junto com a página, então a
      // primeira conta erra por algumas dezenas de pixels. Uma correção curta
      // depois que a rolagem assenta resolve.
      function corrigir() {
        if (tentativa >= 2) return;
        var resto = el.getBoundingClientRect().top - 40;
        if (Math.abs(resto) > 24) rolarAte(el, tentativa + 1);
      }

      if (temLenis()) {
        lenis.start();
        lenis.scrollTo(destino, { duration: tentativa ? .6 : 1.6, onComplete: corrigir });
      } else {
        window.scrollTo({ top: destino, behavior: 'smooth' });
        setTimeout(corrigir, 900);
      }
    }

    function fecharMenu() {
      if (typeof openMenu !== 'undefined' && openMenu) {
        var btn = document.querySelector('.btn--menu');
        if (btn) btn.click();
      }
    }

    // Delegação, e não listener por link: o setLink() do rollovers.js reescreve
    // o innerHTML dos <li> do menu para montar o hover, o que recria os <a> e
    // levaria junto qualquer listener preso neles.
    document.addEventListener('click', function (ev) {
      var a = ev.target.closest && ev.target.closest('a[href^="#"]');
      if (!a) return;
      var alvo = a.getAttribute('href');
      if (alvo.length < 2 || !document.querySelector(alvo)) return;
      ev.preventDefault();
      fecharMenu();
      rolarAte(document.querySelector(alvo));
    });

    /*
     * "Home" é o topo desta página, não outra página. O tema aponta os três
     * menus para index.html e o Swup transforma isso numa navegação completa:
     * a home recarrega, o preloader roda de novo, a faixa horizontal volta ao
     * começo e a URL vira /index.html. Para quem clicou, é cair numa página
     * sem contexto nenhum. Aqui o clique só fecha o menu e sobe.
     */
    document.addEventListener('click', function (ev) {
      var home = ev.target.closest && ev.target.closest('a[href="index.html"]');
      if (!home) return;
      ev.preventDefault();
      fecharMenu();
      if (temLenis()) {
        lenis.start();
        lenis.scrollTo(0, { duration: 1.4 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
})();
