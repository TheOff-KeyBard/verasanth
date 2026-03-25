# Character Generator Plus Structure Discovery Script
# Run this from the Character Generator Plus install folder (or pass path as argument)
# Output: cgp_structure.txt

param(
    [string]$CgpPath = "."
)

$outputFile = Join-Path $PSScriptRoot "cgp_structure.txt"
$depth = 4

Write-Host "Discovering Character Generator Plus structure..."
Write-Host "Path: $CgpPath"
Write-Host "Output: $outputFile"

$items = Get-ChildItem -Path $CgpPath -Recurse -Depth $depth -ErrorAction SilentlyContinue | 
    Select-Object FullName, @{N='Type';E={if($_.PSIsContainer){'DIR'}else{'FILE'}}}

$items | ForEach-Object { $_.FullName } | Out-File -FilePath $outputFile -Encoding utf8

Write-Host "Done. Structure saved to $outputFile"
Write-Host "Share this file to complete the LPC conversion configuration."
