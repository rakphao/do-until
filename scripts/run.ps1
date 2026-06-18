#requires -Version 5.1
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& node (Join-Path $scriptDir "run.mjs") @args
exit $LASTEXITCODE