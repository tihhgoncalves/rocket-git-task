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

### 4️⃣ Fazer deploy de uma task

Envie sua task para homologação, produção ou para um release específico:

```sh
git-task deploy homolog
git-task deploy production
git-task deploy 1.2.4-beta.2   # envia para a branch release/1.2.4-beta.2
```

---

### 5️⃣ Criar um release

Cria uma branch de release com a próxima versão e já gera a tag correspondente:

```sh
git-task release homolog      # cria release beta a partir do develop
git-task release production   # cria release estável a partir do main
```

Você pode definir o tipo de incremento de versão:

```sh
git-task release production --type major   # 1.6.4 → 2.0.0
git-task release production --type minor   # 1.6.4 → 1.7.0
git-task release production --type patch   # 1.6.4 → 1.6.5
```

---

### 6️⃣ Publicar um release

Dentro da branch de release, publique o conteúdo para o ambiente correto:

```sh
git-task release publish
```

Releases beta são mergeados no branch de homologação; releases estáveis vão para produção e também são sincronizados com homologação.

---

### 7️⃣ Finalizar um release

Após publicar, remova a branch de release:

```sh
git-task release finish
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