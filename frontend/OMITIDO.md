# Um arquivo não foi publicado (credencial embutida)

`_app/immutable/nodes/16.DrcJp8ja.js` — a página **/politicos** (dossiê/OSINT) — **não está no
repositório público**.

Motivo: o módulo carrega embutido um token **Mapbox** (`pk.…`, 94 caracteres). O GitHub bloqueia o
envio por varredura de segredos, e publicar uma credencial num repositório aberto não é aceitável.
O arquivo permanece apenas na extração local. Nenhum outro arquivo do front-end tem segredo.

Recomendação para o dono do app: tokens `pk.` são de uso no cliente, mas devem ser restritos por URL
no painel do Mapbox; o ideal é injetá-lo em build time (`$env/static/public`) ou por restrição de
referenciador, e rotacionar o atual já que ele esteve em bundle distribuído.
