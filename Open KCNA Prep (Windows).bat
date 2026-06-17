@echo off
REM Double-click to launch KCNA Prep on Windows.
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
  py serve.py
  goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
  python serve.py
  goto :eof
)

echo Python 3 is required but was not found.
echo Install it from https://www.python.org/downloads/ and try again.
pause
