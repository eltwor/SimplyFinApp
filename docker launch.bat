@echo off
chcp 65001 >nul
echo ========================================
echo    SIMPLYFIN - URUCHAMIANIE PROJEKTU
echo ========================================
echo.

echo [1/4] Zatrzymywanie starych kontenerów...
docker-compose down 2>nul

echo [2/4] Uruchamianie kontenerów w tle...
docker-compose up -d --build

if errorlevel 1 (
    echo BŁĄD: Nie udało się uruchomić kontenerów!
    pause
    exit /b 1
)

echo [3/4] Czekanie aż baza PostgreSQL będzie gotowa...
:wait_for_db
timeout /t 2 /nobreak >nul
docker exec simplyfin-db pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    echo    Baza jeszcze nie gotowa, czekam...
    goto wait_for_db
)
echo    ✓ Baza PostgreSQL gotowa!

echo [4/4] Sprawdzanie i inicjalizacja struktury bazy danych...
:: Sprawdź czy tabela users już istnieje
docker exec simplyfin-db psql -U postgres -d simplyfin -tAc "SELECT 1 FROM pg_tables WHERE tablename='users'" 2>nul | findstr "1" >nul
if errorlevel 1 (
    echo    Tworzenie tabel...
    docker exec -i simplyfin-db psql -U postgres -d simplyfin < Database\01_init_struktura.sql
    if errorlevel 1 (
        echo    OSTRZEŻENIE: Wystąpił problem z utworzeniem tabel!
        echo    Sprawdź plik Database\01_init_struktura.sql
    ) else (
        echo    ✓ Tabele utworzone pomyślnie!
    )
) else (
    echo    ✓ Tabele już istnieją, pomijam inicjalizację
)

echo.
echo ========================================
echo      PROJEKT URUCHOMIONY POMYŚLNIE! 
echo ========================================
echo.
echo   Frontend:    http://localhost
echo   Backend API: http://localhost:8000
echo   PostgreSQL:  localhost:5432
echo.
echo Aby zatrzymać projekt, użyj: docker-compose down
echo Aby zobaczyć logi: docker-compose logs -f
echo.
pause