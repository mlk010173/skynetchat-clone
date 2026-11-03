
			// Desregistra service workers existentes (não precisamos de offline)
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.getRegistrations().then(regs => {
					regs.forEach(reg => reg.unregister());
				});
				// Limpa caches do service worker
				if ('caches' in window) {
					caches.keys().then(keys => {
						keys.forEach(key => caches.delete(key));
					});
				}
			}

			// Auto-reload em caso de chunk 404 durante deploy (com proteção anti-loop)
			const RELOAD_KEY = 'chunk-reload-count';
			const MAX_RELOADS = 2;
			const RELOAD_WINDOW = 30000; // 30 segundos

			function canReload() {
				const data = sessionStorage.getItem(RELOAD_KEY);
				if (!data) return true;

				const { count, firstAttempt } = JSON.parse(data);
				const elapsed = Date.now() - firstAttempt;

				// Reset contador após 30 segundos
				if (elapsed > RELOAD_WINDOW) {
					sessionStorage.removeItem(RELOAD_KEY);
					return true;
				}

				// Permite até 2 reloads em 30 segundos
				return count < MAX_RELOADS;
			}

			async function handleChunkError() {
				if (canReload()) {
					const data = sessionStorage.getItem(RELOAD_KEY);
					const count = data ? JSON.parse(data).count + 1 : 1;
					const firstAttempt = data ? JSON.parse(data).firstAttempt : Date.now();

					sessionStorage.setItem(RELOAD_KEY, JSON.stringify({ count, firstAttempt }));

					// LIMPAR TODO O CACHE antes de recarregar
					try {
						// 1. Desregistrar service workers
						if ('serviceWorker' in navigator) {
							const registrations = await navigator.serviceWorker.getRegistrations();
							await Promise.all(registrations.map(reg => reg.unregister()));
						}

						// 2. Limpar todos os caches
						if ('caches' in window) {
							const cacheNames = await caches.keys();
							await Promise.all(cacheNames.map(name => caches.delete(name)));
						}
					} catch (e) {
						console.error('❌ Erro ao limpar cache:', e);
					}

					// 3. Hard reload com delay maior para PM2 estabilizar
					// Primeira tentativa: 2s de delay
					// Segunda tentativa: 5s de delay (PM2 reload pode demorar)
					const delay = count === 1 ? 2000 : 5000;

					setTimeout(() => {
						// CRITICAL: Forçar bypass TOTAL do cache HTTP disk
						// Adicionar timestamp único força navegador a ignorar cache disk
						const url = new URL(window.location.href);
						// Remove query params antigos de reload
						url.searchParams.delete('_r');
						// Adiciona novo timestamp único
						url.searchParams.set('_r', Date.now() + '_' + Math.random().toString(36).slice(2));

						// location.replace não mantém histórico e força hard reload
						window.location.replace(url.href);
					}, delay);
				} else {
					console.error('❌ Muitos erros de chunk. Recarregue manualmente a página.');
					// Mostra mensagem ao usuário
					document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0a0a0a;color:#fff;font-family:sans-serif;text-align:center;padding:20px;"><div><h1 style="font-size:24px;margin-bottom:10px;">🔄 Atualização em andamento</h1><p style="opacity:0.7;">Por favor, recarregue a página manualmente (Ctrl+Shift+R ou Cmd+Shift+R)</p><button onclick="location.reload(true)" style="margin-top:20px;padding:12px 24px;background:#C41E3A;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:16px;">Recarregar agora</button></div></div>';
				}
			}

			window.addEventListener('error', (event) => {
				if (event.message &&
					(event.message.includes('Failed to fetch dynamically imported module') ||
					 event.message.includes('/_app/immutable/'))) {
					handleChunkError();
				}
			}, true);

			window.addEventListener('unhandledrejection', (event) => {
				if (event.reason?.message &&
					(event.reason.message.includes('Failed to fetch dynamically imported module') ||
					 event.reason.message.includes('/_app/immutable/'))) {
					handleChunkError();
				}
			});
		