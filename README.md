# Git Task 🚀

Automação de fluxo de trabalho no Git para tasks, deploy e releases.

## Instalação

1. Clone o repositório:
   ```
   git clone https://github.com/seu-usuario/git-task.git
   ```
2. Torne o script executável:
   ```
   chmod +x git-task.sh
   ```
3. Adicione o script ao seu PATH para rodar globalmente:
   ```
   sudo mv git-task.sh /usr/local/bin/git-task
   ```

## Como usar?

- Criar uma nova task:
  ```
  git task create mudar-icone
  ```
- Enviar para homologação:
  ```
  git task deploy homolog
  ```
- Enviar para produção:
  ```
  git task deploy production
  ```
- Criar release:
  ```
  git task release production
  ```
- Finalizar uma task:
  ```
  git task finish
  ```
- Forçar a finalização da task:
  ```
  git task finish --force
  ```

## Contribuindo

Pull requests são bem-vindos! 🎉
