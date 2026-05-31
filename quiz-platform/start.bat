@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ============================================
echo   Mini Quiz Platform -- Windows Launcher
echo ============================================
echo.

REM Ensure postgres is running
echo  [1/4] Starting PostgreSQL...
docker compose up -d postgres 2>nul || echo  [WARN] Docker not running; assuming Postgres is available

REM Install deps if needed
if not exist "node_modules" (
  echo  [2/4] Installing dependencies...
  call npm install --silent
)

REM Migrate + seed if needed
if not exist "backend\prisma\migrations" (
  echo  [3/4] Running database migration...
  call npm run migrate 2>nul || echo  [WARN] Migration skipped
  echo  [3/4] Seeding sample data...
  call npm run seed 2>nul || echo  [WARN] Seed skipped
)

echo  [4/4] Launching backend + frontend...
echo.

REM Start dev servers in background
start /B npm run dev > "%TEMP%\quiz-platform-dev.log" 2>&1

REM Wait for servers to be ready
echo  Waiting for servers to be ready...
set BACKEND_URL=
set FRONTEND_URL=
:wait
timeout /t 2 /nobreak >nul
if "%BACKEND_URL%"=="" (
  powershell -Command "try { $log = Get-Content '%TEMP%\quiz-platform-dev.log' -ErrorAction Stop; $line = $log | Select-String 'Backend URL:' | Select-Object -Last 1; if ($line) { $url = $line.ToString().Substring($line.ToString().LastIndexOf(' ')+1); Write-Host $url; exit 0 } } catch { exit 1 }" 2>nul > "%TEMP%\quiz-be-url.txt"
  set /p BACKEND_URL=<"%TEMP%\quiz-be-url.txt" 2>nul
  del "%TEMP%\quiz-be-url.txt" 2>nul
)
if "%FRONTEND_URL%"=="" (
  powershell -Command "try { $log = Get-Content '%TEMP%\quiz-platform-dev.log' -ErrorAction Stop; $line = $log | Select-String 'Frontend URL:' | Select-Object -Last 1; if ($line) { $url = $line.ToString().Substring($line.ToString().LastIndexOf(' ')+1); Write-Host $url; exit 0 } } catch { exit 1 }" 2>nul > "%TEMP%\quiz-fe-url.txt"
  set /p FRONTEND_URL=<"%TEMP%\quiz-fe-url.txt" 2>nul
  del "%TEMP%\quiz-fe-url.txt" 2>nul
)
if "%BACKEND_URL%"=="" goto wait
if "%FRONTEND_URL%"=="" goto wait

if "%BACKEND_URL%"=="" set BACKEND_URL=http://localhost:3000
if "%FRONTEND_URL%"=="" set FRONTEND_URL=http://localhost:5173

echo  ^> Backend ready at %BACKEND_URL%
echo  ^> Frontend ready at %FRONTEND_URL%
echo.
echo ============================================
echo   Mini Quiz Platform is running!
echo.
echo   Frontend : %FRONTEND_URL%
echo   Backend  : %BACKEND_URL%
echo.
echo   Demo accounts:
echo     admin@quiz.com / password123
echo     user1@quiz.com / password123
echo     user2@quiz.com / password123
echo ============================================
echo.

REM Open browser
start "" "%FRONTEND_URL%"

echo Press Ctrl+C to stop the servers.
echo.
pause >nul
