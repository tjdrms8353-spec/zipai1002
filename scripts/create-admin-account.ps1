[CmdletBinding()]
param(
    [string]$DatabaseUrl = 'jdbc:mysql://zipai-mysql-tjdrms8353.h.aivencloud.com:23402/defaultdb?sslMode=REQUIRED',
    [string]$DatabaseUsername = 'avnadmin'
)

$databasePassword = Read-Host 'Aiven DB password' -AsSecureString
$adminUsername = Read-Host 'New platform administrator username'
$adminEmail = Read-Host 'New administrator email'
$adminPhone = Read-Host 'New administrator phone number (digits only)'
$adminPassword = Read-Host 'New administrator password (8-72 characters)' -AsSecureString
$confirmPassword = Read-Host 'Confirm new administrator password' -AsSecureString

$databasePointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($databasePassword)
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminPassword)
$confirmPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($confirmPassword)

try {
    $databasePlain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($databasePointer)
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    $confirmPlain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($confirmPointer)
    if ($passwordPlain -cne $confirmPlain) { throw 'The password confirmation does not match.' }

    $env:DB_URL = $DatabaseUrl
    $env:DB_USERNAME = $DatabaseUsername
    $env:DB_PASSWORD = $databasePlain
    $env:NEW_ADMIN_USERNAME = $adminUsername
    $env:NEW_ADMIN_EMAIL = $adminEmail
    $env:NEW_ADMIN_PHONE = $adminPhone
    $env:NEW_ADMIN_PASSWORD = $passwordPlain

    & "$PSScriptRoot\..\gradlew.bat" --no-daemon --quiet createAdminAccount
    if ($LASTEXITCODE -ne 0) { throw 'Administrator account creation failed.' }
} finally {
    Remove-Item Env:DB_URL, Env:DB_USERNAME, Env:DB_PASSWORD, Env:NEW_ADMIN_USERNAME, Env:NEW_ADMIN_EMAIL, Env:NEW_ADMIN_PHONE, Env:NEW_ADMIN_PASSWORD -ErrorAction SilentlyContinue
    if ($databasePointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($databasePointer) }
    if ($passwordPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer) }
    if ($confirmPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($confirmPointer) }
}
