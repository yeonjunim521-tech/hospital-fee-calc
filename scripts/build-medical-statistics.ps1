param(
  [string]$RawDataDir = "data/raw",
  [string]$OutputPath = "frontend/assets/js/medical_statistics.js"
)

$ErrorActionPreference = "Stop"

function To-Number($value) {
  if ($null -eq $value) { return 0 }
  $text = ([string]$value).Trim().Replace(",", "")
  if ($text -eq "") { return 0 }
  return [double]$text
}

function Split-CsvLine($line) {
  return $line -split ","
}

function Add-Stat($map, $key, $patientCount, $claimCount, $usageCount, $amount) {
  if (-not $map.ContainsKey($key)) {
    $map[$key] = [ordered]@{
      patientCount = 0
      claimCount = 0
      usageCount = 0
      totalAmount = 0
    }
  }

  $stat = $map[$key]
  $stat.patientCount += To-Number $patientCount
  $stat.claimCount += To-Number $claimCount
  $stat.usageCount += To-Number $usageCount
  $stat.totalAmount += To-Number $amount
}

function Finalize-ActionStats($map) {
  $result = [ordered]@{}
  foreach ($key in $map.Keys) {
    $stat = $map[$key]
    $result[$key] = [ordered]@{
      avgClaimPerUse = if ($stat.usageCount -gt 0) { [math]::Round($stat.totalAmount / $stat.usageCount) } else { 0 }
      avgClaimPerCase = if ($stat.claimCount -gt 0) { [math]::Round($stat.totalAmount / $stat.claimCount) } else { 0 }
      patientCount = [math]::Round($stat.patientCount)
      claimCount = [math]::Round($stat.claimCount)
      usageCount = [math]::Round($stat.usageCount)
      totalAmount = [math]::Round($stat.totalAmount)
    }
  }
  return $result
}

function Finalize-DiseaseStats($map) {
  $result = [ordered]@{}
  foreach ($key in $map.Keys) {
    $stat = $map[$key]
    $result[$key] = [ordered]@{
      avgTotalPerPatient = if ($stat.patientCount -gt 0) { [math]::Round($stat.totalAmount / $stat.patientCount) } else { 0 }
      avgTotalPerCase = if ($stat.claimCount -gt 0) { [math]::Round($stat.totalAmount / $stat.claimCount) } else { 0 }
      patientCount = [math]::Round($stat.patientCount)
      claimCount = [math]::Round($stat.claimCount)
      totalAmount = [math]::Round($stat.totalAmount)
    }
  }
  return $result
}

$actionCsv = Join-Path $RawDataDir "action_cost_inout_2024.csv"
$diseaseCsv = Join-Path $RawDataDir "disease_cost_kcd4_inout_2024.csv"

if (-not (Test-Path $actionCsv)) { throw "Missing $actionCsv" }
if (-not (Test-Path $diseaseCsv)) { throw "Missing $diseaseCsv" }

$actionMap = @{}
$actionLines = [System.IO.File]::ReadLines((Resolve-Path $actionCsv), [System.Text.Encoding]::UTF8)
$isFirst = $true
foreach ($line in $actionLines) {
  if ($isFirst) { $isFirst = $false; continue }
  if ([string]::IsNullOrWhiteSpace($line)) { continue }
  $cols = Split-CsvLine $line
  if ($cols.Count -lt 8) { continue }
  $visitType = $cols[2].Trim()
  $code = $cols[3].Trim()
  if ($code -and $visitType) {
    Add-Stat $actionMap "$code|$visitType" $cols[4] $cols[5] $cols[6] $cols[7]
  }
}

$diseaseMap = @{}
$diseaseLines = [System.IO.File]::ReadLines((Resolve-Path $diseaseCsv), [System.Text.Encoding]::UTF8)
$isFirst = $true
foreach ($line in $diseaseLines) {
  if ($isFirst) { $isFirst = $false; continue }
  if ([string]::IsNullOrWhiteSpace($line)) { continue }
  $cols = Split-CsvLine $line
  if ($cols.Count -lt 9) { continue }
  $code = $cols[1].Trim().ToUpper()
  $visitType = $cols[3].Trim()
  if ($code -and $visitType) {
    Add-Stat $diseaseMap "$code|$visitType" $cols[4] $cols[5] 0 $cols[8]
  }
}

$payload = [ordered]@{
  generatedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssK")
  sourceYear = 2024
  sourceFiles = @(
    "data/raw/action_cost_inout_2024.csv",
    "data/raw/disease_cost_kcd4_inout_2024.csv"
  )
  note = "Generated from local public-data CSV files. Amounts are aggregated averages, not hospital quotes."
  actions = Finalize-ActionStats $actionMap
  diseases = Finalize-DiseaseStats $diseaseMap
}

$json = $payload | ConvertTo-Json -Depth 8 -Compress
$content = "window.MEDICAL_STATISTICS = $json;`n"
$outputDir = Split-Path $OutputPath -Parent
if ($outputDir -and -not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir | Out-Null
}
Set-Content -Path $OutputPath -Value $content -Encoding UTF8

Write-Output "Generated $OutputPath"
