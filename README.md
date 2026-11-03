# SKYNETchat — clone avançado (GitHub Pages)

Clone funcional da interface da **SKYNETchat** (tema preto/vermelho) com chat de IA,
**streaming em tempo real**, **log de pensamento** em texto, **anexos reais** e painel
de perfil com foto. Roda 100% em site estático, sem backend.

**Demo:** https://mlk010173.github.io/skynetchat-clone/

## Mapa do repositório

```
index.html                   App + chat (drawer, hero, composer, painéis)
login.html                   Acesso por código de 12 dígitos + criar conta / recuperar
sobre.html                   "Conheça o SKYNETchat"
termos.html                  Termos de Uso e Política de Privacidade
monetizar.html               Monetize com o SKYNETchat
indicar.html                 Indique e Ganhe
assets/css/skynet.css        CSS original do app
assets/css/skynet-extra.css  CSS de componentes secundários
assets/css/KaTeX_*.woff2     Fontes matemáticas do bundle original (59 arquivos)
assets/css/clone.css         Camada do clone: pensamento, painéis, anexos, perfil
assets/js/app.js             Motor: chat, streaming, anexos, perfil, painéis, voz
assets/img/*                 Logo, favicons, ícones PWA
```

## Lógica do motor (`assets/js/app.js`)

| Bloco | Responsabilidade |
|---|---|
| `store` / `load` / `save` | Estado em `localStorage` (`skynetchat.clone.v1`): conversas, tema, PRO, perfil, motor |
| `mdBlocks` / `inline` | Renderizador markdown (títulos, listas, código, links, citações) |
| `demoReply` | Motor local por intenção (saudação, código, imagem, pesquisa, genérica) |
| `apiStream` | Streaming real via `fetch` + `ReadableStream`: SSE OpenAI, Vercel AI SDK Data Stream (`0:"..."`), Anthropic |
| `buildSteps` / `traceEl` / `traceLine` | Log de pensamento: etapas cronometradas, persistidas na mensagem |
| `sourcesBlock` | Modo Pesquisa: fontes com links reais de busca |
| `send` | Orquestra pensamento → streaming → ações → persistência |
| `readAttachments` / `resizeImage` | Anexos: leitura, miniatura de imagem, limite de 6 × 12 MB |
| `initVoice` / `speak` | Ditado por voz (Web Speech) e leitura da resposta (SpeechSynthesis) |
| `initParticles` | Partículas de fundo em canvas |
| Painéis | Atualizações, Imagens, Projetos, Histórico (busca/exportar/apagar), Prompts, Suporte, Grupos, Tema, Perfil, Configurar IA, Criar conta, Recuperar |

## Anexos, foto e conta

- **Anexos**: botão `+`, arrastar-e-soltar e colar (Ctrl+V). Imagens viram miniatura
  (360px) e aparecem como card na mensagem; outros arquivos mostram tipo e tamanho.
- **Perfil**: menu → *Perfil e foto*. Foto redimensionada para 300px aparece no cabeçalho.
- **Criar conta / recuperar acesso**: geram código de 12 dígitos; a recuperação mostra o
  código no próprio painel (ambiente de demonstração, sem envio real de e-mail).

## Modos

Rápido · MAX (4.5, raciocínio profundo) · Pesquisa (detecta "pesquise..." e adiciona fontes).

## PRO desbloqueado

`pro: true` por padrão: mensagens ilimitadas, todos os painéis, selo **PRO** no cabeçalho.
Em *Configurar IA → Conta* dá para voltar ao Free (5 mensagens) e testar o upgrade.


## Protocolo do chat (extraído do site original)

`assets/js/protocol.js` reproduz o contrato real de streaming da SKYNETchat:
eventos `start · thinking-meta · step-start · step-delta · step-end · thinking-complete ·
text-start · text-delta · text-end · follow-ups · roleplay-state · finish`.

| Peça | O que faz |
|---|---|
| `SKYN.parseSSE` / `SKYN.readStream` | lê o SSE (`data: {json}`) igual ao app original |
| `SKYN.trace` | card "Pensando → Trabalhando por Ns → Trabalhou por Ns", pilha de favicons animada, "Pesquisou em N fontes" e bloco de busca com "N resultados" |
| `SKYN.md` | markdown com citações `[n]` → `.citation-row > .citation-pill` e cercas `html` → chip de artefato com **Baixar** |
| `SKYN.openSources` | gaveta de fontes (bottom sheet no mobile, painel à direita no desktop) |
| `SKYN.demoStream` | emite a mesma sequência de eventos do servidor, com fontes reais (Wikipédia via CORS + busca nos domínios de notícia) |
| `SKYN.apiStream` | modo real: consome o SSE de `skynetchat.net` ou do seu backend |

Endpoints e payloads completos: **[EXTRACAO.md](EXTRACAO.md)** — inclui a amostra do stream real
(`docs/protocolo-sse-amostra.txt`), o stream de artefato e o markup capturado (`docs/componentes.html`).

### Modo API

Em *Configurar IA* informe `endpoint` (ex.: `https://skynetchat.net` ou seu backend), a `version`
(`V4_5`, `V4_5_MAX`, `V3`, `V3_THINKING`, `V2_FAST`, `V1`) e, se precisar, a chave. O corpo enviado é
o mesmo do original:

```json
{ "id": "…", "messages": [{ "parts": [{ "type": "text", "text": "…" }], "id": "…", "role": "user" }],
  "trigger": "submit-message", "historyExcludedMessageIds": [], "conversationId": "…", "hasGeneratedImage": false }
```

## Auditoria automatizada

Verificado em contexto anônimo (sem cookies/sessão) via DevTools, no app e no login:
drawer, 7 painéis, composer, anexos (texto + imagem), envio com streaming, log de
pensamento, persistência, tema, perfil e foto, login por código, criar conta e
recuperar acesso. Resultado final: **0 erros de console**, depois de corrigir o
`/logov2.jpeg` quebrado e baixar as 59 fontes KaTeX que faltavam.

## Rodar localmente

```bash
python3 -m http.server 8080
# http://localhost:8080
```

Entre com qualquer código de 12 dígitos.

## Notas

- Front-end puro: sem backend, banco ou chaves de terceiros embutidas.
- Chaves de servidor da versão original nunca chegam ao navegador, então não existem
  "segredos" recuperáveis no front-end — e este repositório não contém nenhum.

## Fidelidade móvel (reconstruída a partir dos prints do site)

- **Sheet do "+"**: Adicionar fotos e arquivos · Criar imagem · Pensar · Investigar · Gerar código · Traduzir texto · Ferramentas e modos.
- **Modal Ferramentas**: abas 4.5 / 4.5 MAX (PRO) / Pesquisa e as seções *Pesquisa & Inteligência* (Busca na Web, OSINT PRO, Análise de Sites, Fact-Checker, Geolocalização) e *Segurança & Hacking* (Pentest Assistant PRO, Password Tools, Forensics). Cada item injeta o template no composer; itens PRO abrem o painel de assinatura.
- **Card de fontes no chat**: "Pesquisou em N fontes" com pílulas de domínio e favicon (modo Pesquisa).
- **Conta com abas**: Conta (apelido, código `29 97 54 56 33 92`, copiar), Segurança (e-mail de recuperação, gerar novo código) e Assinatura (card "Seja PRO").
- **Limite FREE**: contador `n/5` no cabeçalho e link "Assinar SKYNETchat PRO →" acima do composer.
- **Mobile**: chip de modo acima do composer, seletor de modo fixo, alvos de toque ≥ 32px, composer com safe-area do iPhone.
- **Cache-bust** automático nos assets (`app.js?v=<hash>`), para o Pages não servir JS antigo.

## O que este repositório NÃO tem

Nenhum segredo, chave, token, credencial ou código de servidor. O front-end estático não
contém chaves da versão original (elas ficam no servidor, inacessíveis por design) e este
clone não faz nenhuma tentativa de acesso ao backend, painel ou infraestrutura do site de
origem. Para ligar uma IA real, use *Configurar IA* e informe a sua própria chave.
