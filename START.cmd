@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Please run npm install in this folder first.
  pause
  exit /b 1
)
npm.cmd run dev -- --open
