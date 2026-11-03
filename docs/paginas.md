# Páginas e rotas do app (extraídas do bundle)

O SvelteKit mantém o dicionário de rotas dentro de `_app/immutable/entry/app.<hash>.js`
(`const dictionary = {…}`) e um módulo por página em `_app/immutable/nodes/N.<hash>.js`.
Esta é a correspondência encontrada, com o que cada módulo consome.

| node | tamanho | página | texto no módulo (evidência) | APIs chamadas | escopos svelte |
|---|---|---|---|---|---|
| `0.cuCADYzh.js` | 1 KB | layout raiz (head, tema, view-transition) | — | — | 0 |
| `1.Co8wVrtq.js` | 1 KB | layout de erro / fallback | — | — | 0 |
| `2.Bn-QDHZD.js` | 0 KB | boundary (error/suspense) | — | — | 0 |
| `3.DXB5olUD.js` | 0 KB | layout autenticado (shell do app logado) | — | — | 0 |
| `4.BmNG0zpt.js` | 12 KB | landing / home pública ("Geração de Imagens", "Memória IA", redes sociais) | — | — | 1 |
| `5.doPDDGKt.js` | 33 KB | painel de afiliado (saldo, comissões Pix/cartão, histórico de saques) | “Erro ao processar saque”<br>“Erro de rede”<br>“Comissão: 20% de cada venda via Pix” | `/api/affiliate/withdraw` | 0 |
| `6.BCB7ZHm8.js` | 27 KB | indique e ganhe (cartão de indicação, código, preço) | “Configurar conta”<br>“Erro ao carregar dados”<br>“Erro de conexao” | `/api/affiliate` | 1 |
| `7.DPzO339H.js` | 0 KB | endpoint /api/session (server) | — | — | 0 |
| `8.Dnfc0of3.js` | 1 KB | endpoint auxiliar (server) | — | — | 0 |
| `9.BvJk6gU-.js` | 68 KB | checkout (Pix, Stripe, PayPal, recuperação de checkout) | “Pix Copia e Cola”<br>“QR Code PIX”<br>“SKYNETchat PRO” | `/api/checkout-recover`<br>`/api/pix`<br>`/api/stripe/checkout` | 1 |
| `10.Di0Oo1Tl.js` | 7 KB | retorno do checkout / confirmação | “Security Test - Dev” | — | 1 |
| `11.cObUPbaW.js` | 178 KB | dev-panel (métricas, acessos, subcontas, suporte, feedback) | “Carregando dados”<br>“Fechar detalhes do PIX”<br>“Limpar histórico de erros” | `/api/admin/metrics-refresh`<br>`/api/admin/pix-summary`<br>`/api/admin/pix-metrics-details`<br>`/api/admin/subaccounts`<br>`/api/admin/feedback`<br>`/api/admin/support` | 2 |
| `12.DDL_8dq_.js` | 26 KB | resumo de indicações (metas 10/50, plano PRO anual) | “Arte da recompensa GTA VI”<br>“Fechar detalhes da recompensa”<br>“Ver detalhes da recompensa de 30 dias PRO” | — | 1 |
| `13.XVHxqi3c.js` | 10 KB | sobre / institucional | — | — | 1 |
| `14.ByG2qvFy.js` | 9 KB | monetize (cadastro de interesse no programa) | “Carregando contagem regressiva”<br>“Navegação da página”<br>“Não foi possível cadastrar seu e-mail.” | `/api/monetize-interest` | 1 |
| `15.D9iY-M3i.js` | 0 KB | endpoint auxiliar (server) | — | — | 0 |
| `16.DrcJp8ja.js` | 31 KB | políticos / OSINT (dossiê, análise SKYNET, evolução patrimonial) | “Tarcísio de Freitas”<br>“Governador SP”<br>“Nikolas Ferreira” | — | 1 |
| `17.CkmTcz28.js` | 8 KB | recuperação de acesso (código por e-mail) | “Email inválido”<br>“Aguarde a verificação de segurança” | `/api/recovery/request` | 1 |
| `18.Br19WmPd.js` | 11 KB | cadastro / gerar código de acesso | “Falha ao copiar” | `/api/access-code` | 1 |
| `19.QC4NniiZ.js` | 28 KB | — | — | — | 1 |
| `20.DV6nrX6N.js` | 85 KB | chat V3 (composer, grupos, atualizações, TTS) | “Brainstorm com IA”<br>“Estudo em grupo”<br>“Projetos colaborativos” | `/api/tts`<br>`/api/chat-V3` | 4 |
| `21.CPV7o000.js` | 519 KB | Modo Voz: orb 3D (three.js), microfone, vozes e sessão de fala | “Invalid component type.”<br>“THREE.Texture: Unable to serialize Texture.”<br>“THREE.Color: Alpha component of” | `/api/tts-eleven`<br>`/api/chat-V3-interacao`<br>`/api/preferences` | 1 |

## Rotas declaradas no bundle (19)

```
/
/about
/affiliate-panel
/afiliado
/api/session
/chat/[conversationId]
/checkout
/dev-panel
/dev/security
/indique-ganhe
/login
/monetize
/novo
/politicos
/recovery
/sign-up
/termos
/v3
/voz
```

O dicionário usa um índice combinado (layouts + páginas + módulos de servidor) que não é o mesmo
índice dos arquivos em `nodes/`, então a associação rota → arquivo abaixo não é feita por esse
número: a coluna "página" vem do conteúdo de cada módulo (textos e chamadas de API).

## Observações

- `nodes/21` (modo voz) e `nodes/20` (chat V3) **não contêm** o chat principal: o componente de
  chat vive em `chunks/Bg042Fap.js` (1,5 MB), compartilhado por todas as rotas de conversa.
- O composer, a lista de mensagens e o card de pensamento estão nesse chunk com o escopo
  `svelte-76r9u1`; o bloco de busca e a gaveta usam `svelte-wgb08k` e `svelte-1qhowmm`.
- Rotas de API aparecem como módulos (`nodes/7`, `nodes/8`, `nodes/15`) porque a SvelteKit gera
  arquivos `+server.js` no mesmo grafo.
