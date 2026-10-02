$ErrorActionPreference = 'Stop'

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$pidFile = Join-Path $projectRoot '.runtime\zipai-local.json'
$removePidFile = $false

if (-not (Test-Path -LiteralPath $pidFile)) {
    Write-Host 'No ZipAI server started by ZipAI-Start.bat was found.' -ForegroundColor Yellow
    exit 0
}

try {
    $saved = Get-Content -LiteralPath $pidFile -Raw | ConvertFrom-Json
    if ($saved.projectRoot -ne $projectRoot) {
        throw 'The saved project path does not match this temporary project.'
    }

    $process = Get-Process -Id ([int]$saved.pid) -ErrorAction Stop
    $sameStartTime = $process.StartTime.ToUniversalTime().Ticks -eq [long]$saved.processStartTimeUtcTicks
    if (-not $sameStartTime -or $process.ProcessName -notin @('java', 'javaw')) {
        throw 'The saved process is not the ZipAI server started by this temporary project.'
    }

    $isListener = $false
    foreach ($line in (& netstat.exe -ano -p tcp)) {
        if ($line -match '^\s*TCP\s+\S+:4173\s+\S+\s+LISTENING\s+(\d+)\s*$' -and
            [int]$Matches[1] -eq [int]$saved.pid) {
            $isListener = $true
            break
        }
    }

    $jcmd = Join-Path (Split-Path -Parent $process.Path) 'jcmd.exe'
    $commandInfo = if (Test-Path -LiteralPath $jcmd) {
        (& $jcmd ([int]$saved.pid) VM.command_line 2>&1 | Out-String)
    } else { '' }
    if (-not $isListener -or
        -not $commandInfo.Contains('com.zipai.ZipAiApplication') -or
        -not $commandInfo.Contains('--spring.profiles.active=local-demo')) {
        throw 'Safety check failed, so no process was stopped.'
    }

    & taskkill.exe /PID ([int]$saved.pid) /T /F | Out-Null
    $removePidFile = $true
    Write-Host 'The ZipAI local demo server has stopped.' -ForegroundColor Green
} catch [Microsoft.PowerShell.Commands.ProcessCommandException] {
    $removePidFile = $true
    Write-Host 'The server was already stopped.' -ForegroundColor Yellow
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
} finally {
    if ($removePidFile) {
        Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
    }
}
