#!/usr/bin/env bash
set -euo pipefail

repo="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"

gh pr list --repo "$repo" --state open --json number,reviewDecision,title,url --jq '.[] | "\(.number)\t\(.reviewDecision // "PENDING")\t\(.title)\t\(.url)"'
