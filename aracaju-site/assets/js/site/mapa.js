/* mapa.js — clique-para-ativar no mapa do Google.

   O iframe do Google captura a roda do mouse para dar zoom. Numa página em
   que toda a navegação é rolagem (ScrollSmoother + Lenis, com a faixa
   horizontal presa no pin), passar o mouse por cima do mapa prenderia o
   visitante: a página para de rolar e o mapa começa a dar zoom.

   Então o iframe nasce com pointer-events desligado — a roda atravessa e a
   página continua rolando. Um clique liga a interação; tirar o mouse de cima
   desliga de novo. */
(function () {
  var mapa = document.querySelector('.mapa');
  if (!mapa) return;

  var ativar = function () { mapa.classList.add('is-ativo'); };
  var desativar = function () { mapa.classList.remove('is-ativo'); };

  mapa.addEventListener('click', ativar);
  mapa.addEventListener('mouseleave', desativar);

  // teclado: quem chega no link "Como chegar" por Tab não fica com o mapa ligado
  mapa.addEventListener('focusout', function (ev) {
    if (!mapa.contains(ev.relatedTarget)) desativar();
  });
})();
