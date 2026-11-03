# Extração completa do chat da SKYNETchat

Tudo aqui foi obtido **na conta real** (`skynetchat.net`, login por código de 12 dígitos), olhando o
DOM renderizado e o tráfego HTTP/SSE do app. É a referência que o clone segue.

Ambiente capturado: 03/11/2026 · versão da interface **SKYNETchat 4.5** · conta free (3 mensagens/dia)
· tema BLACK · app SvelteKit (`/_app/immutable/*`).

Arquivos de evidência nesta pasta:

| arquivo | conteúdo |
|---|---|
| `docs/protocolo-sse-amostra.txt` | stream real de `/api/chat-V4.5` com o bloco de busca e as fontes |
| `docs/protocolo-sse-artefato.txt` | stream real de um pedido de página HTML (artefato) |
| `docs/componentes.html` | markup real dos componentes (card de pensamento, busca, ação, gaveta, artefato) |
| `docs/paginas.md` | as 22 páginas do bundle, as 19 rotas declaradas e o que cada módulo consome |
| `docs/componentes-catalogo.md` | 57 escopos `svelte-*`, 1.341 classes CSS e os rótulos pt-BR por módulo |
| `docs/cliente-api.md` | 65 endpoints `/api/*` que o front-end chama, com métodos e módulos |
| `docs/design-tokens.md` | cores, raios e tipografia usados no CSS |
| `frontend/` | os 158 arquivos do front-end (79 JS, 20 CSS, 59 fontes) em caminhos originais |

### Mapa do front-end

```
frontend/_app/immutable/
  entry/   start + app (dicionário de rotas: 19 rotas)
  nodes/   22 módulos de página  (0-3 layouts, 4 home, 9 checkout, 16 políticos/OSINT,
                                 19 termos, 20 chat V3, 21 Modo Voz com orb 3D)
  chunks/  55 módulos compartilhados — o chat inteiro vive em Bg042Fap.js (1,5 MB)
  assets/  20 CSS + 59 fontes KaTeX
```

O componente de chat não está em nenhuma página: `chunks/Bg042Fap.js` é importado por todas as
rotas de conversa e concentra composer, lista de mensagens (`svelte-76r9u1`), card de pensamento e
bloco de busca (`svelte-wgb08k`) e a gaveta de fontes (`svelte-1qhowmm`).

---

## 1. Sessão e conta

Login: código de 12 dígitos (`2997-5456-3392`), input `type=tel` com máscara `0000-0000-0000`,
protegido por Cloudflare Turnstile. A sessão vive em cookie httpOnly + `localStorage`
(`skynet:session-change:v1`, `skynet-theme-bg`, `skynet:analytics:visitor`).

`GET /api/session` devolve o usuário completo. Campos que controlam a interface:

```json
{
  "user": {
    "id": "…", "numberId": "299754563392",
    "messagesUsed": 0, "lifetimeMessagesUsed": 1,
    "messageQuota": { "daily": true, "date": "2026-11-03", "used": 0, "limit": 3, "remaining": 3 },
    "isPro": false, "currentPlan": "mensal", "proExpiresAt": null,
    "preferredChatVersion": "V4_5", "preferredTheme": "black",
    "preferredCodeTheme": "dark", "codeHighlightEnabled": true,
    "memoryEnabled": true, "ttsVoice": null,
    "isAdmin": false, "isBetaTester": false, "canPublish": false
  }
}
```

é daqui que sai o contador **3/5** no cabeçalho e o texto "3 mensagens restantes".

## 2. Endpoints do chat

O app escolhe o endpoint pela versão selecionada no cabeçalho
(`SKYNETchat 4.5 ▾` → `preferredChatVersion`):

| versão na UI | valor interno | endpoint |
|---|---|---|
| Rápido / 4.5 | `V4_5` | `POST /api/chat-V4.5` |
| 4.5 MAX | `V4_5_MAX` | `POST /api/chat-V4.5` |
| V4 / MAX antigo | `V4`, `V4_MAX` | `POST /api/chat-V4` |
| V3 | `V3`, `V3_THINKING` | `POST /api/chat-V3` · `/api/chat-V3-thinking` |
| V2 | `V2`, `V2_THINKING` | `POST /api/chat-V2-fast` · `/api/chat-V2-thinking` |
| V1 | `V1` | `POST /api/chat` |

Outros que o chat dispara:

| endpoint | papel |
|---|---|
| `POST /api/classify-intent` | decide a "intenção" (texto, imagem, pesquisa, financiamento…) e **emite o token de decisão** |
| `POST /api/chat-V4.5?timing=1` | telemetria de tempo (204) |
| `POST /api/analytics` | eventos `chat_message_sent`, `chat_response_completed`, `upgrade_prompt_viewed` |
| `POST /api/log/message` | conta mensagem da cota |
| `POST /api/title` | título da conversa (401 se não autenticado) |
| `POST /api/osint` | investigação de perfil (stream com tipos `found`/`sources`/`report`/`done`) |
| `/api/vision`, `/api/image-gen`, `/api/pdf-generate`, `/api/tts`, `/api/tts-eleven`, `/api/speak`, `/api/memory`, `/api/projects`, `/api/groups`, `/api/updates`, `/api/prompts`, `/api/files/upload`, `/api/export-pdf`, `/api/pix`, `/api/stripe/*`, `/api/affiliate*`, `/api/recovery/*`, `/api/security/new-code` | demais recursos do app |

### 2.1 Classificação de intenção (antes de enviar)

`POST /api/classify-intent`

```json
{
  "text": "Pesquise na web as 5 notícias de tecnologia…",
  "chatVersion": "V4_5",
  "hasGeneratedImage": false,
  "awaitingImageDescription": false,
  "previousAssistantText": "",
  "recentContext": ""
}
```

Resposta (o token é assinado e vai no corpo do chat como `unifiedDecisionToken`):

```json
{
  "intent": "text", "continuation": false,
  "outputIntent": "RESPONDER", "writingStyle": "FACTUAL", "presentationIntent": "PLAIN",
  "finance": null, "decisionToken": "eyJ2Ijox…"
}
```

Payload do token (base64url, primeira parte):

```json
{ "v": 1, "uid": "…", "textHash": "…", "expiresAt": 1793678003696,
  "decision": { "toolIntent": "TEXT", "conversationType": "NORMAL", "blocked": false,
                "size": "MEDIA", "action": "PESQUISAR", "freshness": "LIVE",
                "continuation": false, "outputIntent": "RESPONDER", "artifactIntent": "OUTRO",
                "writingStyle": "FACTUAL", "presentationIntent": "PLAIN",
                "imageRetrievalIntent": "AUTO", "imageGroupingIntent": "NONE",
                "imageUtilityIntent": "NONE", "finance": null } }
```

É o `action: "PESQUISAR"` + `freshness: "LIVE"` que liga o pipeline de busca — o cliente não manda
"pesquise": ele só repassa o token que o servidor assinou.

### 2.2 Envio da mensagem

`POST /api/chat-V4.5` · `content-type: application/json` · resposta `text/event-stream`

```json
{
  "id": "gVWahcGa0GokMuzy",
  "messages": [ { "parts": [ { "type": "text", "text": "…" } ], "id": "bhMoTLApP69ZxeHb", "role": "user" } ],
  "trigger": "submit-message",
  "historyExcludedMessageIds": [],
  "conversationId": "mw05g5y4-0ydrsc",
  "hasGeneratedImage": false,
  "unifiedDecisionToken": "eyJ2Ijox…"
}
```

Formato `{id, messages:[{parts:[{type,text}], id, role}], trigger}` — é o mesmo do **Vercel AI SDK**
(`prepareSendMessagesRequest`). Ao final o cliente manda `?timing=1` com
`{traceId, timings:{headers, delta, display, render}}`.

## 3. O stream: todos os eventos

Cada evento é uma linha `data: {json}`. Tipos observados (1.134 eventos numa resposta de pesquisa):

| tipo | quando | campos |
|---|---|---|
| `start` | abre a mensagem | `messageId`, `messageMetadata.presentationIntent` |
| `thinking-meta` | antes do raciocínio | `summaryTitle` (ex.: "Criando o site", "Recuperando e validando notícias") |
| `step-start` | abre uma etapa | `stepId`, `stepIndex`, `stepType` (`preamble` \| `search` \| `thinking`), `searchQueries[]` |
| `step-delta` | texto incremental da etapa | `stepId`, `delta` |
| `assistant-preamble` | parágrafo de abertura | `text` |
| `step-end` | fecha a etapa | `stepId`, `title`, e — na etapa `search` — `searchQueries[]` + **`discoveredSources[]`** |
| `thinking-complete` | fim do raciocínio | `totalSteps` |
| `text-start` / `text-end` | envelope da resposta | `id`, `providerMetadata.skynet.replaceable` |
| `text-delta` | resposta em streaming | `delta` (token a token) |
| `follow-ups` | sugestões de continuação | `questions[]` |
| `roleplay-state` | modo roleplay | `isRoleplay` |
| `finish` | encerra | — |

Ordem real de uma pesquisa:

```
start → thinking-meta → step-start(preamble) → step-delta → step-end("Próximo passo")
      → step-start(search, searchQueries×3) → step-start(thinking) → step-end("Análise")
      → step-end("Pesquisa web", searchQueries, discoveredSources[20]) → thinking-complete(3)
      → text-start → text-delta ×1117 → text-end → follow-ups → roleplay-state → finish
```

Detalhe importante: a etapa `search` recebe `step-end` **duas vezes** — a primeira com as queries
durante a busca (o app usa isso para animar), a segunda quando os resultados chegam, agora com
`discoveredSources`. Só a segunda tem as fontes.

### 3.1 Como as fontes chegam

```json
{ "type": "step-end", "stepId": "SJ4aHapiax2cKgfW", "title": "Pesquisa web",
  "searchQueries": ["notícias tecnologia mais importantes semana atual 2026", "…", "…"],
  "discoveredSources": [
    { "title": "Anthropic prevê quase US$ 900 bilhões em gastos com IA…",
      "url": "https://oglobo.globo.com/economia/tecnologia/noticia/2026/11/02/…ghtml",
      "domain": "oglobo.globo.com" },
    { "title": "Elon Musk limita uso do Grok Bot…", "url": "https://epocanegocios.globo.com/…", "domain": "epocanegocios.globo.com" }
  ] }
```

Três campos por fonte: `title`, `url`, `domain`. Não há favicon no payload — o cliente monta o ícone
com o Google:

```
https://www.google.com/s2/favicons?sz=128&domain=<domain>     (busca, gaveta)
https://www.google.com/s2/favicons?sz=64&domain=<domain>      (pílula de citação)
```

**O cliente nunca busca na web.** Ele só desenha: (1) as queries como linhas do bloco de busca,
(2) os resultados como lista com favicon + domínio, (3) o rótulo "Pesquisou em N fontes", (4) a
gaveta com a lista completa. Toda a coleta acontece no servidor.

### 3.2 Citações dentro do texto

O `text-delta` entrega markdown e o servidor injeta o HTML das citações no próprio texto:

```html
<span class="citation-row">
  <span class="citation-group" data-sources="[%7B%22url%22…]" data-index="0">
    <a class="citation-pill" href="https://oglobo.globo.com/…" target="_blank" rel="noopener noreferrer"
       title="Anthropic prevê quase US$ 900 bilhões… · oglobo.globo.com">
      <span class="citation-pill-icon"><img src="https://www.google.com/s2/favicons?sz=64&domain=oglobo.globo.com" width="14" height="14"></span>oglobo.globo
    </a>
  </span>
</span>
```

`data-sources` traz `title/url/domain/label/description` em JSON (`encodeURIComponent`) — é o hover
card da pílula. `label` é o domínio sem sufixo ("oglobo.globo").

## 4. Interface: cada peça e seu markup

Classes com hash (`svelte-wgb08k`, `svelte-1qhowmm`) fazem parte do bundle — os CSS originais estão
em `assets/css/`. Markup completo em `docs/componentes.html`.

### Card "Trabalhou por Ns"

```html
<div class="w-full mb-3 pl-2 pr-4 sm:pr-8 svelte-wgb08k">
  <button aria-expanded="true" class="group flex items-center gap-2 pt-0 pb-1 text-[16px] …">
    <span class="text-white/80">Trabalhou por 5s</span>  <!-- durante: "Pensando" → "Trabalhando por Ns" -->
    <span class="inline-flex … rotate-0"><svg…></span>
  </button>
  <div class="svelte-wgb08k">
    <div class="pr-2 pb-3"><p class="text-[15px] sm:text-base text-[#ffffff] whitespace-pre-wrap …">Vou consultar fontes…</p></div>
    <button aria-expanded="false" class="group flex items-center gap-2.5 pb-2 …">
      <span class="site-icon-window inline-flex h-5 w-5 items-center justify-center rounded-full border …">
        <span class="site-icon-list">
          <span class="site-icon-frame site-icon-active"><img class="h-5 w-5 rounded-full" src="…sz=128&domain=oglobo.globo.com"></span>
          <span class="site-icon-frame"><img … src="…domain=epocanegocios.globo.com"></span>
        </span>
      </span>
      <span class="text-white/60 relative overflow-hidden">Pesquisou em 20 fontes</span>
    </button>
  </div>
</div>
```

Rótulos exatos do original:

* durante a geração: `Pensando` (&lt;4s) depois `Trabalhando por {n}s`
* ao terminar: `Trabalhou por {n}s`, ou `Trabalho concluído` quando não há tempo medido
* a pilha de favicons gira entre os domínios (`site-icon-active`); o título ganha o efeito
  *shimmer* via `--title-shimmer-sheen`

### Bloco de busca ("grok-search-block")

```html
<div class="mt-1.5 max-w-[620px] svelte-wgb08k">
  <div class="grok-search-block relative pb-3.5 svelte-wgb08k">
    <div class="flex min-w-0 items-start gap-2.5 pb-2.5 text-white/60 svelte-wgb08k">
      <div class="ml-auto flex shrink-0 items-center gap-2 pl-2">
        <span class="text-xs whitespace-nowrap">20 resultados</span>
        <span class="flex items-center pl-1"><img … style="margin-left:0;z-index:3"> … </span>
      </div>
    </div>
    <div class="grok-results-panel ml-6 max-h-[300px] overflow-y-auto rounded-2xl border bg-white/5 border-white/10">
      <a href="https://oglobo.globo.com/…" class="grok-result-link block px-4 py-3 transition-colors hover:bg-white/[0.035]">
        <span class="block text-sm font-semibold leading-5 text-white/80">Anthropic prevê quase US$ 900 bilhões…</span>
        <span class="mt-1.5 flex items-center gap-2 text-xs text-white/60">
          <img class="h-4 w-4 rounded-full" src="…domain=oglobo.globo.com"><span>oglobo.globo.com</span>
        </span>
      </a>
    </div>
  </div>
</div>
```

### Barra de ações da resposta

`Compartilhar` · `Ouvir` · `Copiar` · `Reescrever` (esquerda) — `Ver N fontes` (4 favicons + "N
fontes", abre a gaveta) — `Útil` · `Não útil` · `Mais ações` (direita). Botões `h-8`, ícones 14–16px,
`text-white/40 hover:text-white/80`.

### Gaveta de fontes (`.sources-panel-*`)

Mobile: bottom sheet (`bottom-0 … max-h-[75vh] rounded-t-2xl`) com alça; desktop: painel à direita
(`sm:w-[60vw] sm:max-w-[420px]`). Tema `sources-panel-black|white|red` conforme o fundo. Cada item:
favicon 16px com anel, domínio em `text-white/40 text-xs` e título em `text-white text-sm font-medium
line-clamp-2`. Rolagem em `.sources-drawer-scroll`.

### Chip de artefato (página gerada)

```html
<div class="my-1 flex items-center gap-3 rounded-xl px-3 py-3 w-full" style="background:#212121;border:1px solid rgba(255,255,255,.1)">
  <button data-artifact-open><div …>&lt;/&gt;</div>
    <div><span class="font-semibold text-[15px]">Click Master | Contador Interativo</span>
         <span class="text-xs" style="color:#8c8c8c">Código · HTML</span></div></button>
  <button>Baixar</button>
</div>
```

O artefato **não é um evento**: vem como bloco de código ```` ```html ```` dentro do `text-delta`.
O renderer transforma cercas `html` grandes em chip; "Baixar" salva o `.html`; clicar no chip
renderiza a página. O `thinking-meta` desse tipo de resposta é literalmente `"Criando o site"` e o
`step-end` vem como `"Instruções prontas"`.

### Composer

Placeholder "Pergunte o que quiser…", chips de atalho (`Pesquisar na web`, `Gerar Imagens`,
`Persuasão`, `Programar` — o chip de pesquisa **prefixa** o texto com `"Busque informações sobre "`),
botão `+` (anexos), microfone, botão vermelho de voz. Contador `n/5` e link
`Assinar SKYNETchat PRO →` acima da barra.

## 5. O que o clone reproduz

`assets/js/protocol.js` implementa o contrato acima sem backend:

* `parseSSE()` / `readStream()` — mesmo parser de eventos.
* `trace()` — card de pensamento fiel: `Pensando` → `Trabalhando por Ns` → `Trabalhou por Ns`,
  pilha de favicons animada, "Pesquisou em N fontes", bloco de busca com "N resultados".
* `md()` — markdown com citações `[n]` virando `.citation-row > .citation-pill` e cercas `html`
  virando chip de artefato com "Baixar".
* `openSources()` — a gaveta de fontes (bottom sheet no mobile, painel à direita no desktop).
* `demoStream()` — emite **a mesma sequência de eventos** do servidor, com fontes reais
  (API pública da Wikipédia, liberada por CORS, + busca nos domínios de notícia).
* `apiStream()` — modo real: aponta para `skynetchat.net` ou para o seu backend e consome o SSE
  original (`Configurar IA` → endpoint, versão, chave).

Limite de escopo: o clone não hospeda o pipeline de busca nem o modelo. Sem endpoint próprio ele
roda o motor demo com as mesmas etapas, rótulos e componentes.
