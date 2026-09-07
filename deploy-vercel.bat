@echo off
REM =====================================================
REM  GoAbility - Deploy to Vercel (frontend + backend)
REM  Prerequisite: npm i -g vercel && vercel login
REM =====================================================

echo.
echo =========== 1/4 Deploying BACKEND (Express API) ===========
cd /d "%~dp0backend-mysql"
call vercel --prod --yes --name goability-api
if %errorlevel% neq 0 (
    echo [FAILED] Backend deploy. Make sure you are logged in: vercel login
    pause
    exit /b 1
)

echo.
echo =========== 2/4 Capture backend URL ===========
echo The backend URL will be shown above (e.g. https://goability-api.vercel.app)
echo.

echo.
echo =========== 3/4 Deploying FRONTEND (Next.js) ===========
cd /d "%~dp0frontend"
call vercel --prod --yes --name goability-frontend
if %errorlevel% neq 0 (
    echo [FAILED] Frontend deploy.
    pause
    exit /b 1
)

echo.
echo =========== 4/4 Done ===========
echo.
echo CRITICAL next steps - set these in the Vercel dashboard:
echo.
echo  BACKEND project (goability-api):
echo    DB_URL=mysql://USER:PASS@HOST:3306/goability?ssl-mode=REQUIRED
echo    DB_SSL=true
echo    JWT_SECRET= (strong random string)
echo    FRONTEND_URL=https://goability-frontend.vercel.app
echo    NODE_ENV=production
echo.
echo  FRONTEND project (goability-frontend):
echo    NEXT_PUBLIC_API_URL=https://goability-api.vercel.app/api
echo.
pause