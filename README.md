# Jump Around - Star Wars Runner Game

Un gioco di salto sviluppato in HTML5, CSS3 e JavaScript con un backend serverless su Vercel.

## Setup Locale

### Prerequisiti
- Node.js installato
- npm installato
- MongoDB installato localmente (opzionale)

### Installazione

```bash
npm install
npm start
```

Per il gioco web, apri `index.html` nel browser o servilo con un server HTTP locale.

## Setup su Vercel (Serverless)

### Passo 1: Creare un account MongoDB Atlas

1. Vai su https://www.mongodb.com/cloud/atlas
2. Crea un account gratuito
3. Crea un nuovo cluster (tier gratuito M0)
4. Vai in "Database Access" e crea un utente
5. Vai in "Network Access" e aggiungi `0.0.0.0/0`
6. In "Clusters" clicca "Connect" → "Drivers" e copia la connection string

Esempio:
```
mongodb+srv://username:password@cluster0.mongodb.net/jump-around?retryWrites=true&w=majority
```

### Passo 2: Deployare su Vercel

1. Pusha su GitHub:
   ```bash
   git add .
   git commit -m "Deploy"
   git push origin main
   ```

2. Vai su https://vercel.com
3. Clicca "Add New Project"
4. Importa il repository GitHub
5. **Aggiungi variabili d'ambiente**:
   - Nome: `MONGODB_URI`
   - Valore: La tua connection string MongoDB
6. Clicca "Deploy"

## Come funziona

- **Frontend**: HTML5 + CSS3 + JavaScript (serviti staticamente da Vercel)
- **Backend**: Funzione serverless Vercel (`api/scores.js`)
- **Database**: MongoDB Atlas (cloud)

Il gioco salva i punteggi chiamando `/api/scores` (funzione serverless automaticamente gestita da Vercel).

## Funzionalità

- ✅ Gioco di salto infinito con difficoltà progressiva
- ✅ Ostacoli dinamici e piattaforme di boost
- ✅ Top 10 record globali persistenti su MongoDB
- ✅ Sistema di nome giocatore
- ✅ Supporto mobile responsivo
- ✅ 6 personaggi selezionabili

## Controlli

- **SPAZIO** o **CLICK** per saltare
- **Tasti 1-6** per cambiare personaggio
- **Tocco** per saltare (mobile)
- **Pulsante 🏆** per classifica

## Struttura

```
├── index.html           # HTML
├── style.css            # CSS
├── game.js              # Logica gioco
├── server.js            # Server locale (opzionale)
├── api/
│   └── scores.js        # Funzione serverless Vercel
├── package.json         # Dipendenze
├── vercel.json          # Config Vercel
└── .env.local           # Env locale
```

## Troubleshooting

**I record non si salvano su Vercel:**
- Verifica `MONGODB_URI` in Vercel → Settings → Environment Variables
- Assicurati che il Network Access di MongoDB includa `0.0.0.0/0`
- Controlla che la connection string abbia username e password corretti

**Le modifiche da GitHub non si deployano:**
- Assicurati che `api/scores.js` sia in GitHub
- Fai push delle modifiche: `git push origin main`
- Vercel deploy automaticamente quando riceve un push

**Errore di connessione MongoDB:**
- La connection string deve contenere `username:password`
- Il database user deve essere creato in MongoDB Atlas
- Network Access deve includere l'IP di Vercel
