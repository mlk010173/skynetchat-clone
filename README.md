# SKYNETchat — clone estático

Clone funcional da interface da SKYNETchat (tema preto/vermelho), com chat de IA e
**streaming em tempo real**, rodando 100% em site estático (GitHub Pages).

## O que está incluído

- **App/chat** (`index.html`): shell completo, sidebar/drawer, hero com sugestões,
  composer com placeholder animado, bolhas de mensagem, ações (copiar, ouvir, reescrever,
  feedback), partículas de fundo e histórico local de conversas.
- **Login** (`login.html`): tela de autenticação com código de ativação de 12 dígitos.
- **Conheça** (`sobre.html`), **Termos** (`termos.html`), **Monetize** (`monetizar.html`),
  **Indique e Ganhe** (`indicar.html`).
- **Painéis no menu**: Atualizações, Imagens, Projetos, Histórico, Prompts, Suporte,
  Conversas em grupo, Tema de fundo e **Configurar IA**.

## Streaming

Dois motores, alternáveis em *Configurar IA* (menu lateral ou título "SKYNETchat 4.5"):

1. **Demo** (padrão) — respostas geradas no navegador, token a token, com markdown,
   blocos de código e caret piscando. Não precisa de chave.
2. **API** — streaming real via `fetch` + `ReadableStream`. Compatível com:
   - OpenAI Chat Completions (`/v1/chat/completions`, SSE `data: {...}`)
   - Vercel AI SDK Data Stream (`0:"texto"`)
   - Anthropic (`/v1/messages`, SSE)
   - Groq, OpenRouter, Together e qualquer proxy compatível com OpenAI.

A chave é salva apenas no `localStorage` do navegador. Em produção, use um proxy
para não expor a chave (qualquer endpoint compatível funciona).

## Rodar localmente

```bash
python3 -m http.server 8080
# abra http://localhost:8080
```

Entre com qualquer código de 12 dígitos para liberar o chat.
