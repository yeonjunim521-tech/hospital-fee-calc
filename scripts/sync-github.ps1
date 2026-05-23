param(
    [string]$Message = "chore: sync project updates",
    [string]$RemoteName = "origin"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path ".git")) {
    git init -b main
}

$branch = git branch --show-current
if (-not $branch) {
    $branch = "main"
    git checkout -B $branch
}

$remoteUrl = git remote get-url $RemoteName 2>$null
if ($LASTEXITCODE -ne 0 -or -not $remoteUrl) {
    throw "$RemoteName 리모트가 없습니다. 먼저 scripts\create-private-github-repo.ps1을 실행하거나 git remote add $RemoteName <저장소주소>를 실행하세요."
}

git add -A

$pending = git status --porcelain
if ($pending) {
    git commit -m $Message
} else {
    Write-Host "커밋할 변경사항이 없습니다."
}

git push -u $RemoteName $branch
Write-Host "깃허브 동기화 완료: $RemoteName/$branch"
