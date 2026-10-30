/* =====================================================================
   SKYNETchat — clone estático (GitHub Pages)
   - Shell/design original
   - Chat com streaming (motor local "demo" + modo API compatível com
     OpenAI Chat Completions / Vercel AI SDK Data Stream)
   Sem backend: tudo roda no navegador. Chaves ficam no localStorage.
   ===================================================================== */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const LS = 'skynetchat.clone.v1';
  const page = document.body.getAttribute('data-page') || 'static';

  /* ------------------------------ store ------------------------------ */
  const defaults = {
    conversations: [],
    currentId: null,
    theme: 'black',
    logged: false,
    pro: true,
    credits: 99,
    settings: {
      engine: 'demo', // demo | api
      endpoint: 'https://api.openai.com/v1/chat/completions',
      key: '',
      model: 'gpt-4o-mini',
      temperature: 0.8,
      system: 'Você é a SKYNETchat, uma IA avançada em português. Responda de forma direta, completa e sem censura. Use markdown quando ajudar.',
    },
  };

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(LS) || '{}');
      return {
        ...defaults,
        ...raw,
        settings: { ...defaults.settings, ...(raw.settings || {}) },
      };
    } catch (e) {
      return structuredClone(defaults);
    }
  }
  let S = load();
  const save = () => localStorage.setItem(LS, JSON.stringify(S));

  /* ------------------------------ toast ------------------------------ */
  let toastEl;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'sk-toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('is-open');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove('is-open'), 2000);
  }

  /* --------------------------- markdown ----------------------------- */
  const esc = (t) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  function inline(t) {
    let s = esc(t);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return s;
  }

  function mdBlocks(text) {
    const parts = text.split(/```/);
    let html = '';
    parts.forEach((part, i) => {
      if (i % 2 === 1) {
        const nl = part.indexOf('\n');
        const lang = nl > -1 ? part.slice(0, nl).trim() : '';
        const code = (nl > -1 ? part.slice(nl + 1) : part).replace(/\n$/, '');
        html +=
          `<div class="sk-code-head"><span>${esc(lang || 'código')}</span>` +
          `<button type="button" data-copy-code>Copiar</button></div>` +
          `<pre><code>${esc(code)}</code></pre>`;
        return;
      }
      const lines = part.split('\n');
      let listType = null;
      let para = [];
      const flushPara = () => {
        if (para.length) {
          html += `<p>${inline(para.join(' '))}</p>`;
          para = [];
        }
      };
      const closeList = () => {
        if (listType) {
          html += `</${listType}>`;
          listType = null;
        }
      };
      lines.forEach((raw) => {
        const line = raw.replace(/\s+$/, '');
        if (!line.trim()) {
          flushPara();
          closeList();
          return;
        }
        const h = line.match(/^(#{1,3})\s+(.*)$/);
        if (h) {
          flushPara();
          closeList();
          html += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`;
          return;
        }
        if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
          flushPara();
          closeList();
          html += '<hr>';
          return;
        }
        const ul = line.match(/^\s*[-*+]\s+(.*)$/);
        const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
        if (ul || ol) {
          flushPara();
          const want = ul ? 'ul' : 'ol';
          if (listType !== want) {
            closeList();
            html += `<${want}>`;
            listType = want;
          }
          html += `<li>${inline((ul ? ul[1] : ol[1]))}</li>`;
          return;
        }
        if (line.startsWith('>')) {
          flushPara();
          closeList();
          html += `<blockquote>${inline(line.replace(/^>\s?/, ''))}</blockquote>`;
          return;
        }
        closeList();
        para.push(line.trim());
      });
      flushPara();
      closeList();
    });
    return html;
  }

  /* --------------------------- demo engine -------------------------- */
  const DEMO = {
    greet: [
      `**Seja muito bem-vindo!** 👋\n\nSou a **SKYNETchat**, sua IA em português. Posso:\n\n- **Pesquisar** e resumir informação atualizada\n- **Escrever** textos, e-mails, roteiros e códigos\n- **Analisar** documentos e explicar temas difíceis\n- **Gerar imagens** e ajudar em projetos\n\nO que você quer resolver agora?`,
    ],
    code: [
      `Aqui está um exemplo de função com *streaming* no navegador, do jeito que uso internamente:\n\n\`\`\`javascript\nasync function streamChat(prompt, onDelta) {\n  const res = await fetch('/api/chat', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify({ prompt }),\n  });\n\n  const reader = res.body.getReader();\n  const decoder = new TextDecoder();\n\n  while (true) {\n    const { done, value } = await reader.read();\n    if (done) break;\n    onDelta(decoder.decode(value, { stream: true }));\n  }\n}\n\`\`\`\n\n**Como funciona:**\n\n1. A resposta chega em pedaços (\`chunks\`) via \`ReadableStream\`.\n2. Cada pedaço é decodificado e pintado na tela na hora.\n3. O usuário vê o texto surgindo em tempo real, sem esperar o fim.\n\nQuer que eu adapte isso para React, Svelte ou para o seu backend?`,
    ],
    image: [
      `**Geração de imagens** funciona assim:\n\n- Descreva a cena com **estilo**, **luz** e **enquadramento**.\n- Quanto mais específico, melhor o resultado.\n\n**Exemplo de prompt:**\n\n> retrato cinematográfico de um astronauta em uma estação abandonada, luz vermelha de emergência, poeira suspensa no ar, lente 35mm, alto contraste\n\nMe diga o tema e eu monto o prompt completo para você.`,
    ],
    research: [
      `Vou organizar a pesquisa em três frentes:\n\n**1. O que já se sabe**\nOs pontos consolidados e as fontes mais confiáveis sobre o tema.\n\n**2. O que está em disputa**\nOnde os dados divergem e por quê.\n\n**3. O que fazer com isso**\nA recomendação prática, com os riscos de cada caminho.\n\nMe diga o recorte exato (tema, período, região) e eu aprofundo.`,
    ],
    generic: [
      `Entendi: **{q}**.\n\nVou responder em camadas, do essencial ao detalhe:\n\n**Resumo direto**\nEsse é um tema que rende mais quando você separa o objetivo prático do contexto teórico.\n\n**Pontos principais**\n- **Contexto:** o que está em jogo e por que agora.\n- **Alternativas:** os caminhos possíveis, com custo e retorno de cada um.\n- **Risco:** o que costuma dar errado nesse tipo de decisão.\n\n**Próximo passo**\nSe você me disser o resultado que espera, eu transformo isso em um plano com etapas e prazos.`,
      `Boa pergunta. Sobre **{q}**:\n\n**1.** O ponto central é entender *o que você quer no final* — texto pronto, decisão tomada ou aprendizado.\n\n**2.** Com isso claro, consigo:\n   - levantar os fatos relevantes;\n   - apontar as armadilhas comuns;\n   - entregar a versão final no formato que você precisar.\n\n**3.** Se quiser, já começo pelo rascunho e você ajusta em cima.`,
    ],
  };

  function demoReply(prompt) {
    const p = (prompt || '').toLowerCase();
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    if (/^(oi|ola|olá|bom dia|boa tarde|boa noite|e ai|e aí|hey|teste)\b/.test(p)) return pick(DEMO.greet);
    if (/c[oó]digo|program|javascript|python|api|fun[çc][aã]o|react|svelte|html|css/.test(p)) return pick(DEMO.code);
    if (/imagem|foto|desenh|arte|ilustr/.test(p)) return pick(DEMO.image);
    if (/pesquis|buscar|fonte|not[ií]cia|dado|estat[ií]stica/.test(p)) return pick(DEMO.research);
    const clean = prompt.trim().replace(/\s+/g, ' ').slice(0, 90);
    return pick(DEMO.generic).replace('{q}', clean);
  }


  /* ------------------------ log de pensamento ----------------------- */
  function buildSteps(prompt, mode) {
    const p = (prompt || '').toLowerCase();
    const steps = [];
    steps.push({ label: 'entrada', text: `"${prompt.trim().slice(0, 90)}"` });
    steps.push({ label: 'analisar', text: /c[oó]digo|program|api|fun[çc][aã]o|script/.test(p) ? 'intenção: código / implementação' : /pesquis|fonte|not[ií]cia|quem|quando/.test(p) ? 'intenção: pesquisa factual' : /imagem|foto|arte/.test(p) ? 'intenção: geração visual' : 'intenção: resposta direta' });
    steps.push({ label: 'contexto', text: `histórico: ${Math.max(0, (currentConv()?.messages.length || 1) - 1)} mensagens · idioma: pt-BR` });
    steps.push({ label: 'modo', text: mode === 'Pesquisa' ? 'pesquisa na web + síntese' : mode === 'MAX' ? '4.5 MAX · raciocínio profundo' : '4.5 Rápido · resposta direta' });
    if (mode === 'Pesquisa') steps.push({ label: 'buscar', text: 'consultando índice e cruzando fontes' });
    if (/c[oó]digo|program|api|fun[çc][aã]o|script/.test(p)) steps.push({ label: 'plano', text: 'esboçar snippet mínimo, comentar e testar o fluxo de dados' });
    steps.push({ label: 'compor', text: 'estruturar resposta em markdown' });
    steps.push({ label: 'revisar', text: 'checar coerência, tamanho e tom' });
    return steps;
  }

  function traceEl() {
    const wrap = document.createElement('div');
    wrap.className = 'sk-trace open';
    wrap.innerHTML = `
      <button type="button" class="sk-trace-head" data-trace-toggle>
        <span class="sk-trace-arrow">▾</span>
        <span>Pensamento</span>
        <span class="sk-trace-meta" data-trace-meta>0 passos</span>
        <span class="sk-trace-tag">${S.settings.engine === 'api' ? 'API' : 'demo'}</span>
      </button>
      <div class="sk-trace-body" data-trace-body></div>`;
    wrap.querySelector('[data-trace-toggle]').addEventListener('click', () => {
      wrap.classList.toggle('open');
      wrap.querySelector('.sk-trace-arrow').textContent = wrap.classList.contains('open') ? '▾' : '▸';
    });
    return wrap;
  }

  function traceLine(label, text) {
    const d = document.createElement('div');
    d.className = 'sk-trace-line';
    d.innerHTML = `<span class="sk-dot"></span><b>${esc(label)}</b><span>${esc(text)}</span>`;
    return d;
  }

  function sourcesBlock(prompt) {
    const q = encodeURIComponent(prompt.trim().slice(0, 120));
    return `**Fontes consultadas (abrir para conferir)**

` +
      `- [Busca web](${'https://duckduckgo.com/?q='}${q})
` +
      `- [Google](${'https://www.google.com/search?q='}${q})
` +
      `- [Notícias](${'https://news.google.com/search?q='}${q}&hl=pt-BR'})
` +
      `- [Wikipédia](${'https://pt.wikipedia.org/w/index.php?search='}${q})

` +
      `> A busca acima é executada no seu navegador. Para respostas sintetizadas com fontes ao vivo, ative o modo **API** em *Configurar IA*.`;
  }

  /* ------------------------ real API streaming ---------------------- */
  async function apiStream(messages, onDelta, signal) {
    const cfg = S.settings;
    const isAnthropic = /anthropic\.com/.test(cfg.endpoint);
    const body = isAnthropic
      ? { model: cfg.model, max_tokens: 2048, stream: true, system: cfg.system, messages }
      : {
          model: cfg.model,
          stream: true,
          temperature: Number(cfg.temperature) || 0.8,
          messages: [{ role: 'system', content: cfg.system }, ...messages],
        };
    const headers = { 'Content-Type': 'application/json' };
    if (cfg.key) headers[isAnthropic ? 'x-api-key' : 'Authorization'] = isAnthropic ? cfg.key : `Bearer ${cfg.key}`;
    if (isAnthropic) headers['anthropic-version'] = '2023-06-01';

    const res = await fetch(cfg.endpoint, { method: 'POST', headers, body: JSON.stringify(body), signal });
    if (!res.ok || !res.body) {
      const txt = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${txt.slice(0, 180)}`);
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        const l = line.trim();
        if (!l) continue;
        // Vercel AI SDK data stream: 0:"texto"
        if (/^0:/.test(l)) {
          try { onDelta(JSON.parse(l.slice(2))); } catch (e) {}
          continue;
        }
        if (!l.startsWith('data:')) continue;
        const data = l.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const j = JSON.parse(data);
          const t = j.choices?.[0]?.delta?.content ?? j.delta?.text ?? '';
          if (t) onDelta(t);
        } catch (e) {}
      }
    }
  }

  /* --------------------------- chat UI ------------------------------ */
  const CHAT_LIST_CLASSES =
    'chat-list space-y-3 overflow-y-auto overflow-x-hidden text-sm no-h-pan min-w-0 max-w-full svelte-76r9u1';
  let listEl = null;

  function ensureList() {
    if (listEl && document.body.contains(listEl)) return listEl;
    listEl = $('.chat-list');
    if (!listEl) {
      const host = $('.app-content') || $('main');
      listEl = document.createElement('ul');
      listEl.className = CHAT_LIST_CLASSES;
      listEl.style.cssText =
        'height:calc(100svh - var(--headerH,44px) - var(--form-space,140px));padding-top:20px;padding-bottom:var(--form-space,140px);overflow-anchor:auto;touch-action:pan-y;contain:content;';
      host.appendChild(listEl);
    }
    return listEl;
  }

  function hideWelcome() {
    const w = $('.welcome-screen');
    if (w) w.style.display = 'none';
  }

  function showWelcome() {
    const w = $('.welcome-screen');
    if (w) w.style.display = '';
  }

  function currentConv() {
    return S.conversations.find((c) => c.id === S.currentId) || null;
  }

  function newConv() {
    const c = { id: 'c' + Date.now().toString(36), title: 'Novo chat', messages: [], updated: Date.now() };
    S.conversations.unshift(c);
    S.currentId = c.id;
    save();
    return c;
  }

  function bubbleUser(text) {
    const li = document.createElement('li');
    li.setAttribute('data-user-message', 'true');
    li.className = 'user-message-row flex flex-col items-end gap-1 svelte-1onn9rm';
    li.innerHTML = `
      <div class="user-message-width-container flex justify-end w-full">
        <div class="user-message-bubble theme-bg-black theme-text-black max-w-[70%] message-glow-black border theme-border-black break-words whitespace-normal px-4 py-3 text-sm leading-relaxed svelte-1onn9rm">
          <div class="user-message-collapse-root svelte-1onn9rm">
            <div class="user-message-content svelte-1onn9rm"><div class="!m-0 [&_*]:!m-0"><p>${esc(text).replace(/\n/g, '<br>')}</p></div></div>
          </div>
        </div>
      </div>
      <div class="user-message-controls mr-1 svelte-1onn9rm">
        <div role="menu" aria-label="Ações da mensagem" class="user-message-actions flex h-8 items-center gap-1 actions-theme-dark svelte-1onn9rm">
          <button data-act="copy" aria-label="Copiar" class="user-message-action inline-flex items-center justify-center w-8 h-8 rounded-full p-0 text-white/70 hover:text-white hover:bg-white/15 transition-all cursor-pointer svelte-1onn9rm" title="Copiar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
        </div>
      </div>`;
    li.querySelector('[data-act="copy"]').addEventListener('click', () => {
      navigator.clipboard.writeText(text).then(() => toast('Copiado'));
    });
    return li;
  }

  function bubbleAssistant() {
    const li = document.createElement('li');
    li.className = 'flex flex-col items-start group relative w-full min-w-0 max-w-full !mt-1 sm:!mt-0 svelte-76r9u1';
    li.innerHTML = `
      <div class="ai-message markdown-v45 pt-1 bg-none rounded-2xl pl-3 pr-4 pb-3 prose prose-base ai-text-black prose-invert prose-p:leading-7 prose-p:mb-4 prose-p:last:mb-0 prose-headings:font-semibold prose-pre:rounded-lg prose-pre:my-4 prose-pre:p-4 svelte-76r9u1" data-ai-body>
        <div data-ai-content></div>
      </div>
      <div class="w-full mt-2 px-1 min-w-0 max-w-full overflow-x-hidden opacity-0 transition-opacity duration-300" data-ai-actions>
        <div class="flex items-center justify-between min-w-0">
          <div class="-ml-1 flex shrink-0 items-center gap-0.5">
            <button aria-label="Compartilhar" data-act="share" class="inline-flex items-center justify-center h-8 rounded-full aspect-[9/8] p-0 text-white/40 hover:text-white/80 hover:bg-white/10 transition-all cursor-pointer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg></button>
            <button aria-label="Ouvir" data-act="speak" class="inline-flex items-center justify-center h-8 rounded-full aspect-[9/8] p-0 text-white/40 hover:text-white/80 hover:bg-white/10 transition-all cursor-pointer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M11 5 6 9H2v6h4l5 4z"></path><path d="M15.5 8.5a5 5 0 0 1 0 7"></path><path d="M19 5a9 9 0 0 1 0 14"></path></svg></button>
            <button aria-label="Copiar" data-act="copy" class="inline-flex items-center justify-center h-8 rounded-full aspect-[9/8] p-0 text-white/40 hover:text-white/80 hover:bg-white/10 transition-all cursor-pointer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>
            <button aria-label="Reescrever" data-act="regen" class="inline-flex items-center justify-center h-8 rounded-full aspect-square p-0 text-white/40 hover:text-white/80 hover:bg-white/10 transition-all cursor-pointer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg></button>
          </div>
          <div class="flex shrink-0 items-center gap-0.5">
            <button aria-label="Útil" data-act="up" class="inline-flex items-center justify-center h-8 rounded-full aspect-[9/8] p-0 text-white/40 hover:text-white/80 hover:bg-white/10 transition-all cursor-pointer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg></button>
            <button aria-label="Não útil" data-act="down" class="inline-flex items-center justify-center h-8 rounded-full aspect-[9/8] p-0 text-white/40 hover:text-white/80 hover:bg-white/10 transition-all cursor-pointer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg></button>
          </div>
        </div>
      </div>`;
    return li;
  }

  function scrollToEnd() {
    if (!listEl) return;
    listEl.scrollTop = listEl.scrollHeight;
  }

  /* ------------------------- generation ----------------------------- */
  let generating = false;
  let abortCtrl = null;

  async function send(text) {
    const prompt = (text || '').trim();
    if (!prompt || generating) return;
    if (!S.logged) {
      toast('Entre para conversar');
      setTimeout(() => (location.href = 'login.html'), 500);
      return;
    }
    if (!S.pro && S.credits <= 0) {
      openPanel('pro');
      return;
    }

    hideWelcome();
    ensureList();
    let conv = currentConv();
    if (!conv) conv = newConv();
    if (conv.title === 'Novo chat') conv.title = prompt.slice(0, 48);
    conv.messages.push({ role: 'user', content: prompt, ts: Date.now() });
    conv.updated = Date.now();
    save();

    listEl.appendChild(bubbleUser(prompt));
    scrollToEnd();

    const li = bubbleAssistant();
    listEl.appendChild(li);
    const content = li.querySelector('[data-ai-content]');
    const actions = li.querySelector('[data-ai-actions]');
    const body = li.querySelector('[data-ai-body]');
    content.innerHTML = '<span class="sk-thinking"><i></i><i></i><i></i></span>';

    let mode = ($('.composer-mode-label') || {}).textContent?.trim() || 'Rápido';
    if (mode === 'Rápido' && /^\s*(pesquis|busque|procure|pesquisa)/i.test(prompt)) mode = 'Pesquisa';
    if (mode === 'Rápido' && /\b(max|profund|detalhad)\b/i.test(prompt)) mode = 'MAX';
    const steps = buildSteps(prompt, mode);
    const trace = traceEl();
    li.insertBefore(trace, body);
    const traceBody = trace.querySelector('[data-trace-body]');
    const traceMeta = trace.querySelector('[data-trace-meta]');
    scrollToEnd();

    generating = true;
    abortCtrl = new AbortController();
    setComposerBusy(true);
    if (!S.pro) S.credits = Math.max(0, S.credits - 1);
    renderCredits();

    let acc = '';
    let pending = '';
    let raf = null;
    const paint = () => {
      raf = null;
      content.innerHTML = mdBlocks(acc) + '<span class="sk-caret"></span>';
      scrollToEnd();
    };
    const onDelta = (t) => {
      acc += t;
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const t0 = performance.now();
    try {
      // log de pensamento (streaming das etapas)
      for (const st of steps) {
        if (!generating) break;
        traceBody.appendChild(traceLine(st.label, st.text));
        traceMeta.textContent = `${traceBody.children.length} passos · ${((performance.now() - t0) / 1000).toFixed(1)}s`;
        scrollToEnd();
        await new Promise((r) => setTimeout(r, 90 + Math.random() * 120));
      }
      const finalLine = traceLine('gerar', 'escrevendo resposta em tempo real');
      traceBody.appendChild(finalLine);
      scrollToEnd();

      if (S.settings.engine === 'api' && S.settings.endpoint) {
        const msgs = conv.messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({ role: m.role, content: m.content }));
        await apiStream(msgs, onDelta, abortCtrl.signal);
        if (!acc) throw new Error('Resposta vazia');
      } else {
        const full = demoReply(prompt);
        const chunks = full.match(/\s*\S+|\s+/g) || [full];
        for (const ch of chunks) {
          if (!generating) break;
          await new Promise((r) => setTimeout(r, 18 + Math.random() * 34));
          onDelta(ch);
        }
      }
    } catch (err) {
      acc += `\n\n> ⚠️ Falha ao falar com a API (${String(err.message || err).slice(0, 160)}).\n> Abra **Configurar IA** e verifique endpoint, modelo e chave. O modo demo continua funcionando.`;
    }

    if (raf) cancelAnimationFrame(raf);
    if (mode === 'Pesquisa') acc += `\n\n---\n\n${sourcesBlock(prompt)}`;
    traceMeta.textContent = `${traceBody.children.length} passos · ${((performance.now() - t0) / 1000).toFixed(1)}s`;
    trace.classList.add('open');
    trace.querySelector('.sk-trace-arrow').textContent = '▾';
    content.innerHTML = mdBlocks(acc || '_(sem resposta)_');
    actions.style.opacity = '1';
    actions.style.pointerEvents = 'auto';
    body.classList.remove('is-streaming');

    conv.messages.push({ role: 'assistant', content: acc, trace: steps, ts: Date.now() });
    conv.updated = Date.now();
    save();
    renderHistory();

    generating = false;
    abortCtrl = null;
    setComposerBusy(false);
    scrollToEnd();

    // ações
    actions.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-act]');
      if (!btn) return;
      const act = btn.getAttribute('data-act');
      if (act === 'copy') navigator.clipboard.writeText(acc).then(() => toast('Copiado'));
      if (act === 'speak') speak(acc);
      if (act === 'share') {
        if (navigator.share) navigator.share({ title: 'SKYNETchat', text: acc.slice(0, 400) }).catch(() => {});
        else navigator.clipboard.writeText(acc).then(() => toast('Copiado'));
      }
      if (act === 'up' || act === 'down') toast(act === 'up' ? 'Valeu pelo feedback' : 'Anotado, obrigado');
      if (act === 'regen') {
        li.remove();
        const lastUser = [...conv.messages].reverse().find((m) => m.role === 'user');
        if (conv.messages[conv.messages.length - 1]?.role === 'assistant') conv.messages.pop();
        save();
        send(lastUser ? lastUser.content : prompt);
      }
    });
    content.addEventListener('click', (ev) => {
      const c = ev.target.closest('[data-copy-code]');
      if (!c) return;
      const pre = c.closest('.sk-code-head')?.nextElementSibling;
      if (pre) navigator.clipboard.writeText(pre.innerText).then(() => toast('Código copiado'));
    });
  }

  function speak(text) {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[*`#>]/g, '').slice(0, 3000));
      u.lang = 'pt-BR';
      speechSynthesis.speak(u);
      toast('Reproduzindo áudio');
    } catch (e) {
      toast('Áudio não suportado neste navegador');
    }
  }

  /* --------------------------- composer ----------------------------- */
  const PLACEHOLDERS = [
    'Pesquise sem censura...',
    'Pergunte o que quiser...',
    'Escreva um e-mail profissional...',
    'Explique um tema difícil...',
    'Gere um prompt de imagem...',
    'Programe uma função...',
  ];

  function initComposer() {
    const form = $$('form').find((f) => f.querySelector('textarea'));
    if (!form) return;
    const ta = form.querySelector('textarea');
    const sendBtn = form.querySelector('[aria-label="Enviar"], .composer-action, [aria-label="Voz"]');
    const micBtn = form.querySelector('[aria-label="Gravar áudio"]');
    const attachBtn = form.querySelector('[aria-label="Anexar arquivo"]');
    const placeholderEl = form.querySelector('.composer-placeholder');

    const counter = form.querySelector('.composer-counter') || null;

    const grow = () => {
      ta.style.height = 'auto';
      const h = Math.min(180, Math.max(32, ta.scrollHeight));
      ta.style.height = h + 'px';
      ta.style.lineHeight = h > 40 ? '1.5' : '32px';
      if (placeholderEl) placeholderEl.style.opacity = ta.value ? '0' : '0.4';
      document.documentElement.style.setProperty('--form-space', Math.max(60, h + 52) + 'px');
    };
    ta.addEventListener('input', grow);
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    });
    const submit = () => {
      const v = ta.value;
      if (!v.trim()) return;
      ta.value = '';
      grow();
      send(v);
    };
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submit();
    });
    if (sendBtn) sendBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!ta.value.trim()) return toast('Escreva ou dite uma mensagem');
      submit();
    });
    if (micBtn) micBtn.addEventListener('click', (e) => { e.preventDefault(); toast('Ditado por voz chega em breve'); });
    if (attachBtn) attachBtn.addEventListener('click', (e) => { e.preventDefault(); toast('Anexos ficam salvos apenas na sua sessão'); });

    // typewriter placeholder
    if (placeholderEl) {
      const textNode = placeholderEl.childNodes[0];
      let pi = 0, ci = 0, del = false;
      setInterval(() => {
        if (ta.value) return;
        const target = PLACEHOLDERS[pi];
        if (!del) {
          ci++;
          if (ci > target.length + 10) { del = true; ci = target.length; }
        } else {
          ci -= 2;
          if (ci <= 0) { del = false; ci = 0; pi = (pi + 1) % PLACEHOLDERS.length; }
        }
        if (textNode) textNode.nodeValue = target.slice(0, Math.max(0, ci));
      }, 85);
    }

    grow();
  }

  function setComposerBusy(busy) {
    const form = $$('form').find((f) => f.querySelector('textarea'));
    const sendBtn = form ? form.querySelector('[aria-label="Enviar"], .composer-action, [aria-label="Voz"]') : null;
    if (sendBtn) {
      sendBtn.classList.toggle('sk-stop', busy);
      sendBtn.style.opacity = busy ? '0.75' : '';
    }
    document.documentElement.style.setProperty('--composer-busy', busy ? '1' : '0');
  }

  /* --------------------------- credits ------------------------------ */
  function renderCredits() {
    const el = $$('span, div').find((e) => /^\s*\d+\/\d+\s*$/.test(e.textContent || '') && e.children.length === 0);
    if (el) el.textContent = `${S.credits}/5`;
  }

  /* --------------------------- panels ------------------------------- */
  const PANELS = {};

  function overlay(id) {
    let ov = document.querySelector(`.sk-overlay[data-panel="${id}"]`);
    if (ov) return ov;
    ov = document.createElement('div');
    ov.className = 'sk-overlay';
    ov.setAttribute('data-panel', id);
    ov.innerHTML = `<div class="sk-panel" role="dialog" aria-modal="true">
      <div class="sk-panel-head">
        <div><div class="sk-eyebrow" data-eyebrow></div><h2 data-title></h2></div>
        <button class="sk-close" aria-label="Fechar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      </div>
      <div class="sk-panel-body" data-body></div>
    </div>`;
    ov.addEventListener('click', (e) => {
      if (e.target === ov || e.target.closest('.sk-close')) closePanel(id);
    });
    document.body.appendChild(ov);
    return ov;
  }

  function openPanel(id) {
    const def = PANELS[id];
    if (!def) return;
    const ov = overlay(id);
    $('[data-eyebrow]', ov).textContent = def.eyebrow || 'SKYNETchat';
    $('[data-title]', ov).textContent = def.title || '';
    const body = $('[data-body]', ov);
    body.innerHTML = '';
    def.render(body, ov);
    ov.classList.add('is-open');
  }

  function closePanel(id) {
    const ov = document.querySelector(`.sk-overlay[data-panel="${id}"]`);
    if (ov) ov.classList.remove('is-open');
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') $$('.sk-overlay.is-open').forEach((o) => o.classList.remove('is-open'));
  });

  /* ---- painel: atualizações ---- */
  PANELS.updates = {
    eyebrow: 'Atualizações',
    title: 'SKYNETchat 4.5',
    render(body) {
      body.innerHTML = `
        <span class="sk-tag">24 de agosto · Admin</span>
        <h3>Apresentamos a SKYNETchat 4.5</h3>
        <p>Nas últimas semanas, trabalhamos nos pontos que vocês mais cobraram: <strong>contexto</strong>, <strong>imagens</strong>, <strong>pesquisa</strong>, <strong>velocidade</strong> e <strong>código</strong>.</p>
        <p>A 4.5 entende melhor o que veio antes na conversa, lê imagens sem quebrar o contexto, entra no site que você enviou e mostra o código enquanto ele está sendo criado.</p>
        <p>Também simplificamos o chat. Agora existem apenas duas versões:</p>
        <ul>
          <li><strong>⚡ 4.5 Rápida</strong> — completa e veloz, ideal para o dia a dia.</li>
          <li><strong>🧠 4.5 MAX</strong> — raciocínio profundo, respostas longas e código complexo.</li>
        </ul>
        <h3>O que muda na prática</h3>
        <ul>
          <li>Memória de conversa mais longa e coerente.</li>
          <li>Leitura de imagens dentro do contexto do chat.</li>
          <li>Pesquisa na web mais profunda, com mais fontes.</li>
          <li>Streaming mais fluido, com código aparecendo em tempo real.</li>
        </ul>`;
    },
  };

  /* ---- painel: imagens ---- */
  PANELS.images = {
    eyebrow: 'BETA',
    title: 'Imagens',
    render(body) {
      body.innerHTML = `
        <p><strong>Gere e explore imagens com IA.</strong> Descreva a cena, escolha o estilo e receba variações em segundos.</p>
        <div class="sk-field"><label>Prompt</label><textarea rows="3" data-img-prompt placeholder="ex: retrato cinematográfico de um astronauta em uma estação abandonada, luz vermelha, lente 35mm"></textarea></div>
        <div class="sk-field"><label>Estilo</label>
          <select data-img-style>
            <option>Fotorrealista</option><option>Cinematográfico</option><option>Ilustração 3D</option><option>Anime</option><option>Minimalista</option>
          </select>
        </div>
        <button class="sk-btn" data-img-go>Gerar imagem</button>
        <div data-img-out style="margin-top:14px"></div>`;
      $('[data-img-go]', body).addEventListener('click', () => {
        const p = $('[data-img-prompt]', body).value.trim();
        if (!p) return toast('Descreva a imagem');
        $('[data-img-out]', body).innerHTML =
          `<div class="sk-hint">Prompt montado (cole em <strong>Programar → modo imagem</strong> da sua instância com API):</div>
           <pre style="white-space:pre-wrap;background:#101010;border:1px solid var(--sk-line);border-radius:10px;padding:10px;font-size:12px;margin-top:8px">${esc(p)} — estilo ${esc($('[data-img-style]', body).value)}, alta qualidade, iluminação dramática, 4:3</pre>`;
      });
    },
  };

  /* ---- painel: projetos ---- */
  PANELS.projects = {
    eyebrow: 'NOVO',
    title: 'Projetos',
    render(body) {
      body.innerHTML = `
        <p>Organize conversas, arquivos e entregas por projeto.</p>
        <div class="sk-list">
          <div class="sk-item"><div class="sk-item-title"><strong>Como usar o SKYNETchat</strong><br><small>Projeto de exemplo que serve também como guia rápido.</small></div></div>
          <div class="sk-item"><div class="sk-item-title"><strong>Conteúdo e copy</strong><br><small>Roteiros, posts e e-mails.</small></div></div>
          <div class="sk-item"><div class="sk-item-title"><strong>Código e automações</strong><br><small>Scripts, integrações e deploys.</small></div></div>
        </div>
        <button class="sk-btn ghost" style="margin-top:14px" data-new-proj>+ Novo projeto</button>`;
      $('[data-new-proj]', body).addEventListener('click', () => toast('Projetos ficam salvos no seu navegador neste clone'));
    },
  };

  /* ---- painel: histórico ---- */
  PANELS.history = {
    eyebrow: 'CONVERSAS',
    title: 'Histórico',
    render(body) {
      renderHistory(body);
    },
  };

  function renderHistory(body) {
    const host = body || ($('.sk-overlay[data-panel="history"] [data-body]') || null);
    if (!host) return;
    const items = S.conversations.filter((c) => c.messages.length);
    host.innerHTML = `
      <div class="sk-search-row">
        <input type="search" placeholder="Buscar nas conversas..." data-hist-q>
        <button class="sk-btn ghost" data-export title="Exportar JSON">⤓</button>
      </div>
      <div data-hist-list></div>`;
    const list = $('[data-hist-list]', host);
    const paint = (q) => {
      const f = items.filter((c) => !q || (c.title + ' ' + c.messages.map((m) => m.content).join(' ')).toLowerCase().includes(q));
      if (!f.length) { list.innerHTML = '<div class="sk-empty">Nenhuma conversa encontrada.</div>'; return; }
      list.innerHTML = `<div class="sk-list">${f.map((c) => `<div class="sk-item" data-row="${c.id}">
        <button class="sk-item-title" data-open="${c.id}" style="background:none;border:0;color:inherit;text-align:left;cursor:pointer;padding:0;font:inherit">
          <strong>${esc(c.title)}</strong><br><small>${c.messages.length} msgs · ${new Date(c.updated).toLocaleString('pt-BR')}</small>
        </button>
        <button class="sk-close" data-del="${c.id}" title="Apagar" style="width:24px;height:24px">✕</button>
      </div>`).join('')}</div>`;
      $$('[data-open]', list).forEach((b) => b.addEventListener('click', () => { loadConv(b.getAttribute('data-open')); closePanel('history'); }));
      $$('[data-del]', list).forEach((b) => b.addEventListener('click', () => {
        S.conversations = S.conversations.filter((c) => c.id !== b.getAttribute('data-del'));
        save(); renderHistory(host); toast('Conversa apagada');
      }));
    };
    paint('');
    const q = $('[data-hist-q]', host);
    if (q) q.addEventListener('input', () => paint(q.value.toLowerCase().trim()));
    const ex = $('[data-export]', host);
    if (ex) ex.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(S.conversations, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'skynetchat-conversas.json';
      a.click();
      toast('Backup exportado');
    });
  }

  /* ---- painel: prompts ---- */
  PANELS.prompts = {
    eyebrow: 'BIBLIOTECA',
    title: 'Prompts úteis',
    render(body) {
      const prompts = [
        ['Pesquisa profunda', 'Pesquise sobre [tema] e me entregue: fatos confirmados, o que está em disputa e as fontes.'],
        ['Copy que vende', 'Escreva 3 variações de copy para [produto], com tom direto, prova social e CTA.'],
        ['Explicar difícil', 'Explique [tema] para alguém leigo, com uma analogia e um exemplo prático.'],
        ['Revisar código', 'Revise este código, aponte bugs, riscos de segurança e proponha a versão corrigida.'],
        ['Roteiro de vídeo', 'Crie um roteiro de 60s sobre [tema], com gancho nos 3 primeiros segundos.'],
        ['Plano de 7 dias', 'Monte um plano de 7 dias para [objetivo], com tarefas diárias de até 30 minutos.'],
      ];
      body.innerHTML = `<div class="sk-list">${prompts
        .map(
          ([t, p], i) => `<button class="sk-item" data-p="${i}">
            <span class="sk-item-title"><strong>${t}</strong><br><small>${esc(p)}</small></span>
          </button>`
        )
        .join('')}</div>`;
      const demoBtn = document.createElement('button');
      demoBtn.className = 'sk-btn ghost';
      demoBtn.style.marginTop = '12px';
      demoBtn.textContent = 'Ver conversa de exemplo (com log)';
      demoBtn.addEventListener('click', () => {
        closePanel('prompts');
        seedExample();
      });
      body.appendChild(demoBtn);
      $$('[data-p]', body).forEach((b) =>
        b.addEventListener('click', () => {
          const p = prompts[Number(b.getAttribute('data-p'))][1];
          const ta = $('form textarea');
          if (ta) {
            ta.value = p;
            ta.dispatchEvent(new Event('input'));
            ta.focus();
          }
          closePanel('prompts');
        })
      );
    },
  };

  /* ---- painel: suporte ---- */
  PANELS.support = {
    eyebrow: 'ATENDIMENTO',
    title: 'Suporte SKYNETchat',
    render(body) {
      body.innerHTML = `<div data-support-log></div>
        <div class="sk-quick">
          <button data-q="Recuperar minha conta">Recuperar conta</button>
          <button data-q="Como assinar o PRO?">Assinar o PRO</button>
          <button data-q="Minha conta sai sozinha">Sessão caindo</button>
          <button data-q="Formas de pagamento">Pagamento</button>
        </div>`;
      const log = $('[data-support-log]', body);
      const add = (text, me) => {
        const row = document.createElement('div');
        row.className = 'sk-bubble-row';
        row.innerHTML = `<div class="sk-bubble ${me ? 'me' : ''}">${esc(text)}</div>`;
        log.appendChild(row);
        log.scrollTop = log.scrollHeight;
      };
      add('Oi! 👋 Sou o suporte do SKYNETchat. Como posso te ajudar? (conta, planos, pagamento, acesso...)');
      const answers = {
        'Recuperar minha conta': 'Para recuperar o acesso, informe o e-mail usado no cadastro e o código de ativação de 12 dígitos. Se você perdeu o código, abrimos a verificação por e-mail.',
        'Como assinar o PRO?': 'O PRO libera a 4.5 MAX, mais contexto e geração de imagens. Você assina pelo menu da conta, em "Assinar SKYNETchat PRO".',
        'Minha conta sai sozinha': 'Isso normalmente é cookie bloqueado ou aba duplicada. Saia em todas as abas, limpe os cookies do site e entre de novo.',
        'Formas de pagamento': 'Aceitamos cartão de crédito, Pix e boleto. O acesso é liberado assim que o pagamento é confirmado.',
      };
      $$('[data-q]', body).forEach((b) =>
        b.addEventListener('click', () => {
          const q = b.getAttribute('data-q');
          add(q, true);
          setTimeout(() => add(answers[q] || 'Já anotei aqui, um atendente humano continua em seguida.'), 500);
        })
      );
    },
  };

  /* ---- painel: grupos ---- */
  PANELS.groups = {
    eyebrow: 'NOVO',
    title: 'Conversas em grupo',
    render(body) {
      body.innerHTML = `
        <p><strong>Pense junto. Sem censura.</strong> Crie um link, convide sua equipe e alinhe estratégias com a SKYNETchat em tempo real.</p>
        <div class="sk-list">
          <div class="sk-item"><div class="sk-item-title">10 participantes</div></div>
          <div class="sk-item"><div class="sk-item-title">IA em tempo real com @skynet</div></div>
        </div>
        <button class="sk-btn" style="margin-top:14px" data-new-group>Criar sessão colaborativa</button>
        <p class="sk-hint" style="margin-top:10px">Neste clone estático a sessão é simulada: o link é gerado localmente.</p>`;
      $('[data-new-group]', body).addEventListener('click', () => {
        const code = Math.random().toString(36).slice(2, 8).toUpperCase();
        toast('Sessão criada: ' + code);
      });
    },
  };

  /* ---- painel: configuração de IA ---- */
  PANELS.settings = {
    eyebrow: 'CONFIGURAÇÃO',
    title: 'Motor de IA',
    render(body) {
      const s = S.settings;
      body.innerHTML = `
        <p class="sk-hint">Este clone roda 100% no navegador. No modo <strong>demo</strong> as respostas são geradas localmente (streaming simulado). No modo <strong>API</strong> o texto vem de um endpoint real com streaming — OpenAI, Groq, OpenRouter, Anthropic ou qualquer proxy compatível.</p>
        <div class="sk-field"><label>Motor</label>
          <select data-f="engine">
            <option value="demo" ${s.engine === 'demo' ? 'selected' : ''}>Demo (local, sem chave)</option>
            <option value="api" ${s.engine === 'api' ? 'selected' : ''}>API com streaming (chave própria)</option>
          </select>
        </div>
        <div class="sk-field"><label>Endpoint</label><input data-f="endpoint" value="${esc(s.endpoint)}" placeholder="https://api.openai.com/v1/chat/completions"></div>
        <div class="sk-field"><label>Modelo</label><input data-f="model" value="${esc(s.model)}" placeholder="gpt-4o-mini"></div>
        <div class="sk-field"><label>Chave da API</label><input data-f="key" type="password" value="${esc(s.key)}" placeholder="sk-..."></div>
        <div class="sk-field"><label>Prompt de sistema</label><textarea data-f="system" rows="3">${esc(s.system)}</textarea></div>
        <div class="sk-field"><label>Conta</label>
          <select data-f="pro">
            <option value="1" ${S.pro ? 'selected' : ''}>PRO desbloqueado (tudo liberado)</option>
            <option value="0" ${!S.pro ? 'selected' : ''}>Free (5 mensagens)</option>
          </select>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="sk-btn" data-save>Salvar</button>
          <button class="sk-btn ghost" data-reset>Restaurar créditos</button>
        </div>
        <p class="sk-hint" style="margin-top:12px">A chave fica salva só no seu navegador (localStorage). Em produção, coloque um proxy para não expor a chave.</p>`;
      $('[data-save]', body).addEventListener('click', () => {
        S.settings.engine = $('[data-f="engine"]', body).value;
        S.settings.endpoint = $('[data-f="endpoint"]', body).value.trim();
        S.settings.model = $('[data-f="model"]', body).value.trim();
        S.settings.key = $('[data-f="key"]', body).value.trim();
        S.settings.system = $('[data-f="system"]', body).value;
        S.pro = $('[data-f="pro"]', body).value === '1';
        save();
        initProBadge();
        toast('Configuração salva');
      });
      $('[data-reset]', body).addEventListener('click', () => {
        S.credits = 5;
        save();
        renderCredits();
        toast('Créditos restaurados');
      });
    },
  };

  /* ---- painel: PRO ---- */
  PANELS.pro = {
    eyebrow: 'DISPONÍVEL AGORA',
    title: '4.5 MAX já está disponível',
    render(body) {
      body.innerHTML = `
        <p>A versão mais avançada da SKYNETchat é exclusiva para usuários <strong>PRO</strong>.</p>
        <ul>
          <li>Pesquisa mais profunda e análises mais completas</li>
          <li>Mais capacidade para respostas extensas e código</li>
          <li>Acesso aos recursos avançados da 4.5 MAX</li>
        </ul>
        <button class="sk-btn" data-pro>Conhecer o PRO</button>`;
      $('[data-pro]', body).addEventListener('click', () => {
        S.credits = 5;
        save();
        renderCredits();
        closePanel('pro');
        toast('Créditos de demonstração renovados');
      });
    },
  };

  /* ---- painel: tema ---- */
  PANELS.theme = {
    eyebrow: 'APARÊNCIA',
    title: 'Tema de fundo',
    render(body) {
      const themes = [
        ['black', 'BLACK', '#000000', '#ec1313'],
        ['carmim', 'CARMIM', '#0d0505', '#ff2d55'],
        ['grafite', 'GRAFITE', '#0b0d10', '#22d3ee'],
        ['verde', 'MATRIX', '#030a06', '#00ff41'],
      ];
      body.innerHTML = `<div class="sk-list">${themes
        .map(
          ([id, name, bg, ac]) => `<button class="sk-item" data-theme="${id}">
            <span style="width:16px;height:16px;border-radius:5px;background:${bg};border:1px solid ${ac}"></span>
            <span class="sk-item-title">${name}</span>${S.theme === id ? '<small>ativo</small>' : ''}
          </button>`
        )
        .join('')}</div>`;
      $$('[data-theme]', body).forEach((b) =>
        b.addEventListener('click', () => {
          applyTheme(b.getAttribute('data-theme'));
          closePanel('theme');
        })
      );
    },
  };

  function applyTheme(id) {
    S.theme = id;
    save();
    const map = {
      black: ['#ec1313', '#000000'],
      carmim: ['#ff2d55', '#0d0505'],
      grafite: ['#22d3ee', '#0b0d10'],
      verde: ['#00ff41', '#030a06'],
    };
    const [ac, bg] = map[id] || map.black;
    document.documentElement.style.setProperty('--sk-accent', ac);
    document.body.style.background = bg;
    document.documentElement.style.background = bg;
    toast('Tema ' + id.toUpperCase());
  }

  /* ---------------------------- drawer ------------------------------ */
  const MENU = {
    'Novo chat': () => startNewChat(),
    'Indique e Ganhe': () => (location.href = 'indicar.html'),
    'Monetize com SKYNETchat': () => (location.href = 'monetizar.html'),
    Atualizações: () => openPanel('updates'),
    Imagens: () => openPanel('images'),
    'Conversas em grupo': () => openPanel('groups'),
    Codex: () => toast('Codex chega em breve'),
    Projetos: () => openPanel('projects'),
    'Histórico de conversas': () => openPanel('history'),
    'Conheça o SKYNETchat': () => (location.href = 'sobre.html'),
    Prompts: () => openPanel('prompts'),
    Suporte: () => (window.__openSupport ? window.__openSupport() : openPanel('support')),
    'Tema de fundo': () => openPanel('theme'),
    'Termos de Serviço': () => (location.href = 'termos.html'),
    'Sair da conta': () => logout(),
    'Fazer login': () => (location.href = 'login.html'),
  };

  function wireDrawer() {
    const items = $$('aside .drawer-nav button, aside .drawer-nav a');
    items.forEach((el) => {
      const label = (el.textContent || '').replace(/\s+/g, ' ').trim();
      const hit = Object.keys(MENU).find((k) => label.startsWith(k));
      if (!hit) return;
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeDrawer();
        MENU[hit]();
      });
    });

    // gatilhos do drawer (button ou div com role)
    $$('[aria-label="Abrir menu"], [aria-label="Abrir painel lateral"]').forEach((el) => {
      el.addEventListener('click', (e) => { e.preventDefault(); openDrawer(); });
    });

    // header / strip / global buttons
    $$('button').forEach((b) => {
      const t = (b.textContent || '').replace(/\s+/g, ' ').trim();
      const al = b.getAttribute('aria-label') || '';
      if (/Abrir menu|Abrir painel lateral/i.test(al)) {
        b.addEventListener('click', (e) => { e.preventDefault(); openDrawer(); });
      }
      if (/^Novo chat$/i.test(t) || /Nova conversa|Limpar conversa/i.test(al)) {
        b.addEventListener('click', (e) => { e.preventDefault(); startNewChat(); });
      }
      if (/Fazer login/i.test(al) || /^Fazer login$/i.test(t)) {
        b.addEventListener('click', (e) => { e.preventDefault(); location.href = 'login.html'; });
      }
      if (b.title === 'Modo Dark') {
        b.addEventListener('click', (e) => { e.preventDefault(); applyTheme(S.theme === 'black' ? 'carmim' : 'black'); });
      }
    });

    // fechar pelo overlay do menu
    $$('.fixed.inset-0.no-h-pan.overlay').forEach((ov) => {
      ov.addEventListener('click', () => closeDrawer());
    });

    // versão (4.5) -> abre configuração
    const version = $('.version-selector');
    if (version) version.addEventListener('click', (e) => { e.preventDefault(); openPanel('settings'); });

    // logo do topo do drawer -> início
    const logo = $('aside .logo-btn') || $('.logo-btn');
    if (logo) logo.addEventListener('click', () => { closeDrawer(); startNewChat(); });
  }

  function openDrawer() {
    const aside = $('aside.drawer-panel') || $('aside');
    const ovl = $$('.fixed.inset-0.no-h-pan.overlay').find((o) => o.getAttribute('aria-label') === 'Fechar menu')
      || $$('.fixed.inset-0.no-h-pan.overlay')[0];
    if (aside) {
      aside.style.transform = 'translateX(0)';
      aside.style.pointerEvents = 'auto';
    }
    if (ovl) {
      ovl.style.opacity = '1';
      ovl.style.pointerEvents = 'auto';
      ovl.style.background = 'linear-gradient(90deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.35) 60%, rgba(0,0,0,.2) 100%)';
    }
    document.body.classList.add('sk-drawer-open');
  }

  function closeDrawer() {
    const aside = $('aside.drawer-panel') || $('aside');
    const ovl = $$('.fixed.inset-0.no-h-pan.overlay')[0];
    if (aside) {
      aside.style.transform = 'translateX(-100%)';
      aside.style.pointerEvents = 'none';
    }
    if (ovl) {
      ovl.style.opacity = '0';
      ovl.style.pointerEvents = 'none';
    }
    document.body.classList.remove('sk-drawer-open');
  }

  function startNewChat() {
    newConv();
    if (listEl) listEl.innerHTML = '';
    showWelcome();
    toast('Novo chat');
    renderHistory();
  }

  function loadConv(id) {
    S.currentId = id;
    save();
    const c = currentConv();
    if (!c) return;
    hideWelcome();
    ensureList();
    listEl.innerHTML = '';
    c.messages.forEach((m) => {
      if (m.role === 'user') listEl.appendChild(bubbleUser(m.content));
      else {
        const li = bubbleAssistant();
        if (m.trace && m.trace.length) {
          const tr = traceEl();
          tr.classList.remove('open');
          tr.querySelector('.sk-trace-arrow').textContent = '▸';
          const tb = tr.querySelector('[data-trace-body]');
          m.trace.forEach((st) => tb.appendChild(traceLine(st.label, st.text)));
          tr.querySelector('[data-trace-meta]').textContent = `${m.trace.length} passos`;
          li.insertBefore(tr, li.firstChild);
        }
        li.querySelector('[data-ai-content]').innerHTML = mdBlocks(m.content);
        const a = li.querySelector('[data-ai-actions]');
        a.style.opacity = '1';
        a.style.pointerEvents = 'auto';
        listEl.appendChild(li);
      }
    });
    scrollToEnd();
  }

  function logout() {
    S.logged = false;
    save();
    location.href = 'login.html';
  }

  /* --------------------------- login page --------------------------- */
  function initLogin() {
    const input = $('input[type="tel"]') || $('form input');
    const form = $('form');
    const submit = form ? form.querySelector('button[type="submit"], button:not([type])') : null;
    const tt = $('.cf-turnstile, [data-turnstile], iframe[src*="challenges.cloudflare"]');

    // mock do widget Cloudflare Turnstile
    if (tt) {
      const wrap = tt.closest('div') || tt;
      const mock = document.createElement('div');
      mock.className = 'sk-turnstile-mock';
      mock.innerHTML = `<div class="sk-tt-left"><span class="sk-tt-check">✓</span> Success!</div><div class="sk-tt-brand">Cloudflare<br>Privacy · Help</div>`;
      wrap.replaceWith(mock);
    }

    if (input) {
      input.addEventListener('input', () => {
        const digits = input.value.replace(/\D/g, '').slice(0, 12);
        const parts = [digits.slice(0, 4), digits.slice(4, 8), digits.slice(8, 12)].filter(Boolean);
        input.value = parts.join('-');
        const counter = $$('span,div').find((e) => /^\d+\/12$/.test((e.textContent || '').trim()) && e.children.length === 0);
        if (counter) counter.textContent = `${digits.length}/12`;
        const status = $$('span,div,p').find((e) => /Pronto para entrar|Digite os 12/i.test(e.textContent || '') && e.children.length === 0);
        if (status) status.textContent = digits.length === 12 ? 'Pronto para entrar' : 'Digite os 12 dígitos';
        if (submit) submit.disabled = digits.length !== 12;
      });
      input.dispatchEvent(new Event('input'));
    }

    const doLogin = (e) => {
      e.preventDefault();
      const digits = (input ? input.value : '').replace(/\D/g, '');
      if (digits.length !== 12) return toast('Digite os 12 dígitos do código');
      S.logged = true;
      S.credits = 5;
      save();
      const btn = submit;
      if (btn) { btn.disabled = true; btn.textContent = 'ENTRANDO...'; }
      setTimeout(() => (location.href = 'index.html'), 700);
    };
    if (form) form.addEventListener('submit', doLogin);
    if (submit) submit.addEventListener('click', doLogin);
  }



  /* ------------------- conversa de exemplo (demo) -------------------- */
  function seedExample() {
    const c = newConv();
    c.title = 'Exemplo · pesquisa + streaming';
    const q = 'Como funciona o streaming de IA e por que ele deixa a resposta mais rápida?';
    c.messages.push({ role: 'user', content: q, ts: Date.now() });
    c.messages.push({
      role: 'assistant',
      trace: buildSteps(q, 'Pesquisa'),
      content: `**Resposta curta:** o modelo não espera terminar para responder. Ele gera *pedaços* (tokens) e cada pedaço é enviado para o navegador assim que existe.\n\n**O caminho completo**\n\n1. O prompt vai para o servidor (ou direto para a API do modelo).\n2. O modelo produz tokens em sequência.\n3. O servidor repassa cada token por uma conexão aberta — SSE ou *stream* binário.\n4. O navegador lê com \`ReadableStream\` e pinta na tela.\n\n\`\`\`javascript\nconst res = await fetch('/api/chat', { method: 'POST', body });\nconst reader = res.body.getReader();\nwhile (true) {\n  const { done, value } = await reader.read();\n  if (done) break;\n  render(new TextDecoder().decode(value));\n}\n\`\`\`\n\n**Por que parece mais rápido**\n\n- O tempo total é o mesmo, mas a **primeira palavra** chega em milissegundos.\n- Você começa a ler antes do fim, então a espera percebida cai.\n\n---\n\n${sourcesBlock(q)}`,
      ts: Date.now() + 1,
    });
    save();
    loadConv(c.id);
    renderHistory();
    toast('Conversa de exemplo carregada');
  }

  /* ----------------------- ditado por voz ---------------------------- */
  function initVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    $$('[aria-label="Gravar áudio"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!SR) return toast('Ditado por voz não suportado neste navegador');
        const ta = $('form textarea');
        if (!ta) return;
        const rec = new SR();
        rec.lang = 'pt-BR';
        rec.interimResults = true;
        rec.continuous = false;
        const base = ta.value;
        btn.style.color = 'var(--sk-accent)';
        rec.onresult = (ev) => {
          let txt = '';
          for (let i = ev.resultIndex; i < ev.results.length; i++) txt += ev.results[i][0].transcript;
          ta.value = (base ? base + ' ' : '') + txt;
          ta.dispatchEvent(new Event('input'));
        };
        rec.onerror = () => toast('Não consegui ouvir. Tente novamente.');
        rec.onend = () => { btn.style.color = ''; };
        try { rec.start(); toast('Ouvindo...'); } catch (err) { btn.style.color = ''; }
      });
    });
  }

  /* ------------------------- badge PRO ------------------------------- */
  function initProBadge() {
    const version = $('.version-selector');
    if (!version || !S.pro) return;
    if (version.querySelector('.sk-badge-pro')) return;
    const badge = document.createElement('span');
    badge.className = 'sk-badge-pro';
    badge.textContent = 'PRO';
    badge.title = 'Recursos PRO desbloqueados neste clone';
    version.appendChild(badge);
  }

  /* --------------- widget de suporte embutido ------------------------ */
  function initSupportWidget() {
    const w = $('.support-widget');
    if (!w) return;
    w.classList.remove('sk-open');
    const toggle = (force) => {
      const isOpen = w.classList.contains('sk-open');
      const open = force === undefined ? !isOpen : force;
      w.classList.toggle('sk-open', open);
      if (open) closeDrawer();
    };
    $$('[aria-label="Suporte SKYNETchat"]').forEach((b) =>
      b.addEventListener('click', (e) => { e.preventDefault(); toggle(); })
    );
    const closer = w.querySelector('[aria-label="Fechar suporte"]');
    if (closer) closer.addEventListener('click', (e) => { e.preventDefault(); toggle(false); });
    window.__openSupport = () => toggle(true);
  }

  /* --------------- partículas de fundo (substitui particles.js) ------- */
  function initParticles() {
    const host = document.getElementById('particles-js');
    if (!host || host.querySelector('canvas')) return;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    host.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dots = [];
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    function resize() {
      w = host.clientWidth; h = host.clientHeight;
      canvas.width = w * DPR; canvas.height = h * DPR;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const n = Math.round(Math.min(90, (w * h) / 22000));
      dots = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.6 + 0.5, a: Math.random() * 0.5 + 0.15,
      }));
    }
    function accent() {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--sk-accent').trim();
      return v || '#ec1313';
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      const color = accent();
      for (const d of dots) {
        d.x += d.vx; d.y += d.vy;
        if (d.x < -10) d.x = w + 10; if (d.x > w + 10) d.x = -10;
        if (d.y < -10) d.y = h + 10; if (d.y > h + 10) d.y = -10;
        ctx.beginPath();
        ctx.globalAlpha = d.a * 0.55;
        ctx.fillStyle = color;
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 0.09;
      ctx.strokeStyle = accent();
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i], b = dots[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < 15000) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }
    resize();
    window.addEventListener('resize', resize);
    frame();
  }

  /* --------------------------- boot -------------------------------- */
  function renderLoggedState() {
    if (!S.logged) return;
    $$('button').forEach((b) => {
      const t = (b.textContent || '').replace(/\s+/g, ' ').trim();
      if (/^Fazer login$/i.test(t) || /Fazer login/i.test(b.getAttribute('aria-label') || '')) {
        b.innerHTML = b.innerHTML.replace(/Fazer login/i, 'Você');
        b.setAttribute('aria-label', 'Sua conta');
        b.addEventListener('click', (e) => {
          e.preventDefault();
          openPanel('settings');
        });
      }
    });
    if ($('[aria-label="Abrir painel lateral"]')) {
      const nav = $('.drawer-nav');
      if (nav && !$('[data-extras]', nav)) {
        const extra = document.createElement('div');
        extra.setAttribute('data-extras', '1');
        extra.className = 'space-y-[2px] pt-2';
        extra.innerHTML = `
          <button class="flex items-center gap-3 w-full px-2.5 py-2 rounded-xl text-left" style="background:transparent;color:#eee">
            <span style="font-size:16px">⚙️</span><span class="text-[13px]">Configurar IA</span>
          </button>
          <button class="flex items-center gap-3 w-full px-2.5 py-2 rounded-xl text-left" style="background:transparent;color:#eee">
            <span style="font-size:16px">🕘</span><span class="text-[13px]">Histórico</span>
          </button>`;
        nav.appendChild(extra);
        extra.children[0].addEventListener('click', () => { closeDrawer(); openPanel('settings'); });
        extra.children[1].addEventListener('click', () => { closeDrawer(); openPanel('history'); });
      }
    }
  }

  function initApp() {
    initComposer();
    initParticles();
    initSupportWidget();
    initVoice();
    initProBadge();
    wireDrawer();
    renderLoggedState();
    renderCredits();
    applyThemeOnly();
    ensureList();
    if (S.conversations.length && S.conversations.some((c) => c.messages.length)) {
      loadConv(S.currentId || S.conversations[0].id);
    }
    // chips de sugestão preenchem o composer
    $$('.chip-btn').forEach((chip) => {
      chip.addEventListener('click', () => {
        const label = (chip.textContent || '').replace(/\s+/g, ' ').trim();
        const ta = $('form textarea');
        if (!ta) return;
        ta.value = label;
        ta.dispatchEvent(new Event('input'));
        ta.focus();
      });
    });
    // modo (Rápido / MAX)
    const modeBtn = $('.composer-mode');
    if (modeBtn) {
      const MODES = ['Rápido', 'MAX', 'Pesquisa'];
      modeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const label = $('.composer-mode-label', modeBtn);
        if (!label) return;
        const i = MODES.indexOf(label.textContent.trim());
        const next = MODES[(i + 1) % MODES.length];
        label.textContent = next;
        modeBtn.dataset.mode = next;
        toast(next === 'MAX' ? '4.5 MAX desbloqueado' : 'Modo ' + next);
      });
      modeBtn.dataset.mode = 'Rápido';
    }
  }

  function applyThemeOnly() {
    const map = {
      black: ['#ec1313', '#000000'],
      carmim: ['#ff2d55', '#0d0505'],
      grafite: ['#22d3ee', '#0b0d10'],
      verde: ['#00ff41', '#030a06'],
    };
    const [ac, bg] = map[S.theme] || map.black;
    document.documentElement.style.setProperty('--sk-accent', ac);
    if (S.theme !== 'black') {
      document.body.style.background = bg;
      document.documentElement.style.background = bg;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.SKYNET = { send, openPanel, state: S, save };
    if (page === 'login') return initLogin();
    if (page === 'app') return initApp();
    applyThemeOnly();
  });
})();
