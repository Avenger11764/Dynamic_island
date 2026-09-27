$ErrorActionPreference = 'SilentlyContinue'

# Get initial brightness
$last = $null
try {
    $last = (Get-CimInstance -Namespace root/wmi -ClassName WmiMonitorBrightness).CurrentBrightness
} catch {}

if ($last -ne $null) {
    Write-Output "BRIGHTNESS:$last"
}

# Fast poll loop — check brightness every 250ms
# This is the most reliable method across all laptops
while ($true) {
    Start-Sleep -Milliseconds 250
    try {
        $cur = (Get-CimInstance -Namespace root/wmi -ClassName WmiMonitorBrightness).CurrentBrightness
        if ($cur -ne $null -and $cur -ne $last) {
            $last = $cur
            Write-Output "BRIGHTNESS:$cur"
            [Console]::Out.Flush()
        }
    } catch {}
}
