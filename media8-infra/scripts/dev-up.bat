@echo off
echo Starting Media8 in Docker...
docker-compose up --build -d
echo.
echo Application started!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5261
echo.
echo Logs: docker-compose logs -f
pause
