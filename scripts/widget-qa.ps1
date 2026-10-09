[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string[]]$Themes,

    [ValidateSet('both', 'en', 'fa')]
    [string]$Locale = 'both',

    [string]$OutDir = 'out',

    [string]$BrowserPath,

    [int]$WidgetPort = 0,

    [int]$FullPort = 0,

    [switch]$Headful,

    [switch]$KeepProjectRaw
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$KnownThemes = @('material', 'flat', 'minimal', 'gaming', 'ios', 'glass', 'studio', 'horizon')

# The script can live either in <project>\scripts or directly in <project>.
if (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'package.json')) {
    $ProjectRoot = (Resolve-Path $PSScriptRoot).Path
} elseif (Test-Path -LiteralPath (Join-Path $PSScriptRoot '..\package.json')) {
    $ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
} else {
    throw "Could not locate package.json next to this script or one directory above it."
}
$OutputRoot = if ([System.IO.Path]::IsPathRooted($OutDir)) {
    $OutDir
} else {
    Join-Path $ProjectRoot $OutDir
}

function Write-Section([string]$Text) {
    Write-Host ''
    Write-Host ('=' * 78) -ForegroundColor DarkGray
    Write-Host $Text -ForegroundColor Cyan
    Write-Host ('=' * 78) -ForegroundColor DarkGray
}

function Resolve-ThemeList([string[]]$InputThemes) {
    if (-not $InputThemes -or $InputThemes.Count -eq 0) {
        $answer = Read-Host "Theme(s): $($KnownThemes -join ', ') or 'all'"
        if ([string]::IsNullOrWhiteSpace($answer)) {
            throw 'No theme was provided.'
        }
        $InputThemes = @($answer)
    }

    $result = New-Object System.Collections.Generic.List[string]
    foreach ($item in $InputThemes) {
        foreach ($part in ($item -split '[,;\s]+')) {
            if ([string]::IsNullOrWhiteSpace($part)) { continue }
            $theme = $part.Trim().ToLowerInvariant()
            if ($theme -eq 'all') {
                return $KnownThemes
            }
            if ($KnownThemes -notcontains $theme) {
                throw "Unknown theme '$theme'. Valid themes: $($KnownThemes -join ', ')"
            }
            if (-not $result.Contains($theme)) {
                $result.Add($theme)
            }
        }
    }

    if ($result.Count -eq 0) {
        throw 'No valid theme was provided.'
    }
    return $result.ToArray()
}

function Get-FreeTcpPort {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
    try {
        $listener.Start()
        return ([System.Net.IPEndPoint]$listener.LocalEndpoint).Port
    } finally {
        $listener.Stop()
    }
}

function Resolve-BrowserExecutable([string]$ExplicitPath) {
    if ($ExplicitPath) {
        $resolved = Resolve-Path $ExplicitPath -ErrorAction SilentlyContinue
        if ($resolved) { return $resolved.Path }
        throw "Browser executable not found: $ExplicitPath"
    }

    if ($env:PLAYWRIGHT_CHROME_PATH -and (Test-Path -LiteralPath $env:PLAYWRIGHT_CHROME_PATH)) {
        return (Resolve-Path $env:PLAYWRIGHT_CHROME_PATH).Path
    }

    $candidates = New-Object System.Collections.Generic.List[string]

    if ($env:PROGRAMFILES) {
        $candidates.Add((Join-Path $env:PROGRAMFILES 'Google\Chrome\Application\chrome.exe'))
        $candidates.Add((Join-Path $env:PROGRAMFILES 'Microsoft\Edge\Application\msedge.exe'))
        $candidates.Add((Join-Path $env:PROGRAMFILES 'Chromium\Application\chrome.exe'))
    }
    if (${env:ProgramFiles(x86)}) {
        $candidates.Add((Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe'))
        $candidates.Add((Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe'))
    }
    if ($env:LOCALAPPDATA) {
        $candidates.Add((Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe'))
        $candidates.Add((Join-Path $env:LOCALAPPDATA 'Microsoft\Edge\Application\msedge.exe'))
    }

    foreach ($candidate in $candidates) {
        if ($candidate -and (Test-Path -LiteralPath $candidate)) {
            return (Resolve-Path $candidate).Path
        }
    }

    # Fall back to a Playwright-managed Chromium install if one exists.
    if ($env:LOCALAPPDATA) {
        $playwrightRoot = Join-Path $env:LOCALAPPDATA 'ms-playwright'
        if (Test-Path -LiteralPath $playwrightRoot) {
            $chromiumDirs = Get-ChildItem -LiteralPath $playwrightRoot -Directory -ErrorAction SilentlyContinue |
                Where-Object { $_.Name -like 'chromium-*' } |
                Sort-Object Name -Descending

            foreach ($dir in $chromiumDirs) {
                foreach ($relative in @('chrome-win64\chrome.exe', 'chrome-win\chrome.exe')) {
                    $candidate = Join-Path $dir.FullName $relative
                    if (Test-Path -LiteralPath $candidate) {
                        return (Resolve-Path $candidate).Path
                    }
                }
            }
        }
    }

    throw @"
Could not find Chrome/Edge/Chromium automatically.
Install a browser or pass it explicitly, for example:
  .\scripts\widget-qa.ps1 -Themes ios -BrowserPath "C:\Program Files\Google\Chrome\Application\chrome.exe"
"@
}

function Resolve-NpmCommand {
    $cmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $cmd = Get-Command npm -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    throw 'npm was not found in PATH.'
}

function Resolve-NodeCommand {
    $cmd = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $cmd = Get-Command node -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    throw 'node was not found in PATH.'
}

function Invoke-NpmScript {
    param(
        [Parameter(Mandatory)] [string]$Name,
        [Parameter(Mandatory)] [string]$LogFile,
        [Parameter(Mandatory)] [string]$NpmCommand
    )

    Write-Host "npm run $Name" -ForegroundColor Yellow
    & $NpmCommand run $Name 2>&1 | Tee-Object -FilePath $LogFile
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        throw "npm run $Name failed with exit code $exitCode. See: $LogFile"
    }
}

function Wait-ForHttp {
    param(
        [Parameter(Mandatory)] [string]$Url,
        [int]$TimeoutSeconds = 30
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $params = @{
                Uri = $Url
                Method = 'GET'
                TimeoutSec = 2
                ErrorAction = 'Stop'
            }
            if ($PSVersionTable.PSVersion.Major -lt 6) {
                $params['UseBasicParsing'] = $true
            }
            $response = Invoke-WebRequest @params
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                return
            }
        } catch {
            Start-Sleep -Milliseconds 300
        }
    }
    throw "Timed out waiting for Vite at $Url"
}

function Start-ViteServer {
    param(
        [Parameter(Mandatory)] [int]$Port,
        [Parameter(Mandatory)] [string]$StdoutLog,
        [Parameter(Mandatory)] [string]$StderrLog,
        [Parameter(Mandatory)] [string]$NodeCommand
    )

    $viteJs = Join-Path $ProjectRoot 'node_modules\vite\bin\vite.js'
    if (-not (Test-Path -LiteralPath $viteJs)) {
        throw "Vite was not found at $viteJs. Run npm install first."
    }

    $viteArg = '"' + $viteJs + '"'
    $startParams = @{
        FilePath = $NodeCommand
        ArgumentList = @($viteArg, '--host', '127.0.0.1', '--port', [string]$Port, '--strictPort')
        WorkingDirectory = $ProjectRoot
        PassThru = $true
        WindowStyle = 'Hidden'
        RedirectStandardOutput = $StdoutLog
        RedirectStandardError = $StderrLog
    }
    $process = Start-Process @startParams

    try {
        Wait-ForHttp -Url "http://127.0.0.1:$Port" -TimeoutSeconds 30
    } catch {
        if (-not $process.HasExited) {
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }
        $stderr = if (Test-Path $StderrLog) { Get-Content $StderrLog -Raw } else { '' }
        throw "Vite failed to start. $stderr"
    }

    return $process
}

function Copy-CleanDirectory {
    param(
        [Parameter(Mandatory)] [string]$Source,
        [Parameter(Mandatory)] [string]$Destination
    )

    if (-not (Test-Path -LiteralPath $Source)) {
        throw "Expected output directory does not exist: $Source"
    }
    if (Test-Path -LiteralPath $Destination) {
        Remove-Item -LiteralPath $Destination -Recurse -Force
    }
    Copy-Item -LiteralPath $Source -Destination $Destination -Recurse -Force
}

function Reset-RawOutput {
    param([Parameter(Mandatory)] [string]$Name)
    $path = Join-Path $ProjectRoot $Name
    if (Test-Path -LiteralPath $path) {
        Remove-Item -LiteralPath $path -Recurse -Force
    }
}

function Copy-WidgetQaOutput {
    param(
        [Parameter(Mandatory)] [string]$SourceRoot,
        [Parameter(Mandatory)] [string]$Theme,
        [Parameter(Mandatory)] [string]$Destination
    )

    if (-not (Test-Path -LiteralPath $SourceRoot)) {
        throw "Expected output directory does not exist: $SourceRoot"
    }

    $sourceTheme = Join-Path $SourceRoot $Theme
    if (-not (Test-Path -LiteralPath $sourceTheme)) {
        throw "Expected theme output does not exist: $sourceTheme"
    }

    if (Test-Path -LiteralPath $Destination) {
        Remove-Item -LiteralPath $Destination -Recurse -Force
    }
    New-Item -ItemType Directory -Path $Destination -Force | Out-Null

    # Copy only this requested theme plus the report files for this exact run.
    Copy-Item -LiteralPath $sourceTheme -Destination (Join-Path $Destination $Theme) -Recurse -Force
    foreach ($name in @('report.json', 'SUMMARY.txt')) {
        $sourceFile = Join-Path $SourceRoot $name
        if (Test-Path -LiteralPath $sourceFile) {
            Copy-Item -LiteralPath $sourceFile -Destination (Join-Path $Destination $name) -Force
        }
    }
}

function Copy-FullQaOutput {
    param(
        [Parameter(Mandatory)] [string]$SourceRoot,
        [Parameter(Mandatory)] [string]$Theme,
        [Parameter(Mandatory)] [string]$Destination
    )

    if (-not (Test-Path -LiteralPath $SourceRoot)) {
        throw "Expected output directory does not exist: $SourceRoot"
    }

    $sourceTheme = Join-Path $SourceRoot $Theme
    if (-not (Test-Path -LiteralPath $sourceTheme)) {
        throw "Expected theme output does not exist: $sourceTheme"
    }

    if (Test-Path -LiteralPath $Destination) {
        Remove-Item -LiteralPath $Destination -Recurse -Force
    }
    New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    Copy-Item -LiteralPath $sourceTheme -Destination (Join-Path $Destination $Theme) -Recurse -Force
}

function New-ZipFromDirectory {
    param(
        [Parameter(Mandatory)] [string]$SourceDirectory,
        [Parameter(Mandatory)] [string]$Destination
    )

    if (-not (Test-Path -LiteralPath $SourceDirectory)) {
        throw "ZIP source directory does not exist: $SourceDirectory"
    }
    if (Test-Path -LiteralPath $Destination) {
        Remove-Item -LiteralPath $Destination -Force
    }

    Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction SilentlyContinue
    [System.IO.Compression.ZipFile]::CreateFromDirectory(
        $SourceDirectory,
        $Destination,
        [System.IO.Compression.CompressionLevel]::Optimal,
        $false
    )
}

$SelectedThemes = Resolve-ThemeList $Themes
$Locales = if ($Locale -eq 'both') { @('en', 'fa') } else { @($Locale) }
$BrowserExecutable = Resolve-BrowserExecutable $BrowserPath
$NpmCommand = Resolve-NpmCommand
$NodeCommand = Resolve-NodeCommand

$packageJson = Join-Path $ProjectRoot 'package.json'
if (-not (Test-Path -LiteralPath $packageJson)) {
    throw "package.json not found. Put this script in the project's scripts folder. Expected: $packageJson"
}

New-Item -ItemType Directory -Path $OutputRoot -Force | Out-Null

$EnvNames = @(
    'WIDGET_QA_THEME',
    'WIDGET_QA_LOCALE',
    'WIDGET_QA_CATEGORY',
    'WIDGET_QA_PORT',
    'WIDGET_QA_URL',
    'WIDGET_QA_HEADFUL',
    'PLAYWRIGHT_CHROME_PATH'
)
$SavedEnv = @{}
foreach ($name in $EnvNames) {
    $SavedEnv[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}

$Failures = New-Object System.Collections.Generic.List[string]
$RunStart = Get-Date

try {
    Push-Location $ProjectRoot
    try {
        foreach ($theme in $SelectedThemes) {
            # Remove output from older runner versions so this theme leaves only one final ZIP.
            $legacyThemeOut = Join-Path $OutputRoot $theme
            if (Test-Path -LiteralPath $legacyThemeOut) {
                Remove-Item -LiteralPath $legacyThemeOut -Recurse -Force
            }
            $themeZip = Join-Path $OutputRoot "$theme-qa.zip"
            if (Test-Path -LiteralPath $themeZip) {
                Remove-Item -LiteralPath $themeZip -Force
            }

            # Use a temporary staging directory. The only persistent result is <theme>-qa.zip.
            $themeStage = Join-Path $OutputRoot (".$theme-qa-staging")
            if (Test-Path -LiteralPath $themeStage) {
                Remove-Item -LiteralPath $themeStage -Recurse -Force
            }
            New-Item -ItemType Directory -Path $themeStage -Force | Out-Null
            $themeResults = New-Object System.Collections.Generic.List[string]

            foreach ($localeName in $Locales) {
                Write-Section "QA: theme=$theme  locale=$localeName"

                $localeOut = Join-Path $themeStage $localeName
                $logDir = Join-Path $localeOut 'logs'
                New-Item -ItemType Directory -Path $logDir -Force | Out-Null

                $env:WIDGET_QA_THEME = $theme
                $env:WIDGET_QA_LOCALE = $localeName
                Remove-Item Env:WIDGET_QA_CATEGORY -ErrorAction SilentlyContinue
                $env:PLAYWRIGHT_CHROME_PATH = $BrowserExecutable
                $env:WIDGET_QA_HEADFUL = if ($Headful) { '1' } else { '0' }

                $widgetsStatus = 'NOT RUN'
                $fullStatus = 'NOT RUN'
                $widgetsDest = Join-Path $localeOut 'widget-screenshots'
                $fullDest = Join-Path $localeOut 'full-screenshots'

                # 1) Individual widget sheets + diagnostics.
                try {
                    $port = if ($WidgetPort -gt 0) { $WidgetPort } else { Get-FreeTcpPort }
                    $env:WIDGET_QA_PORT = [string]$port
                    Remove-Item Env:WIDGET_QA_URL -ErrorAction SilentlyContinue

                    # Never let files from an older locale/theme leak into this run.
                    Reset-RawOutput -Name 'widget-screenshots'

                    $widgetsLog = Join-Path $logDir 'npm-screenshots.log'
                    Invoke-NpmScript -Name 'screenshots' -LogFile $widgetsLog -NpmCommand $NpmCommand

                    $rawWidgets = Join-Path $ProjectRoot 'widget-screenshots'
                    Copy-WidgetQaOutput -SourceRoot $rawWidgets -Theme $theme -Destination $widgetsDest
                    $widgetsStatus = 'PASS'
                } catch {
                    $widgetsStatus = 'FAIL'
                    $message = "$theme/$localeName widget screenshots: $($_.Exception.Message)"
                    $Failures.Add($message)
                    Write-Host $message -ForegroundColor Red
                }

                # 2) Full-page contact sheets. This script expects an already-running Vite server.
                $viteProcess = $null
                try {
                    $port = if ($FullPort -gt 0) { $FullPort } else { Get-FreeTcpPort }
                    $viteStdout = Join-Path $logDir 'vite-full.stdout.log'
                    $viteStderr = Join-Path $logDir 'vite-full.stderr.log'
                    $viteProcess = Start-ViteServer -Port $port -StdoutLog $viteStdout -StderrLog $viteStderr -NodeCommand $NodeCommand

                    $env:WIDGET_QA_URL = "http://127.0.0.1:$port"
                    Remove-Item Env:WIDGET_QA_PORT -ErrorAction SilentlyContinue

                    # Full-page output is also cleaned before every locale/theme run.
                    Reset-RawOutput -Name 'full-screenshots'

                    $fullLog = Join-Path $logDir 'npm-screenshots-full.log'
                    Invoke-NpmScript -Name 'screenshots:full' -LogFile $fullLog -NpmCommand $NpmCommand

                    $rawFull = Join-Path $ProjectRoot 'full-screenshots'
                    Copy-FullQaOutput -SourceRoot $rawFull -Theme $theme -Destination $fullDest
                    $fullStatus = 'PASS'
                } catch {
                    $fullStatus = 'FAIL'
                    $message = "$theme/$localeName full screenshots: $($_.Exception.Message)"
                    $Failures.Add($message)
                    Write-Host $message -ForegroundColor Red
                } finally {
                    if ($viteProcess -and -not $viteProcess.HasExited) {
                        Stop-Process -Id $viteProcess.Id -Force -ErrorAction SilentlyContinue
                        try { $viteProcess.WaitForExit(5000) } catch {}
                    }
                }

                $themeResults.Add("${localeName}: widget=$widgetsStatus, full=$fullStatus")
            }

            # One manifest and one ZIP per theme. No duplicate ZIPs or raw folders remain in out/.
            $gitCommit = ''
            try {
                $gitCommit = (& git rev-parse --short HEAD 2>$null | Select-Object -First 1).Trim()
            } catch {}

            $themeManifest = @"
IoT Widget Studio QA Bundle
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')
Theme: $theme
Locales: $($Locales -join ', ')
Browser: $BrowserExecutable
Git commit: $gitCommit

Results:
$($themeResults -join [Environment]::NewLine)

Archive layout:
- en/widget-screenshots/   English individual/category screenshots + report.json
- en/full-screenshots/     English full-page category screenshots
- en/logs/                 English QA logs
- fa/widget-screenshots/   Persian/RTL individual/category screenshots + report.json
- fa/full-screenshots/     Persian/RTL full-page category screenshots
- fa/logs/                 Persian/RTL QA logs
- QA-MANIFEST.txt          this file

Only requested locales are included.
"@
            $themeManifestPath = Join-Path $themeStage 'QA-MANIFEST.txt'
            Set-Content -LiteralPath $themeManifestPath -Value $themeManifest -Encoding UTF8

            # Archive the staging directory itself. This avoids duplicate/nested ZIPs and
            # produces one portable archive containing only this requested theme.
            New-ZipFromDirectory -SourceDirectory $themeStage -Destination $themeZip

            # Delete staging so out/ contains only the final theme archive(s).
            Remove-Item -LiteralPath $themeStage -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "Final archive: $themeZip" -ForegroundColor Green
        }
    } finally {
        Pop-Location
    }
} finally {
    foreach ($name in $EnvNames) {
        $oldValue = $SavedEnv[$name]
        if ($null -eq $oldValue) {
            Remove-Item "Env:$name" -ErrorAction SilentlyContinue
        } else {
            Set-Item "Env:$name" $oldValue
        }
    }

    if (-not $KeepProjectRaw) {
        foreach ($rawName in @('widget-screenshots', 'full-screenshots')) {
            $rawPath = Join-Path $ProjectRoot $rawName
            if (Test-Path -LiteralPath $rawPath) {
                Remove-Item -LiteralPath $rawPath -Recurse -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

$RunEnd = Get-Date
$summary = New-Object System.Collections.Generic.List[string]
$summary.Add('IoT Widget Studio automated QA')
$summary.Add("Started:  $($RunStart.ToString('yyyy-MM-dd HH:mm:ss K'))")
$summary.Add("Finished: $($RunEnd.ToString('yyyy-MM-dd HH:mm:ss K'))")
$summary.Add("Themes:   $($SelectedThemes -join ', ')")
$summary.Add("Locales:  $($Locales -join ', ')")
$summary.Add("Output:   $OutputRoot")
$summary.Add('')
if ($Failures.Count -eq 0) {
    $summary.Add('RESULT: PASS')
} else {
    $summary.Add("RESULT: FAIL ($($Failures.Count) phase(s))")
    foreach ($failure in $Failures) {
        $summary.Add("- $failure")
    }
}

# Keep out/ clean: print the run summary to the console instead of creating another file.
Write-Host ''
Write-Host ($summary -join [Environment]::NewLine)

if ($Failures.Count -gt 0) {
    exit 1
}
exit 0
