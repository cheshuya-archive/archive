@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0publish-site.ps1"
set "publish_result=%ERRORLEVEL%"
echo.
if not "%publish_result%"=="0" echo Publishing did not finish. See the message above.
pause
exit /b %publish_result%
