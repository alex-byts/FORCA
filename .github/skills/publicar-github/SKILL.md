---
name: publicar-github
description: "Review and publish repository changes to GitHub with Git. Use when asked to send, commit, push, or publish files to the configured remote."
---

# Publicar alterações no GitHub

Use este fluxo para preparar e enviar alterações solicitadas pelo usuário ao GitHub, sem incluir arquivos por acidente.

## 1. Conferir o repositório

1. Verifique a branch atual, os remotes configurados e o `git status`.
2. Examine as diferenças staged e unstaged e liste arquivos não rastreados.
3. Identifique quais alterações fazem parte do pedido atual. Preserve outras alterações do usuário.
4. Confirme se o destino e a branch são os esperados; não troque o remote ou a branch por conta própria.

## 2. Revisar e preparar

1. Adicione somente caminhos específicos que o usuário autorizou. Não use `git add .` nem `git add -A`.
2. Revise o diff staged completo antes de criar o commit.
3. Não inclua arquivos gerados, mudanças preexistentes não relacionadas ou arquivos de credenciais.
4. Se houver conteúdo que pareça segredo, pare sem revelar seu valor e avise qual arquivo precisa de atenção.
5. Resuma os arquivos e proponha uma mensagem de commit. Peça confirmação antes de criar o commit e enviar.

## 3. Commit e push

Depois da confirmação explícita:

1. Crie um novo commit; nunca altere um commit anterior.
2. Envie para o remote e a branch configurados, sem force push.
3. Verifique o resultado do push e informe a branch e o hash do commit.

Se a autenticação falhar, não peça tokens no chat. Oriente o usuário a configurar a autenticação segura do GitHub no próprio ambiente. Se houver divergência ou conflito com o remoto, não faça reset, rebase destrutivo nem force push; explique o bloqueio e peça instruções.
