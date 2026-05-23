param(
    [string]$RepoName = "hospital-fee-calc",
    [string]$Description = "Hospital and emergency room estimated cost calculator",
    [string]$RemoteName = "origin"
)

$ErrorActionPreference = "Stop"

function Get-GitHubToken {
    if ($env:GH_TOKEN) { return $env:GH_TOKEN }
    if ($env:GITHUB_TOKEN) { return $env:GITHUB_TOKEN }
    throw "GH_TOKEN 또는 GITHUB_TOKEN 환경 변수가 필요합니다. 깃허브 개인 접근 토큰을 설정한 뒤 다시 실행하세요."
}

function Invoke-GitHubApi {
    param(
        [string]$Method,
        [string]$Uri,
        [object]$Body = $null
    )

    $headers = @{
        Authorization = "Bearer $(Get-GitHubToken)"
        Accept = "application/vnd.github+json"
        "X-GitHub-Api-Version" = "2022-11-28"
        "User-Agent" = "MEDICost-local-sync"
    }

    if ($null -eq $Body) {
        return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $headers
    }

    return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $headers -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 10)
}

if (-not (Test-Path ".git")) {
    git init -b main
}

$user = Invoke-GitHubApi -Method "GET" -Uri "https://api.github.com/user"
$repoPayload = @{
    name = $RepoName
    description = $Description
    private = $true
    auto_init = $false
}

try {
    $repo = Invoke-GitHubApi -Method "POST" -Uri "https://api.github.com/user/repos" -Body $repoPayload
    Write-Host "비공개 저장소 생성 완료: $($repo.html_url)"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 422) {
        throw
    }

    $repo = Invoke-GitHubApi -Method "GET" -Uri "https://api.github.com/repos/$($user.login)/$RepoName"
    Write-Host "이미 존재하는 저장소 사용: $($repo.html_url)"
}

$remoteUrl = "https://github.com/$($user.login)/$RepoName.git"
$existingRemote = git remote get-url $RemoteName 2>$null

if ($LASTEXITCODE -eq 0 -and $existingRemote) {
    git remote set-url $RemoteName $remoteUrl
} else {
    git remote add $RemoteName $remoteUrl
}

Write-Host "$RemoteName 리모트 연결 완료: $remoteUrl"
