/*
 * rolagem.js — o aviso de rolagem no rodapé da tela.
 *
 * A home tem dois sentidos de leitura e isso não é óbvio para quem não está
 * acostumado: primeiro a faixa horizontal, em que a página anda para o lado, e
 * depois o resto, que desce normalmente. O aviso diz qual é o sentido no
 * momento e lembra que quem manda é a rolagem do mouse.
 *
 * Como saber em qual dos dois estamos: a faixa horizontal é um pin do
 * ScrollTrigger. Enquanto a posição da página estiver entre o start e o end
 * desse pin, o movimento na tela é lateral; passou do end, é vertical.
 */
(function () {
  'use strict';

  var TEXTOS = {
    lado: 'Role a página para o lado',
    baixo: 'Role a página para baixo'
  };

  document.addEventListener('DOMContentLoaded', function () {
    var aviso = document.querySelector('.rolagem');
    if (!aviso) return;

    var texto = aviso.querySelector('.rolagem__texto');
    var direcao = '';

    function pin() {
      if (!window.ScrollTrigger) return null;
      return ScrollTrigger.getAll().filter(function (t) { return t.pin; })[0] || null;
    }

    /* Some quando há modal aberto, com o menu aberto e no fim da página, onde
       não há mais para onde rolar e o aviso viraria estorvo em cima do rodapé. */
    function atrapalhando() {
      if (document.querySelector('.modal:not(.d-none)')) return true;
      if (typeof openMenu !== 'undefined' && openMenu) return true;
      var falta = document.body.scrollHeight - window.scrollY - window.innerHeight;
      return falta < window.innerHeight * .6;
    }

    function atualizar() {
      var t = pin();
      var lateral = !!t && window.scrollY < t.end;
      var nova = lateral ? 'lado' : 'baixo';

      if (nova !== direcao) {
        direcao = nova;
        aviso.setAttribute('data-direcao', nova);
        texto.textContent = TEXTOS[nova];
      }

      aviso.classList.toggle('is-fora', atrapalhando());
    }

    window.addEventListener('scroll', atualizar, { passive: true });
    window.addEventListener('resize', atualizar);

    /* O pin só nasce quando o tema monta os ScrollTriggers, lá no init(), que
       vem depois do preloader — e o preloader demora o quanto as imagens
       demorarem. Sem esperar por ele, a primeira tela mostraria "para baixo",
       que é justamente a instrução errada na hora que mais importa. Daí a
       espera ativa, curta, que para assim que o pin aparece. */
    var tentativas = 0;
    var espera = setInterval(function () {
      atualizar();
      if (pin() || ++tentativas > 40) clearInterval(espera);
    }, 400);

    if (window.ScrollTrigger && ScrollTrigger.addEventListener) {
      ScrollTrigger.addEventListener('refresh', atualizar);
    }

    atualizar();
  });
})();
