const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const scoresFile = path.join(__dirname, 'scores.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Inizializza file scores se non esiste
if (!fs.existsSync(scoresFile)) {
    fs.writeFileSync(scoresFile, JSON.stringify([]));
}

// Ottieni top 10 punteggi
app.get('/api/scores', (req, res) => {
    try {
        const scores = JSON.parse(fs.readFileSync(scoresFile, 'utf8'));
        const topScores = scores
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
        res.json(topScores);
    } catch (error) {
        res.status(500).json({ error: 'Errore nel recupero dei punteggi' });
    }
});

// Salva nuovo punteggio
app.post('/api/scores', (req, res) => {
    try {
        const { playerName, score } = req.body;
        
        if (!playerName || score === undefined) {
            return res.status(400).json({ error: 'Nome e punteggio richiesti' });
        }
        
        let scores = JSON.parse(fs.readFileSync(scoresFile, 'utf8'));
        
        // Aggiungi nuovo punteggio
        scores.push({
            playerName: playerName.substring(0, 20),
            score: parseInt(score),
            timestamp: new Date().toISOString()
        });
        
        // Salva il file
        fs.writeFileSync(scoresFile, JSON.stringify(scores, null, 2));
        
        // Ritorna top 10 aggiornato
        const topScores = scores
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
        
        res.json({ success: true, topScores });
    } catch (error) {
        res.status(500).json({ error: 'Errore nel salvataggio del punteggio' });
    }
});

app.listen(PORT, () => {
    console.log(`Server in esecuzione su http://localhost:${PORT}`);
});
