@echo off
title Rahama Essentials Setup
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js LTS from https://nodejs.org/ first.
  pause
  exit /b 1
)
node scripts\setup.mjs
if errorlevel 1 (
  echo Setup failed. Check the error above.
  pause
  exit /b 1
)
echo.
echo Setup complete. Double-click start.bat to run the shop.
pause
