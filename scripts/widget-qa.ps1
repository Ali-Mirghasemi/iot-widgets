[CmdletBinding()]
param(
    [Parameter(Position = 0)] [string[]]$Themes,
    [ValidateSet('both', 'en', 'fa')] [string]$Locale = 'both',
    [string]$OutDir = 'out',
    [string]$BrowserPath,
    [ValidateRange(0, 65535)] [int]$WidgetPort = 0,
    [int]$FullPort = 0,
    [switch]$Headful,
    [switch]$KeepProjectRaw,
    [switch]$Plan,
    [ValidateSet('review', 'detailed')] [string]$Profile = 'review',
    [ValidateSet('png', 'jpeg', 'jpg')] [string]$ImageFormat = 'jpeg',
    [ValidateRange(1, 100)] [int]$Quality = 85,
    [ValidateSet('', 'metrics', 'controls', 'charts', 'location', 'tables', 'display')] [string]$Category = '',
    [ValidatePattern('^(auto|0|[1-9][0-9]*)$')] [string]$Jobs = 'auto'
)

$ErrorActionPreference = 'Stop'
$node = Get-Command node -ErrorAction Stop
$runner = Join-Path $PSScriptRoot 'run-qa.mjs'
if (-not (Test-Path -LiteralPath $runner)) { throw "Missing runner: $runner" }
$argsForNode = @('--themes', ($Themes -join ','), '--locale', $Locale,
    '--out-dir', $OutDir, '--profile', $Profile, '--format', $ImageFormat,
    '--quality', [string]$Quality, '--jobs', [string]$Jobs)
if (-not $Themes -or $Themes.Count -eq 0) { throw 'Provide a theme or all, e.g. -Themes all' }
if ($BrowserPath) { $argsForNode += @('--browser-path', $BrowserPath) }
if ($WidgetPort -gt 0) { $argsForNode += @('--widget-port', [string]$WidgetPort) }
if ($Category) { $argsForNode += @('--category', $Category) }
if ($Headful) { $argsForNode += '--headful' }
if ($Plan) { $argsForNode += '--plan' }
if ($KeepProjectRaw) { $argsForNode += '--keep-project-raw' }
if ($FullPort -gt 0) { Write-Warning '-FullPort is ignored because duplicate full-page capture is disabled.' }
& $node.Source $runner @argsForNode
exit $LASTEXITCODE
