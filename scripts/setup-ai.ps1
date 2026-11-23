$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot '.env.local'
$secureKey = Read-Host -Prompt 'Enter a NEW Gemini API key (input is hidden)' -AsSecureString
$pointer = [IntPtr]::Zero

try {
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
    $apiKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer).Trim()
    if ([string]::IsNullOrWhiteSpace($apiKey)) {
        throw 'API key cannot be empty.'
    }

    $escapedKey = $apiKey.Replace('\', '\\').Replace('"', '\"')
    $lineBreak = [Environment]::NewLine
    $contents = 'GEMINI_API_KEY="{0}"{1}GEMINI_MODEL="gemini-3.8-flash"{1}' -f $escapedKey, $lineBreak
    $encoding = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllText($envPath, $contents, $encoding)
    Write-Output 'Key saved to .env.local (ignored by Git). Restart the server with: npm run dev'
}
finally {
    if ($pointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }
    $apiKey = $null
    $escapedKey = $null
    $contents = $null
}
