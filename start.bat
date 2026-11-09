@echo off
title Rahama Essentials - Store and Admin
cd /d "%~dp0"
if not exist backend\.env (
  echo Please run setup.bat first.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Dependencies missing. Please run setup.bat first.
  pause
  exit /b 1
)
echo Starting backend API and website. Keep this window open.
npm run dev
pause
