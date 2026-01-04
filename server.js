const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Connessione a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jump-around';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connessione a MongoDB stabilita');
}).catch(err => {
    console.log('Errore di connessione a MongoDB:', err.message);
    console.log('La app continuerà in modalità offline');
});

// Schema del punteggio
const scoreSchema = new mongoose.Schema({
    playerName: {
        type: String,
        required: true,
        maxlength: 20
    },
    score: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Score = mongoose.model('Score', scoreSchema);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Ottieni top 10 punteggi
app.get('/api/scores', async (req, res) => {
    try {
        const scores = await Score.find()
            .sort({ score: -1 })
            .limit(10)
            .lean();
        res.json(scores);
    } catch (error) {
        console.error('Errore nel recupero dei punteggi:', error);
        res.status(500).json({ error: 'Errore nel recupero dei punteggi' });
    }
});

// Salva nuovo punteggio
app.post('/api/scores', async (req, res) => {
    try {
        const { playerName, score } = req.body;
        
        if (!playerName || score === undefined) {
            return res.status(400).json({ error: 'Nome e punteggio richiesti' });
        }
        
        // Crea nuovo punteggio
        const newScore = new Score({
            playerName: playerName.substring(0, 20),
            score: parseInt(score),
            timestamp: new Date()
        });
        
        // Salva nel database
        await newScore.save();
        
        // Ritorna top 10 aggiornato
        const topScores = await Score.find()
            .sort({ score: -1 })
            .limit(10)
            .lean();
        
        res.json({ success: true, topScores });
    } catch (error) {
        console.error('Errore nel salvataggio del punteggio:', error);
        res.status(500).json({ error: 'Errore nel salvataggio del punteggio' });
    }
});

app.listen(PORT, () => {
    console.log(`Server in esecuzione su http://localhost:${PORT}`);
});
