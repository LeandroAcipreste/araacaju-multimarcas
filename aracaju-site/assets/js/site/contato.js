/*
 * contato.js — ficha cadastral em 5 passos.
 *
 * Mesma sequência do site original (dados pessoais, endereço, dados
 * profissionais, referências, descrição do bem). Não há backend: no fim o
 * formulário monta a mensagem e abre a conversa no WhatsApp da loja.
 */
(function () {
  'use strict';

  var WHATSAPP = '5579988197051';

  var ETAPAS = [
    { titulo: 'Dados pessoais', campos: [
      ['nome', 'Nome'], ['cpf', 'CPF'], ['rg', 'RG'], ['nascimento', 'Nascimento'],
      ['celular', 'Celular/WhatsApp'], ['email', 'E-mail'],
      ['cnh', 'CNH'], ['restricao', 'Restrição'], ['financiamento', 'Já financiou'],
    ] },
    { titulo: 'Endereço', campos: [
      ['cep', 'CEP'], ['rua', 'Rua'], ['numero', 'Número'],
      ['bairro', 'Bairro'], ['cidade', 'Cidade'], ['complemento', 'Complemento'],
    ] },
    { titulo: 'Dados profissionais', campos: [
      ['profissao', 'Profissão'], ['cargo', 'Cargo'], ['renda', 'Renda mensal'],
    ] },
    { titulo: 'Referências', campos: [
      ['ref_pessoal', 'Referência pessoal'], ['ref_telefone', 'Telefone'],
      ['banco', 'Banco'], ['agencia', 'Agência'], ['conta', 'Conta corrente'],
      ['gerente', 'Gerente'],
    ] },
    { titulo: 'Bem a ser financiado', campos: [
      ['bem_marca', 'Marca'], ['bem_modelo', 'Modelo'], ['bem_ano', 'Ano'],
      ['bem_combustivel', 'Combustível'], ['entrada', 'Entrada'],
    ] },
  ];

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.querySelector('#form-ficha');
    if (!form) return;

    var etapas = [].slice.call(form.querySelectorAll('.ficha__etapa'));
    var passos = [].slice.call(document.querySelectorAll('.ficha__passo'));
    var btnVoltar = form.querySelector('.ficha__voltar');
    var btnProximo = form.querySelector('.ficha__proximo');
    var btnEnviar = form.querySelector('.ficha__enviar');
    var atual = 0;

    var erro = document.createElement('p');
    erro.className = 'ficha__erro';
    erro.hidden = true;
    form.insertBefore(erro, form.querySelector('.ficha__acoes'));

    function mostrar(i) {
      atual = Math.max(0, Math.min(etapas.length - 1, i));
      etapas.forEach(function (el, n) {
        el.hidden = n !== atual;
        el.classList.toggle('is-on', n === atual);
      });
      passos.forEach(function (el, n) {
        el.classList.toggle('is-on', n === atual);
        el.classList.toggle('is-feito', n < atual);
      });
      btnVoltar.hidden = atual === 0;
      btnProximo.hidden = atual === etapas.length - 1;
      btnEnviar.hidden = atual !== etapas.length - 1;
      erro.hidden = true;
      // o modal rola dentro de si; volta ao topo a cada troca de etapa
      var conteudo = form.closest('.modal__content');
      if (conteudo && conteudo.scrollIntoView) conteudo.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }

    // Só os campos marcados como required travam o avanço; o resto a loja
    // completa no atendimento.
    function valida() {
      var faltando = [].slice.call(etapas[atual].querySelectorAll('[required]'))
        .filter(function (i) { return !i.value.trim(); });
      etapas[atual].querySelectorAll('.is-invalido').forEach(function (i) {
        i.classList.remove('is-invalido');
      });
      if (!faltando.length) return true;
      faltando.forEach(function (i) { i.classList.add('is-invalido'); });
      erro.textContent = faltando.length === 1
        ? 'Preencha o campo obrigatório para continuar.'
        : 'Preencha os ' + faltando.length + ' campos obrigatórios para continuar.';
      erro.hidden = false;
      faltando[0].focus();
      return false;
    }

    btnProximo.addEventListener('click', function () { if (valida()) mostrar(atual + 1); });
    btnVoltar.addEventListener('click', function () { mostrar(atual - 1); });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!valida()) return;

      var d = new FormData(form);
      var linhas = ['Olá! Segue minha ficha cadastral.'];

      ETAPAS.forEach(function (etapa) {
        var preenchidos = etapa.campos
          .map(function (c) { return [c[1], (d.get(c[0]) || '').toString().trim()]; })
          .filter(function (c) { return c[1]; });
        if (!preenchidos.length) return;
        linhas.push('');
        linhas.push('*' + etapa.titulo + '*');
        preenchidos.forEach(function (c) { linhas.push(c[0] + ': ' + c[1]); });
      });

      window.open('https://wa.me/' + WHATSAPP + '?text=' +
        encodeURIComponent(linhas.join('\n')), '_blank', 'noopener');
    });

    mostrar(0);
  });
})();
