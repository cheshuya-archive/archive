param(
    [string]$RepositoryUrl,
    [switch]$CheckOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

function Run-Git {
    param([string[]]$GitArgs)
    & $script:GitPath @GitArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Git command failed: $($GitArgs -join ' ')"
    }
}

try {
    if (-not (Test-Path -LiteralPath '.git') -or -not (Test-Path -LiteralPath 'dist/index.html')) {
        throw 'Run this file from the cheshuya-site project folder.'
    }

    $gitCommand = Get-Command git.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($gitCommand) {
        $script:GitPath = $gitCommand.Source
    } else {
        $bundledGit = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe'
        if (-not (Test-Path -LiteralPath $bundledGit)) {
            throw 'Git was not found. Install Git for Windows, then run this file again.'
        }
        $script:GitPath = $bundledGit
    }

    $remoteNames = @(& $script:GitPath remote)
    if ($LASTEXITCODE -ne 0) { throw 'Could not inspect Git remotes.' }
    $savedRemote = ''
    if ($remoteNames -contains 'publish') {
        $savedRemote = & $script:GitPath remote get-url publish
        if ($LASTEXITCODE -ne 0) { throw 'Could not read the saved publish target.' }
    }
    if (-not $RepositoryUrl) {
        if ($savedRemote) {
            $RepositoryUrl = [string]$savedRemote
        } else {
            $RepositoryUrl = Read-Host 'Paste the HTTPS URL of your NEW empty GitHub repository'
        }
    }

    $RepositoryUrl = $RepositoryUrl.Trim().TrimEnd('/')
    if ($RepositoryUrl.EndsWith('.git', [StringComparison]::OrdinalIgnoreCase)) {
        $RepositoryUrl = $RepositoryUrl.Substring(0, $RepositoryUrl.Length - 4)
    }
    if ($RepositoryUrl -notmatch '^https://github\.com/([A-Za-z0-9-]+)/([A-Za-z0-9._-]+)$') {
        throw 'Use a URL like https://github.com/your-name/cheshuya (HTTPS, no extra path).'
    }
    $owner = $Matches[1]
    $repository = $Matches[2]
    $target = "$RepositoryUrl.git"

    $oldRemote = ''
    if ($remoteNames -contains 'origin') {
        $oldRemote = & $script:GitPath remote get-url origin
        if ($LASTEXITCODE -ne 0) { throw 'Could not read the old repository URL.' }
    }
    if ([string]$oldRemote -eq $target) {
        throw 'This is the OLD repository URL. Paste the new repository URL instead.'
    }

    Write-Host "Target: $target"
    Write-Host 'Files that will be included in the next commit:'
    $changes = @(& $script:GitPath -c core.quotepath=false status --short --untracked-files=all)
    if ($LASTEXITCODE -ne 0) { throw 'Could not inspect local changes.' }
    if ($changes.Count -eq 0) {
        Write-Host '  No new local changes. The latest saved version will be pushed.'
    } else {
        $changes | ForEach-Object { Write-Host "  $_" }
        foreach ($entry in $changes) {
            $changedPath = $entry.Substring(3).Trim('"')
            if ($changedPath -match '(?i)(^|[/\\])\.env(\.|$)|\.(pem|p12|pfx|key)$') {
                throw 'A possible secret file was found. Remove it from the project before publishing.'
            }
        }
    }

    if ($CheckOnly) {
        Write-Host 'Check only: no commit, remote change, or upload was made.'
        exit 0
    }

    $answer = Read-Host 'Type PUBLISH to commit these files and upload them'
    if ($answer -cne 'PUBLISH') {
        Write-Host 'Cancelled. Nothing was uploaded.'
        exit 0
    }

    if ($savedRemote) {
        if ([string]$savedRemote -ne $target) {
            $replace = Read-Host "Saved publish target differs. Type CHANGE to use $target"
            if ($replace -cne 'CHANGE') { throw 'Target change cancelled.' }
            Run-Git -GitArgs @('remote', 'set-url', 'publish', $target)
        }
    } else {
        Run-Git -GitArgs @('remote', 'add', 'publish', $target)
    }

    if ($changes.Count -gt 0) {
        Run-Git -GitArgs @('add', '-A')
        $staged = @(& $script:GitPath diff --cached --name-only)
        if ($LASTEXITCODE -ne 0) { throw 'Could not inspect staged files.' }
        if ($staged.Count -gt 0) {
            $message = 'Update site ' + (Get-Date -Format 'yyyy-MM-dd HH:mm')
            Run-Git -GitArgs @('commit', '-m', $message)
        }
    }

    Write-Host 'Uploading to the NEW repository...'
    Run-Git -GitArgs @('-c', "credential.username=$owner", 'push', 'publish', 'HEAD:refs/heads/main')
    $siteUrl = if ($repository -ieq "$owner.github.io") {
        "https://$owner.github.io/"
    } else {
        "https://$owner.github.io/$repository/"
    }
    Write-Host 'Upload complete. GitHub Actions will publish the site shortly.'
    Write-Host "Expected site address: $siteUrl"
    Write-Host 'On the first upload, check Settings > Pages > Build and deployment > Source: GitHub Actions.'
    Write-Host 'You can follow the result in the repository Actions tab.'
    exit 0
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'Nothing was force-pushed. Fix the problem and run this file again.'
    exit 1
}
