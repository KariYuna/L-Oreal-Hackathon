@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0lumiere-ui\scripts\restart.ps1"
if errorlevel 1 pause
