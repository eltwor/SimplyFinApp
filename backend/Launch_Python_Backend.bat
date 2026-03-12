@echo off
call "C:\Users\Eli\Documents\ThesisSimplyfin\SimplyFin App\backend\SimplyFinVenv\Scripts\activate.bat"
cd /d "C:\Users\Eli\Documents\ThesisSimplyfin\SimplyFin App\backend\"
uvicorn app.main:app --reload
pause