#!/usr/bin/env bash
#
# Tempel link production ke catatan rilis GitHub.
#
# Dipanggil semantic-release lewat @semantic-release/exec (successCmd), jadi
# baru jalan SETELAH rilis benar-benar dibuat. Catatan rilis bawaan
# release-notes-generator cuma berisi daftar commit; orang yang buka halaman
# Releases nggak punya jalan ke aplikasi yang sudah tayang tanpa ini.
#
# Aman diulang: kalau penanda sudah ada, skrip berhenti tanpa mengubah apa pun.
set -euo pipefail

VERSION="${1:?versi wajib diisi, contoh: 1.25.0}"
TAG="v${VERSION}"
PROD_URL="https://financetracker.ryyarf.my.id"
MARKER="<!-- production-link -->"

BODY="$(gh release view "$TAG" --json body --jq '.body')"

if [[ "$BODY" == *"$MARKER"* ]]; then
  echo "Link production sudah ada di $TAG — dilewati."
  exit 0
fi

printf '%s\n\n---\n\n%s\n🌐 **Live:** %s\n' \
  "$BODY" "$MARKER" "$PROD_URL" | gh release edit "$TAG" --notes-file -

echo "Link production ditempel ke $TAG"
