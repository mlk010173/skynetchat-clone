# Front-end original extraído (skynetchat.net)

Cópia fiel dos bundles servidos por `https://skynetchat.net/_app/immutable/` em 03/11/2026
(SvelteKit 2 + Vite). 99 arquivos, 5.5 MB, caminhos originais preservados.

```
frontend/_app/immutable/
  entry/      bootstrap (start, app)
  nodes/      uma página por rota (/n/0.js = home, /n/21.js = chat, etc.)
  chunks/     componentes e módulos compartilhados
  assets/     CSS e fontes
```

`inventario.json` lista tudo (caminho, tamanho, marcadores detectados no conteúdo).

## Arquivos principais

| caminho | tamanho | conteúdo detectado |
|---|---|---|
| `_app/immutable/chunks/Bg042Fap.js` | 1512 KB | chat, thinking, protocol, login, osint, image, payments, groups, memory, projects, affiliate, pdf, artifacts, markdown, files, settings |
| `_app/immutable/chunks/BS-h3Oia.js` | 1321 KB | osint |
| `_app/immutable/nodes/21.CPV7o000.js` | 519 KB | thinking, protocol, osint, tts, files, settings |
| `_app/immutable/chunks/OUqc6aCq.js` | 417 KB | osint |
| `_app/immutable/chunks/Bwj1DJhR.js` | 401 KB | osint, files |
| `_app/immutable/nodes/11.cObUPbaW.js` | 179 KB | osint, payments, memory, artifacts |
| `_app/immutable/assets/0.NDTWPgt7.css` | 167 KB | chat, osint, markdown |
| `_app/immutable/assets/3.CCEN65Uu.css` | 144 KB | chat, protocol, login, osint, image, artifacts, markdown, files |
| `_app/immutable/chunks/BKM70PP7.js` | 118 KB | payments, projects |
| `_app/immutable/nodes/20.DV6nrX6N.js` | 85 KB | thinking, protocol, tts, markdown, files |
| `_app/immutable/assets/11.4t6v2-2C.css` | 71 KB | payments |
| `_app/immutable/nodes/9.BvJk6gU-.js` | 68 KB | payments |
| `_app/immutable/chunks/TVrrPJSL.js` | 61 KB | files, settings |
| `_app/immutable/chunks/Bd2QW5tM.js` | 33 KB | — |
| `_app/immutable/assets/12.DlTK74Ho.css` | 33 KB | — |
| `_app/immutable/nodes/5.doPDDGKt.js` | 33 KB | affiliate |
| `_app/immutable/chunks/DudBp08d.js` | 32 KB | osint |
| `_app/immutable/nodes/16.DrcJp8ja.js` | 31 KB | — |
| `_app/immutable/nodes/19.QC4NniiZ.js` | 29 KB | payments |
| `_app/immutable/nodes/6.BCB7ZHm8.js` | 27 KB | affiliate |

## Folhas de estilo

| caminho | tamanho | papel |
|---|---|---|
| `_app/immutable/assets/0.NDTWPgt7.css` | 167 KB | chat, osint, markdown |
| `_app/immutable/assets/3.CCEN65Uu.css` | 144 KB | chat, protocol, login, osint, image, artifacts, markdown, files |
| `_app/immutable/assets/11.4t6v2-2C.css` | 71 KB | payments |
| `_app/immutable/assets/12.DlTK74Ho.css` | 33 KB | estilos globais |
| `_app/immutable/assets/9.CP4tocFr.css` | 20 KB | payments |
| `_app/immutable/assets/21.CGE5ph6O.css` | 19 KB | estilos globais |
| `_app/immutable/assets/16.Q15GPhBf.css` | 16 KB | estilos globais |
| `_app/immutable/assets/6.H17nOn57.css` | 16 KB | estilos globais |

## Componentes de interface e onde vivem

| componente | classes / hashes | CSS | markup capturado |
|---|---|---|---|
| card de pensamento | `svelte-wgb08k` | `_app/immutable/assets/3.CCEN65Uu.css` | `docs/componentes.html` |
| bloco de busca | `grok-search-block`, `grok-results-panel`, `grok-result-link` | `assets/3.CCEN65Uu.css` | `docs/componentes.html` |
| pílulas de citação | `citation-row`, `citation-group`, `citation-pill` | `assets/0.NDTWPgt7.css` | `docs/componentes.html` |
| gaveta de fontes | `sources-panel-black`, `sources-drawer-scroll`, `svelte-1qhowmm` | `assets/3.CCEN65Uu.css` | `docs/componentes.html` |
| lista de mensagens / composer | `chat-list`, `svelte-76r9u1` | `assets/0.NDTWPgt7.css` | `docs/componentes.html` |
| chip de artefato HTML | inline Tailwind | utilitários | `docs/componentes.html` |

No clone, `assets/js/protocol.js` reimplementa esses componentes em DOM puro com as mesmas
classes, e `EXTRACAO.md` documenta o protocolo de eventos e os payloads.

> Material de referência. O backend (busca, modelo, cota de mensagens) não está incluído.
