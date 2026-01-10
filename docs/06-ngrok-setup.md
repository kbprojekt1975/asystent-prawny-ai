# 06 - Testowanie na Urządzeniach Mobilnych (Local Mobile Testing)

Aby przetestować aplikację na telefonie, mając uruchomione lokalne emulatory Firebase i serwer Vite, masz dwie główne drogi.

## Metoda 1: Sieć Lokalna Wi-Fi (Zalecane)
Jest to najszybsza i najbardziej stabilna metoda, pod warunkiem, że telefon i komputer są w tej samej sieci Wi-Fi.

### 1. Sprawdź swój lokalny adres IP
W terminalu (PowerShell) wpisz:
```powershell
ipconfig
```
Szukaj `IPv4 Address` (np. `192.168.1.15`).

### 2. Uruchom serwery na wszystkich interfejsach
Musisz upewnić się, że emulatory i Vite słuchają nie tylko na `localhost`, ale na wszystkich adresach.

**Vite:**
`package.json` ma już flagę `--host`, więc wystarczy:
```bash
npm run dev
```

**Firebase Emulators:**
Uruchom z flagą hosta:
```bash
firebase emulators:start --host 0.0.0.0
```

### 3. Otwórz aplikację na telefonie
W przeglądarce na telefonie wpisz:
`http://[TWOJE_IP]:5173` (np. `http://192.168.1.15:5173`)

Dzięki zmianom w `services/firebase.ts`, aplikacja automatycznie wykryje, że jesteś w sieci lokalnej i połączy się z emulatorami na Twoim komputerze.

---

## Metoda 2: ngrok (Dostęp Zdalny / LTE)
Jeśli nie jesteś w tej samej sieci Wi-Fi lub chcesz udostępnić aplikację komuś innemu.

> [!IMPORTANT]
> Darmowa wersja ngrok pozwala na tylko jeden aktywny tunel (jeden adres URL). Ponieważ Firebase używa wielu portów (Auth, Firestore, Functions), pełne testowanie przez darmowy ngrok jest trudne.

### 1. Uruchom tunel dla Frontend
```bash
ngrok http 5173
```
Skopiuj adres (np. `https://xyz.ngrok-free.app`).

### 2. Otwórz na telefonie
Otwórz otrzymany adres na telefonie. 

**Uwaga:** Jeśli aplikacja wymaga dostępu do bazy danych (Firestore) lub logowania (Auth), te połączenia mogą się nie udać na darmowym ngrok, ponieważ próbowałyby połączyć się z `xyz.ngrok-free.app:8080`, co nie jest otwarte.

---

## Zaawansowana konfiguracja ngrok (ngrok.yml)
Jeśli masz konto ngrok, możesz spróbować uruchomić wiele tuneli jednocześnie, ale wymaga to konfiguracji w pliku.

Utwórz plik `ngrok.yml`:
```yaml
version: "2"
authtoken: TWOJ_TOKEN
tunnels:
  frontend:
    proto: http
    addr: 5173
  auth:
    proto: http
    addr: 9099
  firestore:
    proto: http
    addr: 8080
  functions:
    proto: http
    addr: 5001
```

Uruchomienie: `ngrok start --all --config ngrok.yml`

*Uwaga: Każdy tunel dostanie INNY adres URL w darmowej wersji, co uniemożliwia proste działanie `firebase.ts` bez dodatkowej logiki mapowania hostów.*
