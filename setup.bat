@echo off
echo ========================================
echo  GoAbility - Project Setup
echo ========================================
echo.
echo Installing backend dependencies...
cd /d "%~dp0backend-mysql"
call npm install
if %errorlevel% neq 0 (
    echo [FAILED] Backend dependencies
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed
echo.
echo Installing frontend dependencies...
cd /d "%~dp0frontend"
call npm install
if %errorlevel% neq 0 (
    echo [FAILED] Frontend dependencies
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed
echo.
echo ========================================
echo  Setup complete!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure MySQL is running
echo 2. Create database: CREATE DATABASE goability;
echo 3. Run: cd backend-mysql ^&^& npm run setup
echo 4. Run: cd backend-mysql ^&^& npm run seed
echo 5. Edit backend-mysql/.env with your DB credentials
echo 6. Start backend: cd backend-mysql ^&^& npm run dev
echo 7. Start frontend: cd frontend ^&^& npm run dev
echo.
pause
