const mongoose = require('mongoose');

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

const Score = mongoose.models.Score || mongoose.model('Score', scoreSchema);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jump-around';

async function connectDB() {
    if (mongoose.connections[0].readyState) {
        return;
    }

    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connessione a MongoDB stabilita');
    } catch (error) {
        console.error('Errore di connessione a MongoDB:', error.message);
    }
}

module.exports = async function handler(req, res) {
    await connectDB();

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        try {
            const scores = await Score.find()
                .sort({ score: -1 })
                .limit(10)
                .lean();
            return res.status(200).json(scores);
        } catch (error) {
            console.error('Errore nel recupero dei punteggi:', error);
            return res.status(500).json({ error: 'Errore nel recupero dei punteggi' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { playerName, score } = req.body;

            if (!playerName || score === undefined) {
                return res.status(400).json({ error: 'Nome e punteggio richiesti' });
            }

            const newScore = new Score({
                playerName: playerName.substring(0, 20),
                score: parseInt(score),
                timestamp: new Date()
            });

            await newScore.save();

            const topScores = await Score.find()
                .sort({ score: -1 })
                .limit(10)
                .lean();

            return res.status(200).json({ success: true, topScores });
        } catch (error) {
            console.error('Errore nel salvataggio del punteggio:', error);
            return res.status(500).json({ error: 'Errore nel salvataggio del punteggio' });
        }
    }

    return res.status(405).json({ error: 'Metodo non consentito' });
}
