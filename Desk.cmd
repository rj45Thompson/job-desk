@echo off
cd /d "%~dp0"
py -3 desk.py %*
if errorlevel 1 pause
