# Jogo da Forca

Jogo estático em HTML, CSS e JavaScript, com modo solo e partidas online para duas pessoas. O vocabulário é compartilhado entre o jogo e o servidor e contém palavras de 5 a 12 letras.

## Publicação do multiplayer na Cloudflare

O site pode continuar hospedado no Cloudflare Pages. As salas online precisam também de um Worker com Durable Objects:

1. Na raiz do projeto, autentique o Wrangler com `npx wrangler login`.
2. Publique o Worker com `npx wrangler deploy`. A configuração em `wrangler.toml` cria o vínculo e a migração SQLite para as salas.
3. Copie a URL pública do Worker e preencha `window.FORCA_MULTIPLAYER_URL` em `config.js`, por exemplo: `https://forca-multiplayer.seu-subdominio.workers.dev`.
4. Publique os arquivos estáticos no Cloudflare Pages, incluindo `config.js`, `words.js` e `script.js`.

Não coloque chaves ou tokens privados em `config.js`; o endereço público do Worker é a única configuração do navegador. O modo solo funciona sem Worker. Em uma sala online, cada pessoa entra com o mesmo código; um acerto mantém a vez do jogador e um erro passa a vez. Ao terminar a rodada, o resultado fica visível por três segundos e uma nova palavra começa automaticamente, alternando quem inicia.
