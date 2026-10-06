#!/usr/bin/env bash
# Usage: ./scripts/setup_github.sh aegisai [public|private]
# Requires: git, GitHub CLI (https://cli.github.com) and `gh auth login` done once.
set -euo pipefail
cd "$(dirname "$0")/.."

NAME="${1:-aegisai}"
VIS="${2:-public}"

command -v gh >/dev/null || { echo "Install GitHub CLI first: https://cli.github.com"; exit 1; }
gh auth status >/dev/null || { echo "Run: gh auth login"; exit 1; }

# 1. git + repo
[ -d .git ] || git init -b main
git add -A && git commit -m "chore: initial scaffold, AGENTS.md and docs templates" || true
gh repo create "$NAME" --"$VIS" --source=. --remote=origin --push \
  --description "AegisAI - AI Trust, Risk & Compliance Auditor: a cybersecurity scanner, but for AI systems"
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Repo: $REPO"

# 2. labels
mk() { gh label create "$1" --color "$2" --description "$3" --force >/dev/null; }
mk foundation 5C1A2B "Project skeleton"
mk setup 5C1A2B "Setup"
mk module:M1 1D76DB "Intake"
mk module:M2 0E8A16 "Data & model risk"
mk module:M3 D93F0B "Security & explainability"
mk module:M4 5319E7 "Governance mapping"
mk module:M5 FBCA04 "Scoring, dashboard, reporting"
mk backend C5DEF5 "Backend / API"
mk frontend BFD4F2 "UI"
mk ml F9D0C4 "ML service"
mk security B60205 "Security testing"
mk documentation 0075CA "Docs (required per module)"
mk integration 006B75 "Integration"
mk testing 0E8A16 "Testing"
mk deployment 7057FF "Deployment"
mk devops 7057FF "DevOps"

# 3. milestones
for m in "F0 - Foundation" "M1 - Intake" "M2 - Data & Model Risk" "M3 - Security & Explainability" \
         "M4 - Governance Mapping" "M5 - Scoring, Dashboard & Reporting" "F1 - Integration & Release"; do
  gh api "repos/$REPO/milestones" -f title="$m" >/dev/null
done

# 4. issues (numeric order)
for f in issues/*.md; do
  title=$(grep -m1 '^title:' "$f" | sed 's/^title: *//')
  labels=$(grep -m1 '^labels:' "$f" | sed 's/^labels: *//')
  milestone=$(grep -m1 '^milestone:' "$f" | sed 's/^milestone: *//')
  awk 'BEGIN{c=0} /^---$/{c++; next} c>=2{print}' "$f" > /tmp/issue_body.md
  args=(--title "$title" --body-file /tmp/issue_body.md --milestone "$milestone")
  IFS=',' read -ra L <<< "$labels"
  for l in "${L[@]}"; do args+=(--label "$l"); done
  gh issue create "${args[@]}"
  sleep 1
done
echo "Done. Open https://github.com/$REPO/issues"
