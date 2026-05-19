@echo off
echo ============================================
echo MEDIA 8 - Docker Compose Startup
echo ============================================
echo.
echo Starting containers...
docker-compose up --build -d
echo.
echo Waiting for services to start...
timeout /t 5 /nobreak >nul
echo.
echo ============================================
echo Application Started!
echo ============================================
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5261
echo Swagger:  http://localhost:5261/swagger
echo.
echo To view logs: docker-compose logs -f
echo To stop:      docker-compose down
echo ============================================
echo.
