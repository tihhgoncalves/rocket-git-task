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
    read -p "Qual branch será usado para PRODUÇÃO? (padrão: main) " PROD_BRANCH
    PROD_BRANCH=${PROD_BRANCH:-main}

    read -p "Qual branch será usado para HOMOLOGAÇÃO? (padrão: develop) " DEV_BRANCH
    DEV_BRANCH=${DEV_BRANCH:-develop}

    git config task.prod-branch "$PROD_BRANCH"
    git config task.dev-branch "$DEV_BRANCH"
    
    if ! git show-ref --quiet refs/heads/"$DEV_BRANCH"; then
      git checkout -b "$DEV_BRANCH"
    fi

    if ! git show-ref --quiet refs/heads/"$PROD_BRANCH"; then
      git checkout -b "$PROD_BRANCH"
    fi

    git checkout "$DEV_BRANCH"
    ;;

  "create")
    load_config
    git checkout "$DEV_BRANCH" >/dev/null 2>&1
    git pull >/dev/null 2>&1
    git checkout -b task/$PARAM >/dev/null 2>&1
    ;;

  "deploy")
    load_config
    ORIGINAL_BRANCH=$(git branch --show-current)
    if [ "$PARAM" = "homolog" ]; then
      git checkout "$DEV_BRANCH" >/dev/null 2>&1
      git merge --no-ff --no-edit "$ORIGINAL_BRANCH" >/dev/null 2>&1
      git push >/dev/null 2>&1
    elif [ "$PARAM" = "production" ]; then
      git checkout "$PROD_BRANCH" >/dev/null 2>&1
      git merge --no-ff --no-edit "$DEV_BRANCH" >/dev/null 2>&1
      git push >/dev/null 2>&1
    fi
    git checkout "$ORIGINAL_BRANCH" >/dev/null 2>&1
    ;;

  "release")
    load_config
    if [ "$PARAM" = "production" ]; then
      TARGET_BRANCH="$PROD_BRANCH"
    elif [ "$PARAM" = "homolog" ]; then
      TARGET_BRANCH="$DEV_BRANCH"
    else
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
    ;;

  "finish")
    load_config
    CURRENT_BRANCH=$(git branch --show-current)
    git checkout "$DEV_BRANCH" >/dev/null 2>&1
    git pull >/dev/null 2>&1

    if git branch --merged | grep -q "$CURRENT_BRANCH"; then
      git branch -d "$CURRENT_BRANCH" >/dev/null 2>&1
      git push origin --delete "$CURRENT_BRANCH" >/dev/null 2>&1 || true
    else
      if [ "$PARAM" = "--force" ]; then
        git branch -D "$CURRENT_BRANCH" >/dev/null 2>&1
        git push origin --delete "$CURRENT_BRANCH" >/dev/null 2>&1 || true
      else
        git checkout "$CURRENT_BRANCH" >/dev/null 2>&1
        exit 1
      fi
    fi
    ;;

  *)
    exit 1
    ;;
esac
