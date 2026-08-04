/*
 * venda.js — modal "Venda seu veículo".
 *
 * Mesma ideia da ficha cadastral: não há backend, então no fim o formulário
 * monta a mensagem e abre a conversa no WhatsApp da loja. Abre pelo cartão
 * "Quer vender seu veículo?", que usa href="vender" — o Swup ignora esse href
 * pela mesma exceção que já existia para "contacto" (main.js), porque não é
 * uma página, é o gatilho deste modal.
 *
 * O reCAPTCHA da tela original ficou de fora pelo mesmo motivo de lá: sem
 * servidor para validar o token ele seria só enfeite.
 */
(function () {
  'use strict';

  var WHATSAPP = '5579988197051';

  var CAMPOS = [
    ['marca', 'Marca'], ['modelo', 'Modelo'], ['ano', 'Ano'], ['km', 'KM'],
    ['nome', 'Nome do contato'], ['telefone', 'Telefone'], ['email', 'E-mail'],
    ['financiado', 'Financiado']
  ];

  document.addEventListener('DOMContentLoaded', function () {
    var modal = document.querySelector('.modal--venda');
    var form = document.querySelector('#form-venda');
    if (!modal || !form) return;

    var conteudo = modal.querySelector('.modal__content');
    var tl = null;

    // o root.js declara 'lenis' com let — existe no escopo global léxico,
    // mas não vira propriedade de window
    function temLenis() { return typeof lenis !== 'undefined' && lenis; }

    /* O main.js faz esta dança de label só dentro de .modal--contact. Aqui
       repetimos para este modal: o label sobe e encolhe quando o campo recebe
       foco, e só volta se o campo ficar vazio. */
    form.querySelectorAll('.modal__content__form__wrap-input').forEach(function (wrap) {
      var label = wrap.querySelector('.modal__content__form__label');
      var input = wrap.querySelector('.modal__content__form__input');
      if (!label || !input) return;
      input.addEventListener('focus', function () { label.classList.add('on'); });
      input.addEventListener('focusout', function () {
        if (!input.value) label.classList.remove('on');
      });
    });

    var erro = document.createElement('p');
    erro.className = 'ficha__erro';
    erro.hidden = true;
    form.insertBefore(erro, form.querySelector('.ficha__acoes'));

    function timeline() {
      if (tl) return tl;
      tl = gsap.timeline({
        paused: true,
        onStart: function () { modal.classList.remove('d-none'); },
        onReverseComplete: function () { modal.classList.add('d-none'); }
      });
      tl.from(modal, { opacity: 0, duration: .5, ease: 'power1.inOut' }, 0);
      tl.from(conteudo, { opacity: 0, y: '4rem', duration: .6, ease: 'power3.out' }, .15);
      return tl;
    }

    function abrir() {
      if (temLenis()) lenis.stop();
      conteudo.scrollTop = 0;
      timeline().play(0);
    }

    function fechar() {
      if (temLenis()) lenis.start();
      timeline().reverse();
    }

    /* Delegação no documento: o cartão que abre este modal fica dentro de um
       bloco que o tema pode reanimar, e o clique tem de funcionar de qualquer
       lugar que aponte para "vender". */
    document.addEventListener('click', function (ev) {
      var a = ev.target.closest && ev.target.closest('a[href="vender"]');
      if (!a) return;
      ev.preventDefault();
      abrir();
    });

    modal.querySelector('.modal__close').addEventListener('click', fechar);
    modal.querySelector('.modal__bg').addEventListener('click', fechar);

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && !modal.classList.contains('d-none')) fechar();
    });

    function valida() {
      var faltando = [].slice.call(form.querySelectorAll('[required]'))
        .filter(function (i) { return !i.value.trim(); });
      form.querySelectorAll('.is-invalido').forEach(function (i) {
        i.classList.remove('is-invalido');
      });
      if (!faltando.length) return true;
      faltando.forEach(function (i) { i.classList.add('is-invalido'); });
      erro.textContent = faltando.length === 1
        ? 'Preencha o campo obrigatório para enviar.'
        : 'Preencha os ' + faltando.length + ' campos obrigatórios para enviar.';
      erro.hidden = false;
      faltando[0].focus();
      return false;
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!valida()) return;

      var d = new FormData(form);
      var linhas = ['Olá! Quero vender meu veículo.', ''];
      CAMPOS.forEach(function (c) {
        var valor = (d.get(c[0]) || '').toString().trim();
        if (valor) linhas.push(c[1] + ': ' + valor);
      });

      window.open('https://wa.me/' + WHATSAPP + '?text=' +
        encodeURIComponent(linhas.join('\n')), '_blank', 'noopener');
    });
  });
})();
