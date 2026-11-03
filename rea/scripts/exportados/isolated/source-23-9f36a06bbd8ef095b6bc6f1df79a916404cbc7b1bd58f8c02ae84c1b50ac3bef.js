
			// Reload can begin while the chat's JavaScript chunk is still loading.
			window.__skynetDocumentLeaving = false;
			const markDocumentLeaving = () => { window.__skynetDocumentLeaving = true; };
			window.addEventListener('beforeunload', markDocumentLeaving);
			window.addEventListener('pagehide', markDocumentLeaving);
			window.addEventListener('pageshow', event => {
				if (event.persisted) window.__skynetDocumentLeaving = false;
			});
		