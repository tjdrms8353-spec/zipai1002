$ErrorActionPreference = 'Stop'

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$runtimeDir = Join-Path $projectRoot '.runtime'
$pidFile = Join-Path $runtimeDir 'zipai-local.json'
$logFile = Join-Path $runtimeDir 'zipai-local.log'
$errorLogFile = Join-Path $runtimeDir 'zipai-local-error.log'
$healthUrl = 'http://127.0.0.1:4173/api/health'
$siteUrl = 'http://127.0.0.1:4173/index.html'

New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null

function Test-ZipAiHealth {
    try {
        $response = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 2
        return $response.status -eq 'ok'
    } catch {
        return $false
    }
}

function Get-ZipAiListenerPid {
    foreach ($line in (& netstat.exe -ano -p tcp)) {
        if ($line -match '^\s*TCP\s+\S+:4173\s+\S+\s+LISTENING\s+(\d+)\s*$') {
            return [int]$Matches[1]
        }
    }
    return $null
}

function Test-ZipAiJavaProcess([int]$processId) {
    try {
        $javaProcess = Get-Process -Id $processId -ErrorAction Stop
        if ($javaProcess.ProcessName -notin @('java', 'javaw')) { return $false }

        $jcmd = Join-Path (Split-Path -Parent $javaProcess.Path) 'jcmd.exe'
        if (-not (Test-Path -LiteralPath $jcmd)) { return $false }
        $commandInfo = (& $jcmd $processId VM.command_line 2>&1 | Out-String)
        return $LASTEXITCODE -eq 0 -and
            $commandInfo.Contains('com.zipai.ZipAiApplication') -and
            $commandInfo.Contains('--spring.profiles.active=local-demo')
    } catch {
        return $false
    }
}

if (Test-Path -LiteralPath $pidFile) {
    try {
        $saved = Get-Content -LiteralPath $pidFile -Raw | ConvertFrom-Json
        $process = Get-Process -Id ([int]$saved.pid) -ErrorAction Stop
        $sameStartTime = $process.StartTime.ToUniversalTime().Ticks -eq [long]$saved.processStartTimeUtcTicks
        if ($saved.projectRoot -eq $projectRoot -and $sameStartTime -and
            (Test-ZipAiJavaProcess ([int]$saved.pid)) -and (Test-ZipAiHealth)) {
            Write-Host 'ZipAI local demo is already running.' -ForegroundColor Green
            Start-Process $siteUrl
            exit 0
        }
    } catch {
        Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
    }
}

if (Test-ZipAiHealth) {
    Write-Host 'Port 4173 is already being used by another ZipAI server.' -ForegroundColor Yellow
    Write-Host 'Stop that server first so this temporary project is not confused with the original project.'
    exit 1
}

$gradle = Join-Path $projectRoot 'gradlew.bat'
$arguments = @('bootRun', '--no-daemon', '--args=--spring.profiles.active=local-demo')
$process = Start-Process -FilePath $gradle -ArgumentList $arguments -WorkingDirectory $projectRoot `
    -WindowStyle Hidden -RedirectStandardOutput $logFile -RedirectStandardError $errorLogFile -PassThru

Write-Host 'Starting the ZipAI local demo server...' -ForegroundColor Cyan
$deadline = (Get-Date).AddSeconds(90)
while ((Get-Date) -lt $deadline) {
    if (Test-ZipAiHealth) {
        $listenerPid = Get-ZipAiListenerPid
        if ($null -eq $listenerPid -or -not (Test-ZipAiJavaProcess $listenerPid)) {
            break
        }
        $serverProcess = Get-Process -Id $listenerPid -ErrorAction Stop
        @{
            pid = $listenerPid
            processStartTimeUtcTicks = $serverProcess.StartTime.ToUniversalTime().Ticks
            projectRoot = $projectRoot
            startedAt = (Get-Date).ToString('o')
        } | ConvertTo-Json | Set-Content -LiteralPath $pidFile -Encoding UTF8
        Write-Host 'ZipAI is ready. Opening the browser.' -ForegroundColor Green
        Start-Process $siteUrl
        exit 0
    }
    if ($process.HasExited) { break }
    Start-Sleep -Milliseconds 700
    $process.Refresh()
}

Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
Write-Host 'The server did not start. Check the log below:' -ForegroundColor Red
Write-Host $logFile
if (Test-Path -LiteralPath $logFile) { Get-Content -LiteralPath $logFile -Tail 25 }
if (Test-Path -LiteralPath $errorLogFile) { Get-Content -LiteralPath $errorLogFile -Tail 25 }
exit 1
