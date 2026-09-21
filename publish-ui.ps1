param(
    [string]$Source = ".\IRIS\ui",
    [string]$Destination = "C:\inetpub\KWCompare"
)

$sourcePath = Resolve-Path -Path $Source -ErrorAction Stop

if (-not (Test-Path -Path $Destination)) {
    New-Item -ItemType Directory -Path $Destination -Force | Out-Null
}

Copy-Item -Path (Join-Path $sourcePath.Path '*') -Destination $Destination -Recurse -Force

Write-Host "Published KW Compare UI to $Destination"
Get-ChildItem -Path $Destination -File | Select-Object Name, Length | Format-Table -AutoSize
