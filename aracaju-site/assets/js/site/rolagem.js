/*
 * rolagem.js — o aviso de rolagem no rodapé da tela, que também é botão.
 *
 * A home tem dois sentidos de leitura e isso não é óbvio para quem não está
 * acostumado: primeiro a faixa horizontal, em que a página anda para o lado, e
 * depois o resto, que desce normalmente. O aviso diz qual é o sentido no
 * momento, e apertá-lo avança a página — quem não se dá bem com a rolagem do
 * mouse chega ao fim do site clicando.
 *
 * Os dois sentidos são o mesmo gesto: a faixa horizontal é movida por rolagem
 * vertical presa num pin, então avançar é sempre somar altura de tela à
 * posição. Quem muda é só o desenho da seta.
 *
 * Como saber em qual dos dois estamos: a faixa horizontal é um pin do
 * ScrollTrigger. Enquanto a posição da página estiver entre o start e o end
 * desse pin, o movimento na tela é lateral; passou do end, é vertical.
 */
(function () {
  'use strict';

  // Mesmo texto nos dois sentidos: quem diz o sentido é a seta.
  var TEXTOS = {
    lado: 'Role o scroll ou clique aqui',
    baixo: 'Role o scroll ou clique aqui'
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

    // o root.js declara 'lenis' com let — existe no escopo global léxico,
    // mas não vira propriedade de window
    function temLenis() { return typeof lenis !== 'undefined' && lenis; }

    /* Um toque no botão = uma tela de avanço. Vale para os dois sentidos: na
       faixa horizontal quem manda no movimento lateral é a rolagem vertical
       presa no pin, então somar altura de tela empurra a faixa para o lado
       exatamente como a roda do mouse faria. */
    function avancar() {
      var doc = document.scrollingElement || document.documentElement;
      var atualY = window.scrollY || doc.scrollTop || 0;
      var destino = atualY + window.innerHeight * .9;

      if (temLenis()) {
        lenis.start();
        lenis.scrollTo(destino, { duration: 1.1 });
      } else {
        window.scrollTo({ top: destino, behavior: 'smooth' });
      }
    }

    aviso.addEventListener('click', avancar);

    /* Some quando há modal aberto, com o menu aberto e no fim da página, onde
       não há mais para onde rolar e o aviso viraria estorvo em cima do rodapé.

       O fim da página não sai do <body>: no mobile quem rola é o wrapper do
       ScrollSmoother, e ali `body.scrollHeight` é igual à altura da tela — a
       conta dava "falta nada" já na primeira tela e o aviso nunca aparecia.
       Quando não dá para medir, o certo é não esconder. */
    function atrapalhando() {
      if (document.querySelector('.modal:not(.d-none)')) return true;
      if (typeof openMenu !== 'undefined' && openMenu) return true;

      var doc = document.scrollingElement || document.documentElement;
      var total = Math.max(doc.scrollHeight || 0, document.body.scrollHeight || 0);
      if (total <= window.innerHeight + 4) return false;

      var pos = window.scrollY || doc.scrollTop || 0;
      return (total - pos - window.innerHeight) < window.innerHeight * .6;
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
