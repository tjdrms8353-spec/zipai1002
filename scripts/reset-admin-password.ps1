[CmdletBinding()]
param(
    [string]$DatabaseUrl = 'jdbc:mysql://zipai-mysql-tjdrms8353.h.aivencloud.com:23402/defaultdb?sslMode=REQUIRED',
    [string]$DatabaseUsername = 'avnadmin',
    [string]$AdminUsername = 'zipai_admin'
)

$databasePassword = Read-Host 'Aiven DB 비밀번호' -AsSecureString
$newPassword = Read-Host '새 어드민 비밀번호 (8~72자)' -AsSecureString
$confirmPassword = Read-Host '새 어드민 비밀번호 확인' -AsSecureString

$databasePointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($databasePassword)
$newPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($newPassword)
$confirmPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($confirmPassword)

try {
    $databasePlain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($databasePointer)
    $newPlain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($newPointer)
    $confirmPlain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($confirmPointer)

    if ($newPlain -cne $confirmPlain) {
        throw '새 비밀번호와 확인 값이 일치하지 않습니다.'
    }

    $env:DB_URL = $DatabaseUrl
    $env:DB_USERNAME = $DatabaseUsername
    $env:DB_PASSWORD = $databasePlain
    $env:ADMIN_USERNAME = $AdminUsername
    $env:ADMIN_NEW_PASSWORD = $newPlain

    & "$PSScriptRoot\..\gradlew.bat" --no-daemon --quiet resetAdminPassword
    if ($LASTEXITCODE -ne 0) { throw '비밀번호 재설정 명령이 실패했습니다.' }
} finally {
    Remove-Item Env:DB_URL, Env:DB_USERNAME, Env:DB_PASSWORD, Env:ADMIN_USERNAME, Env:ADMIN_NEW_PASSWORD -ErrorAction SilentlyContinue
    if ($databasePointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($databasePointer) }
    if ($newPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($newPointer) }
    if ($confirmPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($confirmPointer) }
}
