# REA — análise do skynetchat.net

Saída do pipeline do [REA](https://github.com/morluto/rea) (`rea-agents` 6.8.0) contra o site
no ar. Complementa a extração de bundles em [`../frontend/`](../frontend/).

| arquivo | conteúdo |
|---|---|
| [`RELATORIO.md`](RELATORIO.md) | relatório técnico completo: pipeline, resultados, endpoints, limites |
| [`evidencias/web-bundle.evidence.json`](evidencias/web-bundle.evidence.json) | análise de bundle: 54 scripts, 42 endpoints com posição, grafo de chunks |
| [`evidencias/inspect-page.evidence.json`](evidencias/inspect-page.evidence.json) | inspeção passiva: DOM, acessibilidade, rede, console, storage, scripts |
| [`evidencias/export-scripts.json`](evidencias/export-scripts.json) | manifesto da exportação dos scripts do navegador |
| [`evidencias/resumo-grafo.json`](evidencias/resumo-grafo.json) | grafo de aplicação compactado: 90 endpoints, 14 chaves de storage, arquivos |
| [`evidencias/endpoints-com-posicao.json`](evidencias/endpoints-com-posicao.json) | tabela endpoint → detecção → script → linha |
| [`evidencias/home-1399x812.png`](evidencias/home-1399x812.png) | screenshot da home capturado via CDP |
| [`evidencias/webmcp.evidence.json`](evidencias/webmcp.evidence.json) | descoberta de WebMCP (nenhuma ferramenta declarada) |
| [`scripts/`](scripts/) | 49 scripts exportados do navegador + `manifest.json` com sha256 |

Reproduzir (Chrome headful em Xvfb, CDP na 9225):

```bash
rea list-browser-targets http://127.0.0.1:9225
rea analyze-web-bundle http://127.0.0.1:9225 <targetId> --fetch-source-maps \
  --evidence_output evidencias/web-bundle.evidence.json --detail summary \
  --view '{"kind":"javascript-routes","collection":"routes","limit":200}'
rea inspect-web-page http://127.0.0.1:9225 <targetId> --include-script-sources \
  --include-storage-keys --include-console-text > evidencias/inspect-page.evidence.json
rea export-web-scripts "$PWD/evidencias/inspect-page.evidence.json" "$PWD/exported"
rea analyze-javascript-application "$PWD/exported/files"
```

Estado logado não foi capturado: o Cloudflare Turnstile não emite token em navegador
automatizado e burlar isso está fora de escopo. Detalhes na seção 8 do relatório.
