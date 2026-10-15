@echo off
setlocal
cd /d "%~dp0"
title ScamLens - local app
rem Process-only execution policy; no system settings are changed.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup_windows.ps1" -Start
set "SCAMLENS_EXIT=%ERRORLEVEL%"
if not "%SCAMLENS_EXIT%"=="0" (
    echo.
    echo ScamLens could not start. Read the message above.
    pause
)
exit /b %SCAMLENS_EXIT%
