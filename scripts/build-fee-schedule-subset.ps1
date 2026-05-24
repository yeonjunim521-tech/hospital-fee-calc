param(
  [string]$RawDataDir = "data/raw",
  [string]$OutputPath = "frontend/assets/js/fee_schedule_items.js"
)

$ErrorActionPreference = "Stop"
$python = "C:\Users\giro0\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

& $python "scripts/build_fee_schedule_subset.py" $RawDataDir $OutputPath
