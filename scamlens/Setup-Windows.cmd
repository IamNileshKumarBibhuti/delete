@echo off
setlocal
cd /d "%~dp0"
title ScamLens - first-time setup
rem This applies only to this process and runs the local bundled script.
rem It does not change your computer's PowerShell execution policy.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup_windows.ps1"
set "SCAMLENS_EXIT=%ERRORLEVEL%"
echo.
if not "%SCAMLENS_EXIT%"=="0" echo Setup needs attention. Read the message above, fix it, and run this file again.
pause
exit /b %SCAMLENS_EXIT%
