# scripts/check-r2-severity.ps1 — R2 cardinal gate (validator severity), PowerShell port.
#
# Cardinal R2 (cf. CLAUDE.md "Pre-edit guards") :
#   Player deliverable validators MUST be `severity: "warn"`, never `"error"`.
#
# Baseline + rationale: docs/validator-severity-baseline.md
# Audit history: .planning/quick/260517-vsa-validator-severity-audit/
#
# Whitelist (allowed `severity: "error"` occurrences) :
#   - app/actions.ts  — WorkflowState markers (Zod parse, auth, infra, DB,
#                        GameMaster gates), not Player deliverable validators.
#
# Exit codes:
#   0 — clean
#   1 — at least one non-whitelisted match (likely R2 regression)
#
# Usage:
#   pwsh ./scripts/check-r2-severity.ps1
#   # or from PowerShell:
#   ./scripts/check-r2-severity.ps1

$ErrorActionPreference = 'Stop'

$rootDir = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $rootDir

$pattern = 'severity\s*:\s*["'']error["'']'
$includeDirs = @('app', 'lib', 'components')

$found = [System.Collections.ArrayList]@()
foreach ($dir in $includeDirs) {
  if (-not (Test-Path $dir)) { continue }
  $files = Get-ChildItem -Path $dir -Recurse -File -Include '*.ts', '*.tsx' -ErrorAction SilentlyContinue
  foreach ($file in $files) {
    $rel = [string]((Resolve-Path -Relative -LiteralPath $file.FullName)) -replace '\\', '/'
    if ($rel.StartsWith('./')) { $rel = $rel.Substring(2) }
    $lineNum = 0
    foreach ($line in Get-Content -LiteralPath $file.FullName) {
      $lineNum++
      if ($line -match $pattern) {
        [void]$found.Add([pscustomobject]@{
          Path = $rel
          Line = $lineNum
          Text = $line.Trim()
        })
      }
    }
  }
}

if ($found.Count -eq 0) {
  Write-Host '[check-r2-severity] OK — no severity: "error" matches found.'
  exit 0
}

# Whitelist filter: drop matches in app/actions.ts (WorkflowState markers).
$nonWhitelisted = @($found | Where-Object { $_.Path -ne 'app/actions.ts' })

if ($nonWhitelisted.Count -eq 0) {
  Write-Host ("[check-r2-severity] OK — {0} match(es), all in whitelisted paths (app/actions.ts WorkflowState markers)." -f $found.Count)
  exit 0
}

Write-Host '[check-r2-severity] FAIL — non-whitelisted severity: "error" match(es):'
foreach ($m in $nonWhitelisted) {
  Write-Host ("  {0}:{1}: {2}" -f $m.Path, $m.Line, $m.Text)
}
Write-Host ''
Write-Host 'If these are legitimate WorkflowState markers, update the whitelist in'
Write-Host '  scripts/check-r2-severity.sh, scripts/check-r2-severity.ps1, and'
Write-Host '  docs/validator-severity-baseline.md.'
Write-Host 'If these are Player deliverable validators, flip them to severity: "warn"'
Write-Host '  (cardinal R2) and spawn eic-pedagogical-advisor before committing.'
exit 1
