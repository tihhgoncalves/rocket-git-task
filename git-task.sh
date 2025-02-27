#!/bin/bash
set -e

VERSION=$(node -p "require('./package.json').version")

check_uncommitted_changes() {
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo ""
    echo ""
    echo "❌ Existem alterações não commitadas. Faça o commit ou stash antes de continuar."
    echo ""
    echo ""
    exit 1
  fi
}

load_config() {
  PROD_BRANCH=$(git config task.prod-branch)
  DEV_BRANCH=$(git config task.dev-branch)

  if [ -z "$PROD_BRANCH" ] || [ -z "$DEV_BRANCH" ]; then
    echo "❌ Configuração não encontrada! Execute 'git task init' primeiro."
    exit 1
  fi
}

show_help() {
  echo "Uso: git task [comando] [parâmetro]"
  echo ""
  echo "Comandos disponíveis:"
  echo "  init                Inicializa a configuração do Git Task"
  echo "  create <nome>       Cria uma nova task com o nome especificado"
  echo "  deploy <destino>    Envia a task para 'homolog' ou 'production'"
  echo "  release <destino>   Cria uma release para 'homolog' ou 'production'"
  echo "  finish [--force]    Finaliza a task atual, opcionalmente forçando a exclusão"
  echo "  -v, --version       Exibe a versão do script"
  echo "  -h, --help          Exibe esta mensagem de ajuda"
}

COMMAND=$1
PARAM=$2

case "$COMMAND" in
  "init")
    echo "🔧 Inicializando Git Task..."
    read -p "Qual branch será usado para PRODUÇÃO? (padrão: main) " PROD_BRANCH
    PROD_BRANCH=${PROD_BRANCH:-main}

    read -p "Qual branch será usado para HOMOLOGAÇÃO? (padrão: develop) " DEV_BRANCH
    DEV_BRANCH=${DEV_BRANCH:-develop}

    git config task.prod-branch "$PROD_BRANCH"
    git config task.dev-branch "$DEV_BRANCH"

    if ! git show-ref --quiet refs/heads/"$DEV_BRANCH"; then
      git checkout -b "$DEV_BRANCH" >/dev/null 2>&1
    fi

    if ! git show-ref --quiet refs/heads/"$PROD_BRANCH"; then
      git checkout -b "$PROD_BRANCH" >/dev/null 2>&1
    fi

    git checkout "$DEV_BRANCH" >/dev/null 2>&1
    echo "🎉 Git Task inicializado com sucesso!"
    ;;

  "create")
    load_config
    check_uncommitted_changes
    echo "📌 Criando task: $PARAM"
    git checkout "$DEV_BRANCH" >/dev/null 2>&1
    git pull >/dev/null 2>&1
    git checkout -b task/$PARAM >/dev/null 2>&1
    echo "✅ Task '$PARAM' criada com sucesso!"
    ;;

  "deploy")
    load_config
    check_uncommitted_changes
    ORIGINAL_BRANCH=$(git branch --show-current)
    if [ "$PARAM" = "homolog" ]; then
      echo "🚀 Enviando para homologação..."
      git checkout "$DEV_BRANCH" >/dev/null 2>&1
      git merge --no-ff --no-edit "$ORIGINAL_BRANCH" >/dev/null 2>&1
      git push >/dev/null 2>&1
    elif [ "$PARAM" = "production" ]; then
      echo "🚀 Enviando para produção..."
      git checkout "$PROD_BRANCH" >/dev/null 2>&1
      git merge --no-ff --no-edit "$DEV_BRANCH" >/dev/null 2>&1
      git push >/dev/null 2>&1
    else
      echo "❌ Destino inválido. Use 'homolog' ou 'production'."
      exit 1
    fi
    git checkout "$ORIGINAL_BRANCH" >/dev/null 2>&1
    echo "✅ Deploy concluído!"
    ;;

  "release")
    load_config
    check_uncommitted_changes
    if [ "$PARAM" = "production" ]; then
      TARGET_BRANCH="$PROD_BRANCH"
      echo "🔖 Criando release para PRODUÇÃO..."
    elif [ "$PARAM" = "homolog" ]; then
      TARGET_BRANCH="$DEV_BRANCH"
      echo "🔖 Criando release para HOMOLOGAÇÃO..."
    else
      echo "❌ Erro: Você deve especificar 'production' ou 'homolog'."
      exit 1
    fi

    ORIGINAL_BRANCH=$(git branch --show-current)
    git checkout "$TARGET_BRANCH" >/dev/null 2>&1
    git pull >/dev/null 2>&1

    if [ "$TARGET_BRANCH" = "$PROD_BRANCH" ]; then
      standard-version >/dev/null 2>&1 && git push >/dev/null 2>&1 && git push --tags >/dev/null 2>&1
      git checkout "$DEV_BRANCH" >/dev/null 2>&1
      git merge --no-ff --no-edit "$PROD_BRANCH" >/dev/null 2>&1
      git push >/dev/null 2>&1
    else
      standard-version --prerelease beta >/dev/null 2>&1 && git push >/dev/null 2>&1 && git push --tags >/dev/null 2>&1
    fi
    git checkout "$ORIGINAL_BRANCH" >/dev/null 2>&1
    echo "✅ Release concluída!"
    ;;

  "finish")
    load_config
    check_uncommitted_changes
    CURRENT_BRANCH=$(git branch --show-current)
    echo "✅ Finalizando a tarefa '$CURRENT_BRANCH'..."
    git checkout "$DEV_BRANCH" >/dev/null 2>&1
    git pull >/dev/null 2>&1

    if git branch --merged | grep -q "$CURRENT_BRANCH"; then
      git branch -d "$CURRENT_BRANCH" >/dev/null 2>&1
      git push origin --delete "$CURRENT_BRANCH" >/dev/null 2>&1 || true
      echo "🎉 Task finalizada e excluída com sucesso!"
    else
      if [ "$PARAM" = "--force" ]; then
        echo "⚠️ ATENÇÃO: A branch '$CURRENT_BRANCH' **NÃO FOI MERGEADA**, mas será excluída mesmo assim."
        git branch -D "$CURRENT_BRANCH" >/dev/null 2>&1
        git push origin --delete "$CURRENT_BRANCH" >/dev/null 2>&1 || true
        echo "✅ Task forçada e excluída com sucesso!"
    else
      echo ""
      echo "❌ A task '$CURRENT_BRANCH' ainda não foi integrada ao '$DEV_BRANCH'."
      echo ""
      echo "👉 Se quiser excluí-la mesmo assim, use:"
      echo "   git task finish --force"
      echo ""
      echo "👉 Ou envie ao '$DEV_BRANCH' usando:"
      echo "   git task deploy homolog"        
      echo ""
      git checkout "$CURRENT_BRANCH" >/dev/null 2>&1
      exit 1
      fi
    fi
    ;;

  "-v" | "--version")
    echo "Rocket Git Task v$VERSION"
    ;;

  "-h" | "--help")
    show_help
    ;;

  *)
    echo "❌ Comando desconhecido. Use: init, create, deploy, release, finish, -v ou -h."
    exit 1
    ;;
esac