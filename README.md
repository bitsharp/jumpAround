# Jump Around - Star Wars Runner Game

Un gioco di salto sviluppato in HTML5, CSS3 e JavaScript con backend serverless su Vercel.

## Setup Locale

### Prerequisiti
- Node.js installato
- npm installato
- MongoDB installato localmente (opzionale per test locali)

### Installazione

```bash
# Installa dipendenze
npm install

# (Opzionale) Testa la connessione a MongoDB locale
npm run test-db

# Avvia il server locale per sviluppo
npm start
```

Per giocare, apri `http://localhost:3000` (se usi il server) oppure servici il file `index.html` con un HTTP server.

## Setup su Vercel (Serverless) - ⭐ METODO CONSIGLIATO

### Passo 1: MongoDB Atlas Setup

1. Vai su https://www.mongodb.com/cloud/atlas
2. Crea account gratuito
3. Crea cluster gratuito M0
4. In "Database Access", crea un utente (salva username e password)
5. In "Network Access", aggiungi `0.0.0.0/0`
6. In "Clusters", clicca "Connect" → scegli "Drivers"
7. Copia la connection string e sostituisci `<username>:<password>`

Esempio finale:
```
mongodb+srv://tuousername:tuapassword@cluster0.mongodb.net/jump-around?retryWrites=true&w=majority
```

### Passo 2: Configurare Vercel

**Opzione A: Tramite Dashboard Vercel (più semplice)**

1. Vai su https://vercel.com
2. Clicca "Add New Project"
3. Importa il repository GitHub
4. Prima di deployare, vai a "Environment Variables"
5. Aggiungi:
   - **Key**: `MONGODB_URI`
   - **Value**: La tua connection string MongoDB (da Passo 1)
6. Clicca "Deploy"

**Opzione B: Tramite CLI Vercel**

```bash
# Installa Vercel CLI
npm install -g vercel

# Deploy (ti chiederà le variabili d'ambiente)
vercel

# Successivamente, per aggiornare:
vercel --prod
```

### Passo 3: Verifica il Deploy

- Aspetta che Vercel finisca il deploy
- Visita l'URL fornito da Vercel (es: https://jump-around-xyz.vercel.app)
- Gioca e verifica che i record si salvino

## Come funziona l'architettura

```
┌─────────────────────────────────────────┐
│     Browser del Giocatore                │
│  (HTML5 + CSS + JavaScript)              │
│  ├─ index.html                           │
│  ├─ style.css                            │
│  └─ game.js                              │
└─────────┬───────────────────────────────┘
          │ Quando finisce la partita
          │ Invia punteggio via fetch a /api/scores
          ▼
┌─────────────────────────────────────────┐
│     Vercel Serverless Function          │
│  (api/scores.js)                         │
│  ├─ Riceve il punteggio                 │
│  ├─ Si connette a MongoDB                │
│  └─ Salva e ritorna top 10               │
└─────────┬───────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│  MongoDB Atlas (Cloud)                   │
│  ├─ Salva record                         │
│  └─ Ritorna top 10                       │
└─────────────────────────────────────────┘
```

## File Importanti

```
jumpAround/
├── index.html          # Pagina HTML principale
├── style.css           # Stili CSS
├── game.js             # Logica del gioco (IMPORTANTE: relative path /api/scores)
├── api/
│   └── scores.js       # Funzione serverless Vercel (CommonJS)
├── server.js           # Server Express (solo per sviluppo locale)
├── package.json        # Dipendenze Node.js
├── vercel.json         # Configurazione Vercel
├── .env.local          # Variabili d'ambiente locali
└── test-db.js          # Test connessione MongoDB
```

## Risoluzione Problemi

### "I record non si salvano"
```
✓ Verifica che MONGODB_URI sia configurato in Vercel (Settings → Environment Variables)
✓ Controlla la connection string: deve avere username:password
✓ Assicurati che il Network Access di MongoDB includa 0.0.0.0/0
✓ Prova il test locale: npm run test-db
```

### "Vercel non deploya le modifiche da GitHub"
```
✓ Assicurati di avere fatto push su GitHub:
  git add .
  git commit -m "Update"
  git push origin main

✓ Controlla che il file api/scores.js sia in GitHub (non nel .gitignore)

✓ Verifica che vercel.json sia presente e valido

✓ Vai su Vercel → Project Settings → Deployments
  e verifica lo stato del build
```

### "Errore 'require is not defined' o simile"
```
✓ Assicurati che api/scores.js usi CommonJS (require, module.exports)
✓ Non usare import/export (ES modules) in serverless functions
✓ Il package.json NON deve avere "type": "module"
```

### "Connection timeout a MongoDB"
```
✓ La connection string deve contenere il database name:
  mongodb+srv://user:pass@cluster.mongodb.net/jump-around

✓ Network Access deve essere 0.0.0.0/0 (non specifico)

✓ Verifica il database user:
  - Deve essere creato in "Database Access"
  - Non è l'account MongoDB Atlas, è un utente del database
```

## Come deployare gli aggiornamenti

```bash
# 1. Fai le modifiche al codice
# 2. Testa localmente
# 3. Commit su Git
git add .
git commit -m "Descrizione modifiche"
git push origin main

# Vercel deploierà automaticamente!
# (Puoi seguire il deploy in Vercel Dashboard)
```

## Funzionalità del Gioco

- ✅ Gioco di salto infinito
- ✅ Difficoltà progressiva
- ✅ Ostacoli e piattaforme di boost
- ✅ **Top 10 record globali persistenti**
- ✅ Sistema di nome giocatore
- ✅ Supporto mobile responsivo
- ✅ 6 personaggi selezionabili

## Controlli

| Azione | Tasti |
|--------|-------|
| Saltare | SPAZIO, CLICK, TOUCH |
| Cambiar personaggio | 1-6 |
| Visualizzare record | Pulsante 🏆 |
| Chiudere record | Tasto ✕ |
