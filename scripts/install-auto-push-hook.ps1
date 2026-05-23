param(
    [string]$RemoteName = "origin"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path ".git")) {
    throw "깃 저장소가 아닙니다. 먼저 git init 실행 필요."
}

$hookDir = Join-Path ".git" "hooks"
$hookPath = Join-Path $hookDir "post-commit"

$hook = @"
#!/bin/sh
branch=`$(git branch --show-current)
if [ -z "`$branch" ]; then
  branch="main"
fi

if ! git remote get-url $RemoteName >/dev/null 2>&1; then
  echo "auto push skipped: $RemoteName remote missing"
  exit 0
fi

git push -u $RemoteName "`$branch"
"@

Set-Content -Path $hookPath -Value $hook -Encoding ASCII
Write-Host "커밋 후 자동 푸시 훅 설치 완료: $hookPath"
