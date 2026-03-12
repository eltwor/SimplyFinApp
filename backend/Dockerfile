# Bierzemy oficjalny Python image jako podstawę
FROM python:3.12-slim

# Ustawiamy katalog robczy wewnątrz kontainera
WORKDIR /app

# Najpierw kopiujemy TYLKO requirements.txt
# (Docker cache — jeśli się nie zmieni, nie będzie reinstalować)
COPY requirements.txt .

# Instalujemy zależności
RUN pip install --no-cache-dir -r requirements.txt

# Kopiujemy reszta kodu aplikacji
COPY . .

# Kontainer będzie nasłuchiwać na porcie 8000
EXPOSE 8000

# Komenda uruchomienia aplikacji
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]