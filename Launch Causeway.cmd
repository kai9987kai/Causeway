@echo off
setlocal
cd /d "%~dp0"
python -B tools\serve.py
pause
