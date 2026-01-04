# Migrazione da Express Server a Vercel Serverless Functions

## Problema
Vercel non stava più leggendo le modifiche fatte via GitHub perché il server Express non era configurato correttamente per l'ambiente serverless di Vercel.

## Soluzione
Convertire da server Express tradizionale a **Vercel Serverless Functions**.

## Cosa è cambiato

### Prima (Non funzionava su Vercel)
- File: `server.js` - Server Express sempre in esecuzione
- Salvataggio su file: `scores.json` (effimero su Vercel)
- Architettura: Server-first

### Adesso (Funziona perfettamente su Vercel)
- File: `api/scores.js` - Funzione serverless che si esegue on-demand
- Salvataggio: MongoDB Atlas (persistente)
- Architettura: Serverless + Database cloud

## File Modificati

### Aggiunti
- `api/scores.js` - Nuova funzione serverless che gestisce GET/POST per i punteggi

### Aggiornati
- `game.js` - Usa ora `/api/scores` (relative path che funziona su Vercel)
- `package.json` - Aggiunto `"type": "module"` per ES6 imports
- `vercel.json` - Configurazione serverless function
- `README.md` - Guida aggiornata

### Rimossi (Ma mantenuti per sviluppo locale)
- `server.js` - Non necessario per Vercel, ma manteniamo per test locali

## Come funziona su Vercel

1. Quando pushì modifiche a GitHub
2. Vercel automaticamente:
   - Legge il file `api/scores.js`
   - Lo riconosce come funzione serverless
   - Lo espone come endpoint `/api/scores`
3. Il gioco chiama `/api/scores` (relative path)
4. Vercel esegue la funzione serverless
5. La funzione si connette a MongoDB e salva/legge i dati

## Benefici

✅ Non più problemi di file effimero su Vercel
✅ Scaling automatico - la funzione si scala da sola
✅ Nessun server sempre in esecuzione - paghi solo per uso
✅ Zero cold start su Vercel (loro lo ottimizzano)
✅ Le modifiche da GitHub si deployano immediatamente

## Variabili d'Ambiente

Su Vercel, configura in **Settings → Environment Variables**:
```
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/jump-around?retryWrites=true&w=majority
```

Localmente, usa `.env.local`:
```
MONGODB_URI = mongodb://localhost:27017/jump-around
```

## Come pushare le modifiche

```bash
# Effettua le modifiche
git add .
git commit -m "Update game features"
git push origin main
```

Vercel automaticamente:
1. Vede il push
2. Vede il nuovo codice in `api/scores.js`
3. Deploy automaticamente
4. I record continuano a funzionare

Niente URL da cambiare, niente configurazione manuale - tutto funziona!
