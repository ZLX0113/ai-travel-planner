@echo off
cd /d "%~dp0"

echo Starting tunnel...
echo Once you see a URL, share it with others.
echo Press Ctrl+C to stop.
echo.
npx localtunnel --port 5173

pause