# Front-end original extraído (skynetchat.net)

Cópia fiel dos bundles servidos por `https://skynetchat.net/_app/immutable/` em 03/11/2026
(SvelteKit 2 + Vite). **158 arquivos** — 79 JS, 20 CSS, 59 fontes KaTeX, 1 manifest e service worker.
Caminhos e nomes com hash preservados.

**Publicados: 157 de 158 arquivos.** O módulo da página `/politicos` (`nodes/16.DrcJp8ja.js`) fica
fora do repositório porque carrega um token Mapbox embutido — ver [`OMITIDO.md`](OMITIDO.md).

```
frontend/_app/immutable/
  entry/      bootstrap (start + app com o dicionário de rotas)
  nodes/      22 módulos de página (N.<hash>.js)
  chunks/     55 módulos compartilhados (chat, checkout, admin, markdown…)
  assets/     20 CSS + 59 arquivos de fonte (KaTeX)
```

O manifesto completo (caminho, tamanho, tipo e marcadores detectados no conteúdo) está em
`inventario.json`.

## Documentação derivada

| arquivo | conteúdo |
|---|---|
| [`docs/paginas.md`](../docs/paginas.md) | as 22 páginas/nós, as 19 rotas do dicionário e o que cada módulo chama |
| [`docs/componentes-catalogo.md`](../docs/componentes-catalogo.md) | 57 escopos `svelte-*`, 1341 classes, rótulos pt-BR por módulo |
| [`docs/cliente-api.md`](../docs/cliente-api.md) | 65 endpoints `/api/*` com métodos e módulos que os usam |
| [`docs/design-tokens.md`](../docs/design-tokens.md) | cores, raios e tipografia extraídos do CSS |
| [`docs/componentes.html`](../docs/componentes.html) | markup real capturado (pensamento, busca, gaveta, artefato) |
| [`EXTRACAO.md`](../EXTRACAO.md) | protocolo SSE, payloads, sessão e os rótulos do card de pensamento |

## Onde estão as peças do chat

| peça | escopo | arquivo |
|---|---|---|
| card de pensamento + bloco de busca | `svelte-wgb08k` | `chunks/Bg042Fap.js` (compartilhado por todas as rotas de conversa) |
| lista de mensagens + composer | `svelte-76r9u1` | `chunks/Bg042Fap.js` |
| gaveta de fontes | `svelte-1qhowmm` | `chunks/Bg042Fap.js` |
| markdown/KaTeX | `svelte-*` + `assets/0.NDTWPgt7.css` | `chunks/` + `assets/` |
| modo voz (orb 3D) | `nodes/21.CPV7o000.js` | three.js empacotado no próprio módulo |

> Material de referência do front-end. Nenhuma credencial, cookie ou token foi copiado, e o
> backend (busca, modelo, cota) não está incluído — o clone usa `SKYN.apiStream` com o endpoint
> que você indicar.
