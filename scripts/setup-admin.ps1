$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot '.env.local'
$email = Read-Host 'Admin email'
$securePassword = Read-Host 'Admin password (input is hidden)' -AsSecureString
$pointer = [IntPtr]::Zero

try {
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer).Trim()
    $email = $email.Trim().ToLowerInvariant()

    if ($email -notmatch '^[^@\s]+@[^@\s]+\.[^@\s]+$') {
        throw 'Enter a valid admin email.'
    }
    if ($password.Length -lt 6) {
        throw 'Admin password must contain at least 6 characters.'
    }

    $lines = @()
    if (Test-Path $envPath) {
        $lines = @(Get-Content -Path $envPath | Where-Object {
            $_ -notmatch '^(ADMIN_EMAIL|ADMIN_PASSWORD)='
        })
    }
    $lines += 'ADMIN_EMAIL="' + $email.Replace('\', '\\').Replace('"', '\"') + '"'
    $lines += 'ADMIN_PASSWORD="' + $password.Replace('\', '\\').Replace('"', '\"') + '"'

    $encoding = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllText($envPath, (($lines -join [Environment]::NewLine) + [Environment]::NewLine), $encoding)
    Write-Output 'Admin credentials saved to .env.local (ignored by Git). Restart the server.'
}
finally {
    if ($pointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }
    $password = $null
}
