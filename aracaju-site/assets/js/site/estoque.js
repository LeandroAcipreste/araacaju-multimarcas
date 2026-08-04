/*
 * estoque.js — grade de veículos e o modal com galeria e ficha.
 *
 * Os dados saem do <script id="dados-veiculos"> (gerado a partir das páginas
 * de detalhe do site original). Clicar num card abre o modal; a galeria anda
 * por setas, miniaturas e teclado.
 */
(function () {
  'use strict';

  var WHATSAPP = '5579988197051';

  document.addEventListener('DOMContentLoaded', function () {
    var fonte = document.querySelector('#dados-veiculos');
    var modal = document.querySelector('.modal--veiculo');
    if (!fonte || !modal) return;

    var VEICULOS = {};
    JSON.parse(fonte.textContent).forEach(function (v) { VEICULOS[v.slug] = v; });

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

    // ---- preenchimento ----------------------------------------------------
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
      var v = VEICULOS[slug];
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

    // ---- cards ------------------------------------------------------------
    document.querySelectorAll('.estoque__item').forEach(function (card) {
      card.querySelector('.estoque__item__btn').addEventListener('click', function () {
        abrir(card.getAttribute('data-veiculo'));
      });
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

    // Delegação, e não listener por link: o setLink() do rollovers.js reescreve
    // o innerHTML dos <li> do menu para montar o hover, o que recria os <a> e
    // levaria junto qualquer listener preso neles.
    document.addEventListener('click', function (ev) {
      var a = ev.target.closest && ev.target.closest('a[href^="#"]');
      if (!a) return;
      var alvo = a.getAttribute('href');
      if (alvo.length < 2 || !document.querySelector(alvo)) return;
      ev.preventDefault();
      if (typeof openMenu !== 'undefined' && openMenu) {
        var btn = document.querySelector('.btn--menu');
        if (btn) btn.click();
      }
      rolarAte(document.querySelector(alvo));
    });
  });
})();
