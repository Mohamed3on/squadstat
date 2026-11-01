#!/usr/bin/env bash
# Moves the refresh flows' data files (scripts/outputs.ts) between data/ and the site's data
# bucket, through custom-worker.ts's /_data door. Nothing is committed: the site reads the
# bucket (lib/data.ts), so a refresh never redeploys it.
#   data-sync.sh pull         every flow's files into data/: the baseline each refresh reads
#                             and compares against (the minutes-regression gate among them)
#   data-sync.sh push <flow>  publish that flow's files that changed since the pull
set -euo pipefail

: "${DATA_SECRET:?DATA_SECRET is not set}"
# workers.dev, not squadstat.com: the zone's bot rules never see it.
url="${DATA_URL:-https://squadstat.mohamed3on.workers.dev}/_data"
baseline="${RUNNER_TEMP:-/tmp}/data-baseline"
auth=(-H "Authorization: Bearer $DATA_SECRET")

case "${1:-}" in
  pull)
    mkdir -p data "$baseline"
    for f in $(bun run scripts/outputs.ts all); do
      curl -sS --fail-with-body --retry 3 "${auth[@]}" -o "$f" "$url/$(basename "$f")"
      cp "$f" "$baseline/"
    done
    echo "Pulled $(bun run scripts/outputs.ts all | wc -w | tr -d ' ') data files."
    ;;
  push)
    read -ra files <<< "$(bun run scripts/outputs.ts "${2:?flow}")"
    # Data before stamps, so a page never shows a new stamp over the old data.
    ordered=()
    for f in "${files[@]}"; do [[ "$f" == *.json ]] && ordered+=("$f"); done
    for f in "${files[@]}"; do [[ "$f" == *.json ]] || ordered+=("$f"); done
    published=0
    for f in "${ordered[@]}"; do
      old="$baseline/$(basename "$f")"
      cmp -s "$f" "$old" && continue
      # Refuse to shrink a non-trivial JSON file to a stub (<200 bytes): a script that wrote
      # empty results after its fetches all failed.
      new_size=$(wc -c < "$f" | tr -d ' ')
      old_size=$( (wc -c < "$old" 2>/dev/null || echo 0) | tr -d ' ')
      if [[ "$f" == *.json ]] && [ "$new_size" -lt 200 ] && [ "$old_size" -gt 1000 ]; then
        echo "Refusing to shrink $f from $old_size to $new_size bytes — looks like an empty/stub write."
        exit 1
      fi
      curl -sS --fail-with-body --retry 3 "${auth[@]}" -X PUT --data-binary "@$f" \
        "$url/$(basename "$f")" > /dev/null
      echo "Published $f ($new_size bytes)."
      published=$((published + 1))
    done
    echo "$published of ${#files[@]} files changed."
    ;;
  *)
    echo "usage: data-sync.sh pull | push <flow>" >&2
    exit 2
    ;;
esac
