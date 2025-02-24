<img src="https://raw.githubusercontent.com/filipedeschamps/rss-feed-emitter/master/content/logo.gif">

# 🚀 Rocket Git Task

O **Rocket Git Task** é uma ferramenta de automação para gerenciar **tasks**, **deploys** e **releases** no Git de forma simplificada. Ele permite criar, enviar e finalizar tasks com comandos curtos e eficientes.

[![Versão Mais Recente](https://img.shields.io/github/release/tihhgoncalves/rocket-git-task.svg?style=flat)]()
[![Último Commit](https://img.shields.io/github/last-commit/tihhgoncalves/rocket-git-task.svg?style=flat)]()
[![Downloads Totais](https://img.shields.io/npm/dt/rocket-git-task.svg?style=flat)](https://www.npmjs.com/package/rocket-git-task)
[![Contribuidores do GitHub](https://img.shields.io/github/contributors/tihhgoncalves/rocket-git-task.svg?style=flat)]()
[![Licença MIT](https://img.shields.io/badge/Licença-MIT-yellow.svg)](https://opensource.org/licenses/)

---

## 🎯 Como Instalar

Instale o **Rocket Git Task** globalmente via **NPM**:

```sh
npm install -g rocket-git-task
```

Após a instalação, os comandos estarão disponíveis globalmente no terminal.

---

## 🚀 Como Usar

### 1️⃣ Inicializar o `git-task` no repositório

Antes de usar, é necessário configurar o fluxo do Git no seu projeto:

```sh
git task init
```

Ele perguntará quais branches você deseja usar para produção (`main` ou `master`) e homologação (`develop`, `dev`, etc.), e salvará essas configurações automaticamente.

---

### 2️⃣ Criar uma nova task

Cria um novo branch de **task** a partir do branch de homologação.

```sh
git task create nome-da-tarefa
```

Isso cria e muda para um branch chamado `task/nome-da-tarefa`.

---

### 3️⃣ Enviar uma task para homologação

Faz merge da task para o branch de homologação e faz o push automaticamente.

```sh
git task deploy homolog
```

---

### 4️⃣ Enviar uma task para produção

Faz merge do branch de homologação no branch de produção.

```sh
git task deploy production
```

---

### 5️⃣ Criar uma release

Cria uma nova versão no Git usando **`standard-version`**, gerando um **changelog** automaticamente.

```sh
git task release production  # Para produção
git task release homolog     # Para homologação
```

---

### **6️⃣ Finalizar uma task**

```sh
git task finish
```

Caso a task **ainda não tenha sido mergeada**, o comando avisará. Se quiser **forçar a exclusão**, use:

```sh
git task finish --force
```

Se a task ainda precisar ser enviada para homologação, o comando sugerirá:

```sh
git task deploy homolog
```

---

## 📌 **Sugestão de Scripts para Automatizar Comandos**

Para facilitar o uso do **Rocket Git Task** no seu projeto, adicione os seguintes scripts ao seu **`package.json`**:

```json
"scripts": {
  "gt:create": "git task create",
  "gt:deploy:homolog": "git task deploy homolog",
  "gt:deploy:production": "git task deploy production",
  "gt:release:homolog": "git task release homolog",
  "gt:release:production": "git task release production",
  "gt:finish": "git task finish"
}
```

Isso permite rodar os comandos diretamente com **`npm run`** ou **`yarn`**, por exemplo:

```sh
npm run gt:create minha-nova-task
npm run gt:deploy:homolog
npm run gt:release:production
```

Dessa forma, o fluxo de **criação, deploy e finalização** das tasks fica ainda mais prático! 🚀🔥

---

## ⚙️ Configuração

O `git-task` salva suas configurações diretamente no **`.git/config`**, evitando arquivos extras no repositório:

- **task.prod-branch**: Branch usado para produção (`main`, `master`, etc.).
- **task.dev-branch**: Branch usado para homologação (`develop`, `dev`, etc.).

Para redefinir a configuração, basta rodar:

```sh
git task init
```

---

## 👨‍💻 Mantenedor

Este projeto é orgulhosamente mantido pela **[Rocket Produtora Digital](https://www.produtorarocket.com)**.

## 📌 Contribuições

Nossa liga de super coders está sempre pronta para ação! 💥

- @tihhgoncalves 🚀 (O Mestre Jedi dos Códigos)

> Contribuições são sempre bem-vindas! Sinta-se à vontade para melhorar o código, documentação ou funcionalidades.

---

## 🔗 Autor

Criado por **[Tihh Gonçalves](https://github.com/tihhgoncalves)**.

[![Github](https://img.shields.io/badge/GitHub-181717.svg?style=for-the-badge&logo=GitHub&logoColor=white)](https://github.com/tihhgoncalves)
[![Telegram](https://img.shields.io/badge/Telegram-26A5E4.svg?style=for-the-badge&logo=Telegram&logoColor=white)](https://t.me/tihhgoncalves)

---

## 🛠 Suporte

Para relatar **bugs** ou solicitar novas funcionalidades, abra uma **[issue](https://github.com/tihhgoncalves/rocket-git-task/issues)** no GitHub.

---

## 📜 Histórico de Versões

Para ver todas as mudanças e melhorias, consulte o **[CHANGELOG.md](https://github.com/tihhgoncalves/rocket-git-task/blob/main/CHANGELOG.md)**.
