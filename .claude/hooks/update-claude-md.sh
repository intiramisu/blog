#!/bin/bash
# Pre-commit hook to update CLAUDE.md's Last updated date
# Only updates if CLAUDE.md is already staged for commit
#
# Setup:
#   ln -sf ../../.claude/hooks/update-claude-md.sh .git/hooks/pre-commit

CLAUDE_MD="CLAUDE.md"

# Check if CLAUDE.md is staged for commit
if ! git diff --cached --name-only | grep -q "^${CLAUDE_MD}$"; then
    exit 0
fi

# Get today's date
TODAY=$(date +%Y-%m-%d)

# Update Last updated line
if grep -q "^> Last updated:" "$CLAUDE_MD"; then
    sed -i "s/^> Last updated:.*$/> Last updated: $TODAY/" "$CLAUDE_MD"
    git add "$CLAUDE_MD"
fi
