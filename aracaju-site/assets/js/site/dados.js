/*
 * dados.js — a única porta de entrada de dados do site.
 *
 * Nada mais no front end sabe de onde vem o estoque. O estoque.js pede
 * `Dados.carregar()`, recebe uma lista já no formato do site e desenha. Trocar
 * o catálogo embutido por uma API é mexer só no CONFIG aqui embaixo.
 *
 * ---------------------------------------------------------------------------
 * PARA LIGAR NA API
 * ---------------------------------------------------------------------------
 * 1. Ponha a URL em CONFIG.url.
 * 2. Se a lista não vier na raiz da resposta, diga onde ela está em
 *    CONFIG.caminhoDaLista (ex.: 'data.veiculos').
 * 3. Confira os nomes dos campos em CAMPOS. Cada linha aceita vários nomes;
 *    o primeiro que existir no objeto ganha. Se a sua API usa um nome que não
 *    está na lista, acrescente — é o único lugar que precisa saber disso.
 * 4. Se a API já filtra do lado do servidor, deixe CONFIG.filtraNoServidor
 *    como true: aí os filtros viram query string em vez de peneira no
 *    navegador.
 *
 * Enquanto CONFIG.url estiver vazio, o site funciona igual, lendo o catálogo
 * embutido em <script id="dados-veiculos">. É o mesmo formato de saída, então
 * dá para desenvolver e publicar sem a API no ar.
 *
 * ---------------------------------------------------------------------------
 * FORMATO DE SAÍDA (o que o resto do site consome)
 * ---------------------------------------------------------------------------
 *   slug        string   identificador na URL e no data-veiculo do card
 *   nome        string   nome curto, para o card ("Punto Sporting")
 *   completo    string   nome longo, para o modal e o WhatsApp
 *   preco       string   já formatado ("R$ 43.000,00")
 *   precoNumero number   para ordenar e filtrar (43000)
 *   marca       string   "Fiat"
 *   modelo      string   "Punto"
 *   ano         number    2014
 *   km          number    175000
 *   combustivel string   "Flex"
 *   capa        string   URL da foto do card
 *   galeria     string[] URLs das fotos do modal
 *   ficha       [{rotulo, valor}]
 *   resumo      string
 *   destaques   string[]
 *   opcionais   string[]
 */
window.Dados = (function () {
  'use strict';

  var CONFIG = {
    url: '',
    caminhoDaLista: '',
    filtraNoServidor: false,
    timeout: 8000
  };

  /* Nomes de campo aceitos, em ordem de preferência. Acrescente os da sua API
     na frente da lista — não precisa remover os outros. */
  var CAMPOS = {
    slug:        ['slug', 'id', 'codigo', 'identificador'],
    nome:        ['nome', 'titulo', 'modelo', 'name'],
    completo:    ['completo', 'nomeCompleto', 'descricaoCurta', 'titulo'],
    preco:       ['preco', 'valor', 'precoVenda', 'price'],
    marca:       ['marca', 'fabricante', 'brand'],
    modelo:      ['modelo', 'model'],
    ano:         ['ano', 'anoModelo', 'anoFabricacao', 'year'],
    km:          ['km', 'quilometragem', 'hodometro', 'mileage'],
    combustivel: ['combustivel', 'tipoCombustivel', 'fuel'],
    cambio:      ['cambio', 'transmissao'],
    cor:         ['cor', 'color'],
    portas:      ['portas', 'numeroPortas'],
    capa:        ['capa', 'foto', 'fotoPrincipal', 'imagem', 'thumbnail'],
    galeria:     ['galeria', 'fotos', 'imagens', 'images', 'photos'],
    resumo:      ['resumo', 'descricao', 'observacoes', 'description'],
    destaques:   ['destaques', 'itens', 'caracteristicas'],
    opcionais:   ['opcionais', 'acessorios', 'options']
  };

  // ---- utilidades ---------------------------------------------------------

  function pegar(obj, caminho) {
    if (!caminho) return obj;
    return caminho.split('.').reduce(function (o, p) {
      return (o === null || o === undefined) ? undefined : o[p];
    }, obj);
  }

  function primeiro(obj, nomes) {
    for (var i = 0; i < nomes.length; i++) {
      var v = obj[nomes[i]];
      if (v !== undefined && v !== null && v !== '') return v;
    }
    return undefined;
  }

  function texto(v) {
    return (v === undefined || v === null) ? '' : String(v).trim();
  }

  /* "R$ 43.000,00" → 43000 · "43000.00" → 43000 · 43000 → 43000
     O ponto é separador de milhar no formato pt-BR, e a vírgula, decimal. */
  function numero(v) {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    var s = texto(v).replace(/[^\d,.-]/g, '');
    if (!s) return 0;
    if (s.indexOf(',') > -1) s = s.replace(/\./g, '').replace(',', '.');
    else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, '');
    var n = parseFloat(s);
    return isFinite(n) ? n : 0;
  }

  function moeda(v) {
    if (typeof v === 'string' && /r\$/i.test(v)) return v.trim();
    var n = numero(v);
    if (!n) return texto(v);
    return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function slugificar(s) {
    return texto(s).toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function lista(v) {
    if (Array.isArray(v)) return v.map(texto).filter(Boolean);
    if (typeof v === 'string') return v.split(/\s*[;|\n]\s*/).map(texto).filter(Boolean);
    return [];
  }

  /* Fotos podem vir como ["url"] ou como [{url}] / [{src}] / [{link}]. */
  function fotos(v) {
    if (!Array.isArray(v)) return typeof v === 'string' && v ? [v] : [];
    return v.map(function (f) {
      return typeof f === 'string' ? f : texto(f && (f.url || f.src || f.link || f.imagem));
    }).filter(Boolean);
  }

  // ---- normalização -------------------------------------------------------

  /* Quando a API manda os dados soltos e não a ficha pronta, monta a ficha do
     modal a partir do que existir — na mesma ordem do site original. */
  function fichaDe(v) {
    return [
      { rotulo: 'Ano', valor: v.ano ? String(v.ano) : '' },
      { rotulo: 'Quilometragem', valor: v.km ? v.km.toLocaleString('pt-BR') + ' km' : '' },
      { rotulo: 'Marca', valor: v.marca },
      { rotulo: 'Câmbio', valor: v.cambio },
      { rotulo: 'Combustível', valor: v.combustivel },
      { rotulo: 'Portas', valor: v.portas },
      { rotulo: 'Modelo', valor: v.modelo },
      { rotulo: 'Cor', valor: v.cor }
    ].filter(function (f) { return texto(f.valor); });
  }

  /* Caminho inverso: o catálogo embutido guarda Ano/Marca/Modelo dentro da
     ficha, e os filtros precisam desses campos soltos. */
  function daFicha(ficha, rotulo) {
    var achado = (ficha || []).filter(function (f) {
      return slugificar(f.rotulo) === slugificar(rotulo);
    })[0];
    return achado ? texto(achado.valor) : '';
  }

  function normalizar(bruto) {
    if (!bruto || typeof bruto !== 'object') return null;

    var ficha = Array.isArray(bruto.ficha) ? bruto.ficha.map(function (f) {
      return { rotulo: texto(f.rotulo || f.label), valor: texto(f.valor || f.value) };
    }) : null;

    var v = {};
    v.marca = texto(primeiro(bruto, CAMPOS.marca)) || daFicha(ficha, 'Marca');
    v.modelo = texto(primeiro(bruto, CAMPOS.modelo)) || daFicha(ficha, 'Modelo');
    v.cambio = texto(primeiro(bruto, CAMPOS.cambio)) || daFicha(ficha, 'Câmbio');
    v.cor = texto(primeiro(bruto, CAMPOS.cor)) || daFicha(ficha, 'Cor');
    v.portas = texto(primeiro(bruto, CAMPOS.portas)) || daFicha(ficha, 'Portas');
    v.combustivel = texto(primeiro(bruto, CAMPOS.combustivel)) || daFicha(ficha, 'Combustível');
    v.ano = numero(primeiro(bruto, CAMPOS.ano) || daFicha(ficha, 'Ano'));
    v.km = numero(primeiro(bruto, CAMPOS.km) || daFicha(ficha, 'Quilometragem'));

    var precoBruto = primeiro(bruto, CAMPOS.preco);
    v.preco = moeda(precoBruto);
    v.precoNumero = numero(precoBruto);

    v.nome = texto(primeiro(bruto, CAMPOS.nome)) || [v.marca, v.modelo].filter(Boolean).join(' ');
    v.completo = texto(primeiro(bruto, CAMPOS.completo)) || v.nome;
    v.slug = slugificar(primeiro(bruto, CAMPOS.slug) || v.completo);

    v.galeria = fotos(primeiro(bruto, CAMPOS.galeria));
    v.capa = texto(primeiro(bruto, CAMPOS.capa)) || v.galeria[0] || '';
    if (v.capa && v.galeria.indexOf(v.capa) === -1) v.galeria.unshift(v.capa);

    v.resumo = texto(primeiro(bruto, CAMPOS.resumo));
    v.destaques = lista(primeiro(bruto, CAMPOS.destaques));
    v.opcionais = lista(primeiro(bruto, CAMPOS.opcionais));
    v.ficha = (ficha && ficha.length) ? ficha : fichaDe(v);

    return (v.slug && v.nome) ? v : null;
  }

  // ---- carregamento -------------------------------------------------------

  function doHtml() {
    var fonte = document.querySelector('#dados-veiculos');
    if (!fonte) return [];
    try {
      return JSON.parse(fonte.textContent).map(normalizar).filter(Boolean);
    } catch (e) {
      console.error('dados.js: catálogo embutido inválido —', e.message);
      return [];
    }
  }

  function daApi(filtros) {
    var url = CONFIG.url;
    if (CONFIG.filtraNoServidor && filtros) {
      var q = Object.keys(filtros)
        .filter(function (k) { return filtros[k] !== '' && filtros[k] !== undefined; })
        .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(filtros[k]); })
        .join('&');
      if (q) url += (url.indexOf('?') > -1 ? '&' : '?') + q;
    }

    var corta = new AbortController();
    var relogio = setTimeout(function () { corta.abort(); }, CONFIG.timeout);

    return fetch(url, { signal: corta.signal, headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (json) {
        var bruta = pegar(json, CONFIG.caminhoDaLista);
        if (!Array.isArray(bruta)) throw new Error('a resposta não trouxe uma lista' +
          (CONFIG.caminhoDaLista ? ' em "' + CONFIG.caminhoDaLista + '"' : ''));
        return bruta.map(normalizar).filter(Boolean);
      })
      .finally(function () { clearTimeout(relogio); });
  }

  /* Sempre resolve. Se a API falhar, cai no catálogo embutido e avisa no
     console — uma vitrine em branco seria pior que uma vitrine desatualizada. */
  function carregar(filtros) {
    if (!CONFIG.url) return Promise.resolve({ veiculos: doHtml(), origem: 'html' });
    return daApi(filtros)
      .then(function (lista) { return { veiculos: lista, origem: 'api' }; })
      .catch(function (e) {
        console.error('dados.js: falhou ao ler a API (' + e.message + '), usando o catálogo embutido.');
        return { veiculos: doHtml(), origem: 'html', erro: e };
      });
  }

  // ---- filtros ------------------------------------------------------------

  function filtrar(veiculos, f) {
    f = f || {};
    return veiculos.filter(function (v) {
      if (f.marca && slugificar(v.marca) !== slugificar(f.marca)) return false;
      if (f.modelo && slugificar(v.modelo) !== slugificar(f.modelo)) return false;
      if (f.anoDe && v.ano && v.ano < numero(f.anoDe)) return false;
      if (f.anoAte && v.ano && v.ano > numero(f.anoAte)) return false;
      if (f.precoDe && v.precoNumero && v.precoNumero < numero(f.precoDe)) return false;
      if (f.precoAte && v.precoNumero && v.precoNumero > numero(f.precoAte)) return false;
      return true;
    });
  }

  /* Opções para os campos da busca, tiradas do próprio catálogo: o que não
     existe no estoque não aparece na lista. */
  function opcoes(veiculos) {
    var unicos = function (arr) {
      return arr.filter(function (x, i, a) { return x && a.indexOf(x) === i; });
    };
    return {
      marcas: unicos(veiculos.map(function (v) { return v.marca; })).sort(),
      modelos: unicos(veiculos.map(function (v) { return v.modelo || v.nome; })).sort(),
      anos: unicos(veiculos.map(function (v) { return v.ano; })).sort(function (a, b) { return a - b; }),
      precos: unicos(veiculos.map(function (v) { return v.precoNumero; })).sort(function (a, b) { return a - b; })
    };
  }

  return {
    CONFIG: CONFIG,
    CAMPOS: CAMPOS,
    carregar: carregar,
    normalizar: normalizar,
    filtrar: filtrar,
    opcoes: opcoes,
    slugificar: slugificar,
    moeda: moeda,
    numero: numero
  };
})();
