# Cliente HTTP do front-end (endpoints chamados pelo app)

Todos os caminhos `/api/...` encontrados nos bundles, com os métodos HTTP que aparecem perto da
chamada e os módulos que os usam. É a superfície exata que o front-end consome — útil para saber o
que um clone precisa reimplementar ou apontar para outro backend.

| endpoint | métodos | usado em |
|---|---|---|
| `/api/preferences` | PATCH | Bg042Fap.js, TVrrPJSL.js, 21.CPV7o000.js |
| `/api/title` | POST | BBQdSXMV.js, TVrrPJSL.js |
| `/api/session` | POST, DELETE | Bg042Fap.js, app.dLm3Cmjx.js |
| `/api/files/upload` | DELETE, POST | Bg042Fap.js, TVrrPJSL.js |
| `/api/recovery/request` | POST | Bg042Fap.js, 17.CkmTcz28.js |
| `/api/chat-V3` | POST | Bg042Fap.js, 20.DV6nrX6N.js |
| `/api/files/` | — | Bg042Fap.js, TVrrPJSL.js |
| `/api/chat-sync/reconcile` | POST | BBQdSXMV.js |
| `/api/conversations` | POST | BBQdSXMV.js |
| `/api/projects` | POST | BKM70PP7.js |
| `/api/chat` | — | Bg042Fap.js |
| `/api/admin/accounts` | POST, PATCH | Bg042Fap.js |
| `/api/admin/influencer` | POST | Bg042Fap.js |
| `/api/file-extract` | POST | Bg042Fap.js |
| `/api/vision` | POST | Bg042Fap.js |
| `/api/image-gen` | POST | Bg042Fap.js |
| `/api/currency-verify` | POST | Bg042Fap.js |
| `/api/osint` | POST | Bg042Fap.js |
| `/api/integrations` | — | Bg042Fap.js |
| `/api/integrations/gmail/permissions` | DELETE | Bg042Fap.js |
| `/api/image-followups` | POST | Bg042Fap.js |
| `/api/updates` | POST | Bg042Fap.js |
| `/api/prompts` | POST | Bg042Fap.js |
| `/api/groups` | POST | Bg042Fap.js |
| `/api/support/session` | POST | Bg042Fap.js |
| `/api/support` | POST | Bg042Fap.js |
| `/api/pdf-generate` | POST | Bg042Fap.js |
| `/api/export-pdf` | POST | Bg042Fap.js |
| `/api/stripe/portal` | POST | Bg042Fap.js |
| `/api/memory` | PATCH, POST, DELETE | Bg042Fap.js |
| `/api/security/new-code` | POST | Bg042Fap.js |
| `/api/memory/toggle` | PATCH | Bg042Fap.js |
| `/api/code-repair` | POST | Bg042Fap.js |
| `/api/chat-V2-fast` | — | Bg042Fap.js |
| `/api/chat-V2-thinking` | — | Bg042Fap.js |
| `/api/chat-V3-thinking` | — | Bg042Fap.js |
| `/api/chat-V4` | — | Bg042Fap.js |
| `/api/chat-V4.5` | — | Bg042Fap.js |
| `/api/log/message` | POST | Bg042Fap.js |
| `/api/chat-search` | — | Bg042Fap.js |
| `/api/speak` | POST | Bg042Fap.js |
| `/api/classify-intent` | POST | Bg042Fap.js |
| `/api/feedback` | POST | Bg042Fap.js |
| `/api/initial-feedback` | POST | Bg042Fap.js |
| `/api/recovery/email` | POST, PATCH | Bg042Fap.js |
| `/api/log` | POST | Bg042Fap.js |
| `/api/analytics` | POST | DxPtZW4U.js |
| `/api/conversations/migrate` | POST | TVrrPJSL.js |
| `/api/conversations/config` | — | TVrrPJSL.js |
| `/api/admin/metrics-refresh` | POST | 11.cObUPbaW.js |
| `/api/admin/pix-summary` | — | 11.cObUPbaW.js |
| `/api/admin/pix-metrics-details` | — | 11.cObUPbaW.js |
| `/api/admin/subaccounts` | — | 11.cObUPbaW.js |
| `/api/admin/feedback` | — | 11.cObUPbaW.js |
| `/api/admin/support` | — | 11.cObUPbaW.js |
| `/api/monetize-interest` | POST | 14.ByG2qvFy.js |
| `/api/access-code` | POST | 18.Br19WmPd.js |
| `/api/tts` | POST | 20.DV6nrX6N.js |
| `/api/tts-eleven` | POST | 21.CPV7o000.js |
| `/api/chat-V3-interacao` | POST | 21.CPV7o000.js |
| `/api/affiliate/withdraw` | POST | 5.doPDDGKt.js |
| `/api/affiliate` | POST | 6.BCB7ZHm8.js |
| `/api/checkout-recover` | POST | 9.BvJk6gU-.js |
| `/api/pix` | POST | 9.BvJk6gU-.js |
| `/api/stripe/checkout` | POST | 9.BvJk6gU-.js |

> Nenhuma credencial, cookie ou token é copiado: só os caminhos públicos que o JavaScript do
> navegador já chama.
