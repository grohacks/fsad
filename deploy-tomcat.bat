@echo off
REM Tomcat Deployment Script for Health Records System
REM This script automates the deployment process to local Tomcat

echo ========================================
echo   Health Records - Tomcat Deployment
echo ========================================

REM Configuration
set TOMCAT_HOME=C:\Program Files\Apache Software Foundation\Tomcat 10.0
set TOMCAT_WEBAPPS=%TOMCAT_HOME%\webapps
set APP_NAME=health-records
set WAR_FILE=%APP_NAME%.war
set PROJECT_DIR=%~dp0

echo Project Directory: %PROJECT_DIR%
echo Tomcat Home: %TOMCAT_HOME%

REM Step 1: Build the application
echo.
echo [1/6] Building application...
echo ========================================
cd /d "%PROJECT_DIR%"
call mvn clean package -DskipTests
if errorlevel 1 (
    echo ERROR: Maven build failed!
    pause
    exit /b 1
)

REM Check if WAR file exists
if not exist "target\%WAR_FILE%" (
    echo ERROR: WAR file not found at target\%WAR_FILE%
    pause
    exit /b 1
)
echo ✅ WAR file built successfully: target\%WAR_FILE%

REM Step 2: Stop Tomcat
echo.
echo [2/6] Stopping Tomcat service...
echo ========================================
net stop Tomcat10 2>nul
if errorlevel 1 (
    echo WARNING: Tomcat service was not running or failed to stop
) else (
    echo ✅ Tomcat service stopped
)

REM Wait for Tomcat to stop
echo Waiting for Tomcat to stop completely...
timeout /t 10 /nobreak > nul

REM Step 3: Remove old deployment
echo.
echo [3/6] Removing old deployment...
echo ========================================
if exist "%TOMCAT_WEBAPPS%\%WAR_FILE%" (
    del "%TOMCAT_WEBAPPS%\%WAR_FILE%"
    echo ✅ Old WAR file removed
)
if exist "%TOMCAT_WEBAPPS%\%APP_NAME%" (
    rmdir /s /q "%TOMCAT_WEBAPPS%\%APP_NAME%"
    echo ✅ Old application directory removed
)

REM Step 4: Deploy new WAR file
echo.
echo [4/6] Deploying new WAR file...
echo ========================================
copy "target\%WAR_FILE%" "%TOMCAT_WEBAPPS%\"
if errorlevel 1 (
    echo ERROR: Failed to copy WAR file to Tomcat webapps
    pause
    exit /b 1
)
echo ✅ WAR file deployed to: %TOMCAT_WEBAPPS%\%WAR_FILE%

REM Step 5: Start Tomcat
echo.
echo [5/6] Starting Tomcat service...
echo ========================================
net start Tomcat10
if errorlevel 1 (
    echo ERROR: Failed to start Tomcat service
    pause
    exit /b 1
)
echo ✅ Tomcat service started

REM Step 6: Wait for deployment and health check
echo.
echo [6/6] Waiting for application deployment...
echo ========================================
echo Waiting for Tomcat to start and deploy the application...
timeout /t 30 /nobreak > nul

echo.
echo Checking if application is accessible...
curl -f http://localhost:8080/ > nul 2>&1
if errorlevel 1 (
    echo WARNING: Tomcat may still be starting up
) else (
    echo ✅ Tomcat is running
)

echo.
echo ========================================
echo   🎉 Deployment Completed!
echo ========================================
echo.
echo 🔗 Access your application:
echo   • Tomcat Manager: http://localhost:8080/manager
echo   • Your App:       http://localhost:8080/%APP_NAME%
echo.
echo 📋 Login credentials for Tomcat Manager:
echo   • Username: admin
echo   • Password: admin123
echo.
echo 🔍 If there are issues, check:
echo   • Tomcat logs: %TOMCAT_HOME%\logs
echo   • Jenkins console for build details
echo   • Database connectivity
echo.
echo Press any key to open Tomcat Manager...
pause > nul
start http://localhost:8080/manager

exit /b 0