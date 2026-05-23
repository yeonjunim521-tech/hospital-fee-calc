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

token="`$GH_TOKEN"
if [ -z "`$token" ]; then
  token="`$GITHUB_TOKEN"
fi

if [ -n "`$token" ]; then
  encoded=`$(printf "x-access-token:%s" "`$token" | base64)
  git -c "http.https://github.com/.extraheader=AUTHORIZATION: basic `$encoded" push -u $RemoteName "`$branch"
else
  git push -u $RemoteName "`$branch"
fi
"@

Set-Content -Path $hookPath -Value $hook -Encoding ASCII
Write-Host "커밋 후 자동 푸시 훅 설치 완료: $hookPath"
