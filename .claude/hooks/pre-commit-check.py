#!/usr/bin/env python3
"""
Pre-commit security check hook for Claude Code.
Runs before git commit to detect sensitive information.
"""
import json
import sys
import subprocess
import re

SENSITIVE_PATTERNS = [
    r'password\s*=\s*["\'][^"\']+["\']',
    r'secret\s*=\s*["\'][^"\']+["\']',
    r'api[_-]?key\s*=\s*["\'][^"\']+["\']',
    r'token\s*=\s*["\'][^"\']+["\']',
    r'credential',
    r'private[_-]?key',
]

SENSITIVE_FILES = [
    '.env',
    'credentials',
    '.pem',
    '.key',
]

# Directories to skip security checks
SKIP_DIRECTORIES = [
    '.claude/',
]

def get_staged_files():
    """Get list of staged files."""
    try:
        result = subprocess.run(
            ['git', 'diff', '--cached', '--name-only'],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip().split('\n') if result.stdout.strip() else []
    except subprocess.CalledProcessError:
        return []

def check_sensitive_patterns(files):
    """Check for sensitive patterns in staged files."""
    issues = []

    for file in files:
        # Skip files in excluded directories
        if any(file.startswith(skip_dir) for skip_dir in SKIP_DIRECTORIES):
            continue
        # Check filename
        for pattern in SENSITIVE_FILES:
            if pattern in file.lower():
                issues.append(f"Sensitive file detected: {file}")

        # Check file content
        try:
            result = subprocess.run(
                ['git', 'diff', '--cached', '--', file],
                capture_output=True,
                text=True,
                check=True
            )
            content = result.stdout

            for pattern in SENSITIVE_PATTERNS:
                if re.search(pattern, content, re.IGNORECASE):
                    issues.append(f"Sensitive pattern in {file}: {pattern}")
        except subprocess.CalledProcessError:
            pass

    return issues

def main():
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})

    # Only check Bash commands
    if tool_name != "Bash":
        sys.exit(0)

    command = tool_input.get("command", "")

    # Only check git commit commands
    if "git commit" not in command:
        sys.exit(0)

    # Run security checks
    staged_files = get_staged_files()
    if not staged_files:
        sys.exit(0)

    issues = check_sensitive_patterns(staged_files)

    if issues:
        # Issues found - block the commit
        issue_list = "\n".join(f"  - {issue}" for issue in issues)
        output = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": f"Security check failed. Fix the following issues before committing:\n{issue_list}"
            }
        }
        print(json.dumps(output))
        sys.exit(0)

    # No issues - allow commit
    sys.exit(0)

if __name__ == "__main__":
    main()
