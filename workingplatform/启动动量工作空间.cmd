@echo off
chcp 65001 >nul
setlocal

cd /d "%~dp0"
set "PORT=5173"
set "URL=http://localhost:%PORT%"

powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort %PORT% -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if %errorlevel%==0 (
  start "" "%URL%"
  exit /b 0
)

start "" "%URL%"
node server.js

