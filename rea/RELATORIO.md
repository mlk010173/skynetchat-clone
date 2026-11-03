# Análise do skynetchat.net com o framework REA

Todas as evidências desta pasta foram produzidas pelo **REA 6.8.0** (`rea-agents`, MIT,
[github.com/morluto/rea](https://github.com/morluto/rea)) rodando no sandbox, contra o site no ar
em 03/11/2026. Cada arquivo `.evidence.json` é um registro canônico com digests SHA-256,
limitações declaradas e a operação que o gerou.

## 1. Resumo

| pergunta | resposta |
|---|---|
| scripts carregados pela página | **54** analisados, 0 falha de parse |
| nós de AST visitados | **486.167** |
| endpoints `/api` com posição exata no código | **42** |
| endpoints únicos no grafo de aplicação | **90** |
| arquivos JS exportados do navegador | **46** com manifesto e sha256 |
| grafo de módulos | **712** nós e **2088** arestas |
| chaves de armazenamento observadas | **14** |
| source maps publicados pelo site | **0** (nenhum bundle declara `sourceMappingURL`) |
| captura de estado logado | **bloqueada** por Cloudflare Turnstile (ver seção 8) |

## 2. O que o REA entrega neste projeto

- `analyze-web-bundle`: anexa ao Chrome via CDP, coleta os scripts da página e reconstrói rotas,
  endpoints e o grafo de chunks com localização exata (arquivo, linha, coluna).
- `inspect-web-page`: inspeção passiva de DOM, árvore de acessibilidade, rede, console,
  workers, chaves de storage e o texto dos scripts.
- `export-web-scripts`: transforma a captura em um diretório de scripts com manifesto verificado.
- `analyze-javascript-application`: grafo estático da aplicação (módulos, exports, chamadas,
  persistência) sobre os scripts exportados.
- `capture-web-screenshot`, `discover-webmcp-tools`, `list-browser-targets`: utilitários de apoio.

O REA é deliberadamente estático e passivo: ele **não executa** o JavaScript capturado, não
submete formulários e não tenta resolver desafios anti-bot.

## 3. Ambiente

```
Chrome 154.0.8037.57 (headful sob Xvfb :99)  ->  CDP 127.0.0.1:9225
rea-agents 6.8.0 (npm global)
```
Headless puro é barrado: o Cloudflare serve a página "Just a moment..." e o alvo nunca carrega.
Com Chrome headful em Xvfb o desafio passa normalmente e a página real é servida.

## 4. Pipeline executado

```bash
rea list-browser-targets http://127.0.0.1:9225
rea analyze-web-bundle http://127.0.0.1:9225 <targetId> \
    --fetch-source-maps --observation-ms 4000 \
    --detail summary --evidence_output evidencias/web-bundle.evidence.json \
    --view '{"kind":"javascript-routes","collection":"routes","limit":200}'
rea inspect-web-page http://127.0.0.1:9225 <targetId> --include-script-sources \
    --include-storage-keys --include-console-text --include-json-body-shapes \
    --include-websocket-shapes --observation-ms 4000 > evidencias/inspect-page.evidence.json
rea export-web-scripts .../inspect-page.evidence.json .../exported-scripts
rea analyze-javascript-application .../exported-scripts/files
rea capture-web-screenshot http://127.0.0.1:9225 <targetId>
rea discover-webmcp-tools http://127.0.0.1:9225 <targetId>
```

## 5. Bundle da página

- status: `partial` — 54 scripts parseados de 54 observados.
- arestas de chunk coletadas: **186**; inferências: **21**.
- source maps: `not_requested` — nenhum bundle publica `.map`,
  portanto não existe código-fonte original para recuperar aqui. O que existe são os bundles
  minificados já preservados em [`../frontend/`](../frontend/).

## 6. Endpoints com posição no código

Todos detectados por chamada (`fetch`) e verificados contra o script que os contém.

| endpoint | detecção | script | linha |
|---|---|---|---|
| `/api/projects` | `call:fetch` | `/_app/immutable/chunks/BKM70PP7.js` | 356 |
| `/api/projects?sort=name` | `call:fetch` | `/_app/immutable/chunks/BKM70PP7.js` | 356 |
| `/api/files/upload` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 1 |
| `/api/admin/accounts` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 34 |
| `/api/admin/influencer` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 34 |
| `/api/file-extract` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 34 |
| `/api/vision` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 35 |
| `/api/image-gen` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 41 |
| `/api/currency-verify` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 43 |
| `/api/osint` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 44 |
| `/api/integrations` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 69 |
| `/api/integrations/gmail/permissions` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 69 |
| `/api/image-followups` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 72 |
| `/api/updates` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 73 |
| `/api/prompts` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 73 |
| `/api/groups` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 74 |
| `/api/support/session` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 74 |
| `/api/support` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 76 |
| `/api/recovery/request` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 78 |
| `/api/session` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 468 |
| `/api/export-pdf` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 492 |
| `/api/stripe/portal` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 526 |
| `/api/preferences` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 526 |
| `/api/memory` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 526 |
| `/api/security/new-code` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 526 |
| `/api/memory?countOnly=true` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 526 |
| `/api/memory/toggle` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 526 |
| `/api/code-repair` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 529 |
| `/api/log/message` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 608 |
| `/api/chat-V4.5?timing=1` | `call:globalThis.fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 608 |
| `/api/speak` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 619 |
| `/api/classify-intent` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 619 |
| `/api/feedback` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 623 |
| `/api/initial-feedback` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 623 |
| `/api/recovery/email` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 705 |
| `/api/log` | `call:fetch` | `/_app/immutable/chunks/Bg042Fap.js` | 705 |
| `/api/analytics` | `call:fetch` | `/_app/immutable/chunks/DxPtZW4U.js` | 1 |
| `/api/files/upload` | `call:fetch` | `/_app/immutable/chunks/TVrrPJSL.js` | 2 |
| `/api/preferences` | `call:fetch` | `/_app/immutable/chunks/TVrrPJSL.js` | 2 |
| `/api/title` | `call:fetch` | `/_app/immutable/chunks/TVrrPJSL.js` | 4 |
| `/api/conversations/migrate` | `call:fetch` | `/_app/immutable/chunks/TVrrPJSL.js` | 4 |
| `/api/conversations/config` | `call:fetch` | `/_app/immutable/chunks/TVrrPJSL.js` | 4 |

A lista completa do grafo de aplicação (90 endpoints, incluindo candidatos a cabeçalho HTTP
como `X-SKYNET-User-Message`) está em [`evidencias/resumo-grafo.json`](evidencias/resumo-grafo.json).

### Núcleo do chat

| endpoint | papel |
|---|---|
| `/api/chat-V4.5?timing=1` | stream principal do chat (SSE), com timing |
| `/api/classify-intent` | classificação de intenção antes do stream |
| `/api/session` | sessão/identidade do visitante |
| `/api/memory`, `/api/memory/toggle` | memória do usuário |
| `/api/log/message`, `/api/title` | log e título da conversa |
| `/api/speak`, `/api/vision`, `/api/image-gen` | voz, visão e geração de imagem |
| `/api/files/upload`, `/api/file-extract`, `/api/export-pdf` | anexos e exportação |
| `/api/stripe/portal`, `/api/preferences` | assinatura e preferências |

## 7. Grafo de aplicação

- 46 arquivos JS, 49 parseados, 0 falhas.
- 471.535 nós de AST; 1987 achados.
- relações: `imports` 1462, `contains` 98, `exposes` 301, `calls` 142, `persists_to` 85.
- grafo semântico completo: 92.519 nós e 96.196 relações (arquivo bruto de 215 MB não versionado).
- Electron/IPC: zero nós — o alvo é web puro, não um app Electron.

Armazenamento observado: `call:indexedDB.open`, `call:localStorage.getItem`, `call:localStorage.removeItem`, `call:localStorage.setItem`, `call:sessionStorage.getItem`, `call:sessionStorage.removeItem`, `call:sessionStorage.setItem`, `installPromptCount`, `pendingProjectMessage`, `selectedVoiceId`, `skynet-message-backups`, `skynet:chat-tab:last`, `skynet:image-data:v1`, `skynet:v2-badge-seen`.

## 8. O que não foi possível capturar

O estado logado. O formulário `/login` aceita o código de 12 dígitos e exibe "Pronto para entrar",
mas o botão `ENTRAR` permanece desabilitado porque o widget **Cloudflare Turnstile** não é
renderizado em navegador automatizado (nenhum `iframe` de challenge é montado, token fica vazio).
Contornar isso seria burlar proteção anti-bot, o que está fora do escopo deste trabalho — inclusive
segundo o próprio `DISCLAIMER.md` do REA.

Consequência prática: os eventos SSE reais do chat em modo logado não foram recolhidos nesta rodada;
o protocolo em [`../assets/js/protocol.js`](../assets/js/protocol.js) continua baseado na captura
de streaming feita anteriormente.

Para destravar, o caminho limpo é: abrir o site em um navegador real já autenticado, apontá-lo para
CDP (`--remote-debugging-port`) e rodar `rea capture-browser-scenario` em modo `connect`, com
`actions` de digitar/comparar e `capture.events` de `network`. O REA aceita endpoint CDP de loopback.

## 9. Reprodutibilidade

Digests dos artefatos principais estão dentro de cada `.evidence.json` (`evidence_id`, `sha256`).
O manifesto dos scripts exportados fica em [`scripts/manifest.json`](scripts/manifest.json), com
URL de origem, `relative_path` e sha256 de cada arquivo em [`scripts/exportados/`](scripts/exportados/).

Aviso de integridade: os bundles são a versão servida em 03/11/2026. Se o site publicar um build
novo, os hashes mudam e a comparação precisa ser refeita (`rea compare-web-captures`).
