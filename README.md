<img src="https://raw.githubusercontent.com/filipedeschamps/rss-feed-emitter/master/content/logo.gif">

# 🚀 Rocket Git Task

O **Rocket Git Task** organiza e agiliza o fluxo de tarefas no Git, conectando desenvolvimento, homologação e produção de forma simples e eficiente.

[![Versão Mais Recente](https://img.shields.io/github/release/tihhgoncalves/rocket-git-task.svg?style=flat)]()
[![Último Commit](https://img.shields.io/github/last-commit/tihhgoncalves/rocket-git-task.svg?style=flat)]()
[![Downloads Totais](https://img.shields.io/npm/dt/rocket-git-task.svg?style=flat)](https://www.npmjs.com/package/rocket-git-task)
[![Contribuidores do GitHub](https://img.shields.io/github/contributors/tihhgoncalves/rocket-git-task.svg?style=flat)]()
[![Licença MIT](https://img.shields.io/badge/Licença-MIT-yellow.svg)](https://opensource.org/licenses/)

---

## 📥 Instalação

Instale globalmente via NPM:

```sh
npm install -g rocket-git-task
```

Após a instalação, o comando `git-task` estará disponível no terminal.

---

## 📚 Comandos Disponíveis

### 1️⃣ Inicializar o Rocket Git Task

Configura o repositório informando as branches de **produção** e **homologação**:

```sh
git-task init
```

---

### 2️⃣ Criar uma nova task

Cria um novo branch de task a partir da branch de homologação e já muda para ele:

```sh
git-task create nome-da-tarefa
```

Exemplo: Cria a branch `task/nome-da-tarefa`.

---

### 3️⃣ Atualizar uma task com o último develop

Se sua task está em andamento e você quer trazer as últimas atualizações do `develop` para ela:

```sh
git-task update
```

---

### 4️⃣ Criar uma release

Gera uma nova branch de release baseada na branch de destino (produção ou homologação):

```sh
git-task release production   # Cria um release para produção (ex: release/1.2.3)
git-task release homolog      # Cria um release para homologação/beta (ex: release/1.2.3-beta.1)
```

**Opcionalmente, você pode definir o tipo de incremento de versão**:

```sh
git-task release production --type major   # 1.6.4 → 2.0.0
git-task release production --type minor   # 1.6.4 → 1.7.0
git-task release production --type patch   # 1.6.4 → 1.6.5
```

Se for um release de **homologação**, ele será marcado como **beta** (`1.6.4-beta.1`, `1.6.4-beta.2`).

---

### 5️⃣ Fazer deploy de uma task para um release

Agora, o deploy é feito diretamente para uma branch de release específica (e não mais para develop/main):

```sh
git-task deploy 1.2.3         # Faz deploy da task para release/1.2.3
git-task deploy 1.2.3-beta.1  # Faz deploy da task para release/1.2.3-beta.1
```

---

### 6️⃣ Publicar um release

Depois de testar e aprovar o release, publique-o para a branch de destino (main ou develop):

```sh
# Estando na branch release/1.2.3 ou release/1.2.3-beta.1
git-task release publish
```

- Se for um release de produção, além de publicar na main, o develop será sincronizado automaticamente com as novidades da produção.

---

### 7️⃣ Homologação Rápida (Quick Homolog)

Se você quer fazer uma homologação rapidinho de uma task, sem ficar executando vários comandos, use:

```sh
git-task quick-homolog
```

**O que isso faz automaticamente (enquanto você está na task):**

1. ✅ Cria um release para homologação (ex: `release/1.2.3-beta.1`)
2. ✅ Faz deploy da task para esse release
3. ✅ Publica o release em `develop`
4. ✅ Deleta a branch de release
5. ✅ Volta para sua task original

**Se você quer manter a branch de release** (sem deletar), use:

```sh
git-task quick-homolog --no-finish
```

---

### 8️⃣ Finalizar uma task

```sh
git-task finish
```

Se a task não tiver sido mergeada, ele avisa. Para forçar a finalização (apagando mesmo sem merge), use:

```sh
git-task finish --force
```

---

### 9️⃣ Versão e Ajuda

Para exibir a versão atual:

```sh
git-task -v
```

Para exibir todos os comandos:

```sh
git-task -h
```

---

## ⚙️ Configuração

O Rocket Git Task salva suas configurações diretamente no seu **`.git/config`**, sem arquivos extras no repositório:

- `task.prod-branch`: Branch de produção (ex: `main` ou `master`).
- `task.dev-branch`: Branch de homologação (ex: `develop`).

Para redefinir a configuração, basta rodar:

```sh
git-task init
```

---

## 🙌 Contribuições

Contribuições são sempre bem-vindas! Se quiser sugerir melhorias ou reportar problemas, basta abrir uma [issue](https://github.com/tihhgoncalves/rocket-git-task/issues).

---

## 👨‍💻 Mantenedor

O Rocket Git Task é mantido com carinho por:

- [@tihhgoncalves](https://github.com/tihhgoncalves)

---

## 🔗 Redes e Contato

[![GitHub](https://img.shields.io/badge/GitHub-181717.svg?style=for-the-badge&logo=GitHub&logoColor=white)](https://github.com/tihhgoncalves)
[![Telegram](https://img.shields.io/badge/Telegram-26A5E4.svg?style=for-the-badge&logo=Telegram&logoColor=white)](https://t.me/tihhgoncalves)

---

## 🚀 Rocket Produtora Digital

Criado com ♥ pela [Rocket Produtora Digital](https://www.produtorarocket.com)