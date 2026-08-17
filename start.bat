@echo off
title AI Travel Planner

echo ================================
echo   AI Travel Planner - Starting...
echo ================================
echo.

:: Start Backend
echo [1/2] Starting backend...
start "AI-Backend" cmd /c "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

:: Wait
timeout /t 3 /nobreak >nul

:: Start Frontend
echo [2/2] Starting frontend...
start "AI-Frontend" cmd /c "cd /d %~dp0frontend && npx vite --host 0.0.0.0 --port 5173"

:: Wait
timeout /t 3 /nobreak >nul

:: Open Browser
echo.
echo Opening browser...
start http://localhost:5173

echo.
echo ================================
echo   Done!
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:8000
echo   API Docs : http://localhost:8000/docs
echo ================================
echo.
echo Close this window to stop the launcher.
echo To stop services, close the "AI-Backend" and "AI-Frontend" windows.
pause