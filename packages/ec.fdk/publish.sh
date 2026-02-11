#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# 1. Bump version
CURRENT=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT"
read -rp "New version (or enter to skip): " NEW_VERSION

if [ -n "$NEW_VERSION" ]; then
  npm version "$NEW_VERSION" --no-git-tag-version
  echo "Bumped to $NEW_VERSION"
else
  NEW_VERSION="$CURRENT"
  echo "Keeping $CURRENT"
fi

# 2. Run tests
echo "Running tests..."
npm test

# 3. Regenerate docs
echo "Building docs..."
npm run docs

# 4. Commit + push
git add -A
git commit -m "v$NEW_VERSION"
git push

# 5. Publish (triggers prepublishOnly -> npm run build)
pnpm publish --no-git-checks
echo "Published ec.fdk@$NEW_VERSION"
