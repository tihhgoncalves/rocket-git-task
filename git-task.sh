#!/bin/bash
set -e

load_config() {
  PROD_BRANCH=$(git config task.prod-branch)
  DEV_BRANCH=$(git config task.dev-branch)

  if [ -z "$PROD_BRANCH" ] || [ -z "$DEV_BRANCH" ]; then
    echo "❌ Configuração não encontrada! Execute 'git task init' primeiro."
    exit 1
  fi
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

    echo "✅ Configuração salva! Produção: '$PROD_BRANCH', Homologação: '$DEV_BRANCH'."
    
    if ! git show-ref --quiet refs/heads/"$DEV_BRANCH"; then
      echo "⚙️ Criando branch de homologação: $DEV_BRANCH..."
      git checkout -b "$DEV_BRANCH"
    else
      echo "✅ Branch de homologação '$DEV_BRANCH' já existe."
    fi

    if ! git show-ref --quiet refs/heads/"$PROD_BRANCH"; then
      echo "⚙️ Criando branch de produção: $PROD_BRANCH..."
      git checkout -b "$PROD_BRANCH"
    else
      echo "✅ Branch de produção '$PROD_BRANCH' já existe."
    fi

    git checkout "$DEV_BRANCH"
    echo "🎉 Git Task inicializado com sucesso!"
    ;;

  "create")
    load_config
    echo "📌 Criando task: $PARAM"
    git checkout "$DEV_BRANCH"
    git pull
    git checkout -b task/$PARAM
    ;;

  "deploy")
    load_config
    ORIGINAL_BRANCH=$(git branch --show-current)
    if [ "$PARAM" = "homolog" ]; then
      echo "🚀 Enviando para homologação..."
      git checkout "$DEV_BRANCH"
      git merge --no-ff --no-edit "$ORIGINAL_BRANCH"
      git push
    elif [ "$PARAM" = "production" ]; then
      echo "🚀 Enviando para produção..."
      git checkout "$PROD_BRANCH"
      git merge --no-ff --no-edit "$DEV_BRANCH"
      git push
    else
      echo "❌ Destino inválido. Use 'homolog' ou 'production'."
      exit 1
    fi
    git checkout "$ORIGINAL_BRANCH"
    ;;

  "release")
    load_config
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
    git checkout "$TARGET_BRANCH"
    git pull

    if [ "$TARGET_BRANCH" = "$PROD_BRANCH" ]; then
      standard-version && git push && git push --tags
      echo "🔄 Atualizando develop com o release da produção..."
      git checkout "$DEV_BRANCH"
      git merge --no-ff --no-edit "$PROD_BRANCH"
      git push
    else
      standard-version --prerelease beta && git push && git push --tags
    fi

    git checkout "$ORIGINAL_BRANCH"
    echo "✅ Release concluída. Voltando para '$ORIGINAL_BRANCH'."
    ;;

  "finish")
    load_config
    CURRENT_BRANCH=$(git branch --show-current)

    if [[ "$CURRENT_BRANCH" != task/* ]]; then
      echo "❌ Você só pode finalizar uma task estando em uma branch 'task/*'."
      exit 1
    fi

    echo "✅ Finalizando a tarefa '$CURRENT_BRANCH'..."
    git checkout "$DEV_BRANCH"
    git pull

    if git branch --merged | grep -q "$CURRENT_BRANCH"; then
      git branch -d "$CURRENT_BRANCH"
      git push origin --delete "$CURRENT_BRANCH" || echo "⚠️ Nenhuma branch remota para excluir."
      echo "🎉 Task finalizada e excluída com sucesso!"
    else
      if [ "$PARAM" = "--force" ]; then
        echo "⚠️ ATENÇÃO: A branch '$CURRENT_BRANCH' **NÃO FOI MERGEADA**, mas será excluída mesmo assim."
        git branch -D "$CURRENT_BRANCH"
        git push origin --delete "$CURRENT_BRANCH" || echo "⚠️ Nenhuma branch remota para excluir."
        echo "✅ Task forçada e excluída com sucesso!"
      else
        echo "❌ A task '$CURRENT_BRANCH' ainda não foi integrada ao '$DEV_BRANCH'."
        echo "👉 Se quiser excluí-la mesmo assim, use:"
        echo "   git task finish --force"
        git checkout "$CURRENT_BRANCH"
        exit 1
      fi
    fi
    ;;

  *)
    echo "❌ Comando desconhecido. Use: init, create, deploy, release ou finish."
    exit 1
    ;;
esac