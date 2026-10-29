# Agente Cloudflare Pages

Este repositório tem um agente personalizado e uma skill para ajudar a preparar e publicar o jogo no Cloudflare Pages:

- Agente para selecionar no chat do VS Code: [cloudflare-pages.agent.md](../../.github/agents/cloudflare-pages.agent.md)
- Skill carregada quando relevante: [SKILL.md](../../.github/skills/cloudflare-pages/SKILL.md)

## Como usar

1. Abra este repositório no VS Code.
2. Se o agente não aparecer no seletor do chat, execute **Developer: Reload Window** pela Paleta de Comandos (`Ctrl+Shift+P`).
3. Selecione **Cloudflare Pages** no seletor de agentes.
4. Peça, por exemplo: “Confira se o jogo está pronto para Cloudflare Pages e me guie na publicação pelo GitHub.”

O agente pode conferir e preparar os arquivos do projeto, mas você precisa autenticar sua conta e autorizar o repositório no painel Cloudflare. Ele não deve publicar, enviar commits ou alterar configurações da conta sem sua aprovação.
