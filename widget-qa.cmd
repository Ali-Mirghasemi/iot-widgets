@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0widget-qa.ps1" %*
set "EXITCODE=%ERRORLEVEL%"
endlocal & exit /b %EXITCODE%
