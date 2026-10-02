$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$runtimeDir = Join-Path $projectRoot '.runtime'
$configFile = Join-Path $runtimeDir 'zipai-local-oauth.json'

$existing = $null
if (Test-Path -LiteralPath $configFile) {
    try { $existing = Get-Content -LiteralPath $configFile -Raw | ConvertFrom-Json } catch { $existing = $null }
}

$form = New-Object System.Windows.Forms.Form
$form.Text = 'ZipAI Kakao Login Setup'
$form.StartPosition = 'CenterScreen'
$form.ClientSize = New-Object System.Drawing.Size(520, 275)
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.Font = New-Object System.Drawing.Font('Segoe UI', 10)

$title = New-Object System.Windows.Forms.Label
$title.Text = 'Local Kakao login settings'
$title.Font = New-Object System.Drawing.Font('Segoe UI', 14, [System.Drawing.FontStyle]::Bold)
$title.AutoSize = $true
$title.Location = New-Object System.Drawing.Point(24, 20)
$form.Controls.Add($title)

$description = New-Object System.Windows.Forms.Label
$description.Text = 'Enter the REST API key and Client Secret from Kakao Developers.'
$description.AutoSize = $true
$description.Location = New-Object System.Drawing.Point(26, 56)
$form.Controls.Add($description)

$clientIdLabel = New-Object System.Windows.Forms.Label
$clientIdLabel.Text = 'REST API key'
$clientIdLabel.AutoSize = $true
$clientIdLabel.Location = New-Object System.Drawing.Point(26, 94)
$form.Controls.Add($clientIdLabel)

$clientIdBox = New-Object System.Windows.Forms.TextBox
$clientIdBox.Location = New-Object System.Drawing.Point(165, 90)
$clientIdBox.Size = New-Object System.Drawing.Size(325, 28)
if ($existing -and $existing.KAKAO_CLIENT_ID) { $clientIdBox.Text = [string]$existing.KAKAO_CLIENT_ID }
$form.Controls.Add($clientIdBox)

$secretLabel = New-Object System.Windows.Forms.Label
$secretLabel.Text = 'Client Secret'
$secretLabel.AutoSize = $true
$secretLabel.Location = New-Object System.Drawing.Point(26, 137)
$form.Controls.Add($secretLabel)

$secretBox = New-Object System.Windows.Forms.TextBox
$secretBox.Location = New-Object System.Drawing.Point(165, 133)
$secretBox.Size = New-Object System.Drawing.Size(325, 28)
$secretBox.UseSystemPasswordChar = $true
if ($existing -and $existing.KAKAO_CLIENT_SECRET) { $secretBox.Text = [string]$existing.KAKAO_CLIENT_SECRET }
$form.Controls.Add($secretBox)

$notice = New-Object System.Windows.Forms.Label
$notice.Text = "Saved only in this project's ignored .runtime folder. Do not share the file."
$notice.ForeColor = [System.Drawing.Color]::DimGray
$notice.AutoSize = $true
$notice.Location = New-Object System.Drawing.Point(26, 178)
$form.Controls.Add($notice)

$cancelButton = New-Object System.Windows.Forms.Button
$cancelButton.Text = 'Cancel'
$cancelButton.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
$cancelButton.Location = New-Object System.Drawing.Point(305, 220)
$cancelButton.Size = New-Object System.Drawing.Size(88, 32)
$form.Controls.Add($cancelButton)

$saveButton = New-Object System.Windows.Forms.Button
$saveButton.Text = 'Save'
$saveButton.Location = New-Object System.Drawing.Point(402, 220)
$saveButton.Size = New-Object System.Drawing.Size(88, 32)
$saveButton.Add_Click({
    $clientId = $clientIdBox.Text.Trim()
    $clientSecret = $secretBox.Text.Trim()
    if ([string]::IsNullOrWhiteSpace($clientId) -or [string]::IsNullOrWhiteSpace($clientSecret)) {
        [System.Windows.Forms.MessageBox]::Show('Both values are required.', 'ZipAI', 'OK', 'Warning') | Out-Null
        return
    }

    New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
    @{
        PUBLIC_BASE_URL = 'http://127.0.0.1:4173'
        KAKAO_CLIENT_ID = $clientId
        KAKAO_CLIENT_SECRET = $clientSecret
    } | ConvertTo-Json | Set-Content -LiteralPath $configFile -Encoding UTF8

    [System.Windows.Forms.MessageBox]::Show(
        'Saved. Run ZipAI-Stop.bat once, then run ZipAI-Start.bat.',
        'ZipAI Kakao Login Setup', 'OK', 'Information'
    ) | Out-Null
    $form.DialogResult = [System.Windows.Forms.DialogResult]::OK
    $form.Close()
})
$form.Controls.Add($saveButton)

$form.AcceptButton = $saveButton
$form.CancelButton = $cancelButton
[void]$form.ShowDialog()
