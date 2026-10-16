#!/usr/bin/env bash
# Bundles src/lambda.ts and uploads it to the existing `squadstat-tm-relay` Lambda.
set -euo pipefail

dir=$(mktemp -d)
bun build "$(dirname "$0")/src/lambda.ts" --target=node --format=esm --outfile="$dir/index.mjs"
(cd "$dir" && zip -q relay.zip index.mjs)
aws lambda update-function-code --region eu-central-1 --function-name squadstat-tm-relay \
  --zip-file "fileb://$dir/relay.zip" --query LastUpdateStatus --output text
