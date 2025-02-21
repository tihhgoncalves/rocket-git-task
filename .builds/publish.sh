#!/bin/bash
set -e  # Para encerrar o script em caso de erro

# Verifica se está no branch main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "❌ Você precisa estar no branch 'main' para publicar no NPM."
  exit 1
fi

echo "🔄 Atualizando repositório..."
git pull origin main

echo "📡 Enviando tags para o repositório..."
git push origin --tags

echo "📦 Publicando no NPM..."
npm publish --access public

echo "✅ Publicação concluída com sucesso!"
