#!/bin/bash
set -e

COMMAND=$1
PARAM=$2

CURRENT_BRANCH=$(git branch --show-current)

case "$COMMAND" in
  "create")
    echo "📌 Criando task: $PARAM"
    git checkout develop
    git pull
    git checkout -b task/$PARAM
    ;;
  
  "deploy")
    if [ "$PARAM" = "homolog" ]; then
      echo "🚀 Enviando para homologação..."
      git checkout develop
      git merge --no-ff --no-edit "$CURRENT_BRANCH"
      git push
      git checkout "$CURRENT_BRANCH"
    elif [ "$PARAM" = "production" ]; then
      echo "🚀 Enviando para produção..."
      git checkout main
      git merge --no-ff --no-edit develop
      git push
      git checkout "$CURRENT_BRANCH"
    else
      echo "❌ Destino inválido. Use 'homolog' ou 'production'."
      exit 1
    fi
    ;;

  "release")
    if [ "$PARAM" = "production" ]; then
      TARGET_BRANCH="main"
      echo "🔖 Criando release para PRODUÇÃO..."
    elif [ "$PARAM" = "homolog" ]; then
      TARGET_BRANCH="develop"
      echo "🔖 Criando release para HOMOLOGAÇÃO..."
    else
      echo "❌ Erro: Você deve especificar 'production' ou 'homolog'."
      exit 1
    fi

    ORIGINAL_BRANCH=$(git branch --show-current)
    git checkout "$TARGET_BRANCH"
    git pull

    if [ "$TARGET_BRANCH" = "main" ]; then
      standard-version && git push && git push --tags
    else
      standard-version --prerelease beta && git push && git push --tags
    fi

    git checkout "$ORIGINAL_BRANCH"
    echo "✅ Release concluída. Voltando para '$ORIGINAL_BRANCH'."
    ;;

  "finish")
    if [[ "$CURRENT_BRANCH" != task/* ]]; then
      echo "❌ Você só pode finalizar uma task estando em uma branch 'task/*'."
      exit 1
    fi

    echo "✅ Finalizando a tarefa '$CURRENT_BRANCH'..."
    
    git checkout develop
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
        echo "❌ A task '$CURRENT_BRANCH' ainda não foi integrada ao develop."
        echo "👉 Se quiser excluí-la mesmo assim, use:"
        echo "   git task finish --force"
        git checkout "$CURRENT_BRANCH"
        exit 1
      fi
    fi
    ;;

  *)
    echo "❌ Comando desconhecido. Use: create, deploy, release ou finish."
    exit 1
    ;;
esac
