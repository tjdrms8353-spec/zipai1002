[CmdletBinding()]
param(
    [string]$DatabaseUrl = 'jdbc:mysql://zipai-mysql-tjdrms8353.h.aivencloud.com:23402/defaultdb?sslMode=REQUIRED',
    [string]$DatabaseUsername = 'avnadmin'
)

$databasePassword = Read-Host 'Aiven DB password' -AsSecureString
$databasePointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($databasePassword)

try {
    $env:DB_URL = $DatabaseUrl
    $env:DB_USERNAME = $DatabaseUsername
    $env:DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($databasePointer)
    & "$PSScriptRoot\..\gradlew.bat" --no-daemon --quiet listAdminAccounts
    if ($LASTEXITCODE -ne 0) { throw 'Administrator account lookup failed.' }
} finally {
    Remove-Item Env:DB_URL, Env:DB_USERNAME, Env:DB_PASSWORD -ErrorAction SilentlyContinue
    if ($databasePointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($databasePointer) }
}
