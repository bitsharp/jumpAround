# Jump Around - Star Wars Runner Game

Un gioco di salto sviluppato in HTML5, CSS3 e JavaScript con un backend Node.js.

## Setup Locale

### Prerequisiti
- Node.js installato
- npm installato
- MongoDB installato localmente (opzionale - il server funzionerà anche senza)

### Installazione

```bash
npm install
npm start
```

Il server partirà su `http://localhost:3000`

## Setup su Vercel

### Passo 1: Creare un account MongoDB Atlas

1. Vai su https://www.mongodb.com/cloud/atlas
2. Crea un account gratuito
3. Crea un nuovo cluster (scegli il tier gratuito M0)
4. Attendi che il cluster sia pronto
5. Vai in "Database Access" e crea un utente
6. Vai in "Network Access" e aggiungi `0.0.0.0/0` per accettare connessioni da qualsiasi IP
7. Torna in "Clusters" e clicca "Connect"
8. Scegli "Drivers" e copia la connection string
9. Sostituisci `<username>` e `<password>` con le credenziali create

### Passo 2: Deployare su Vercel

1. Pusha il progetto su GitHub
2. Vai su https://vercel.com
3. Importa il progetto GitHub
4. Nelle environment variables, aggiungi:
   - **Nome**: `MONGODB_URI`
   - **Valore**: La tua connection string MongoDB Atlas (con username e password)
5. Deploy!

### Passo 3: Aggiornare l'app

Nel file `game.js`, aggiorna l'URL del server da `http://localhost:3000` all'URL di Vercel:

Cerca tutte le occorrenze di `http://localhost:3000` e sostituiscile con il tuo URL Vercel.

Esempio: `https://jump-around-abc123.vercel.app`

## Funzionalità

- ✅ Gioco di salto infinito
- ✅ Ostacoli e aculei dinamici
- ✅ Piattaforme di boost che aumentano l'altezza del salto
- ✅ Difficoltà progressiva
- ✅ Top 10 record globali salvati in MongoDB
- ✅ Sistema di nome giocatore
- ✅ Supporto mobile responsivo
- ✅ Sei personaggi selezionabili (1-6)

## Controlli

- **SPAZIO** o **CLICK** per saltare
- **Tasti 1-6** per cambiare personaggio
- **Tocco dello schermo** per saltare (mobile)
- **Pulsante Record** per visualizzare la classifica globale

## Struttura del Progetto

```
jumpAround/
├── index.html      # Struttura HTML
├── style.css       # Stili CSS
├── game.js         # Logica del gioco (client-side)
├── server.js       # Server Express (backend)
├── package.json    # Dipendenze Node.js
├── .env.local      # Variabili di ambiente locali
├── .env.example    # Template per variabili di ambiente
└── vercel.json     # Configurazione Vercel
```

## Note Importanti

- Su Vercel, il database utilizzato è MongoDB Atlas (cloud)
- Localmente, il server si connette automaticamente a MongoDB locale se disponibile
- Se MongoDB non è disponibile, il server continuerà a funzionare ma i record non persisteranno
- Assicurati che la tua connection string MongoDB sia corretta su Vercel
