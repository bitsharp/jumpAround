const mongoose = require('mongoose');

const activePlayerSchema = new mongoose.Schema({
    playerName: {
        type: String,
        required: true
    },
    deviceType: {
        type: String,
        enum: ['mobile', 'desktop'],
        default: 'desktop'
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    lastUpdate: {
        type: Date,
        default: Date.now
    }
});

const ActivePlayer = mongoose.models.ActivePlayer || mongoose.model('ActivePlayer', activePlayerSchema);

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
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
    }
}

module.exports = async function handler(req, res) {
    await connectDB();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        try {
            // Pulisci giocatori inattivi (non aggiornati da più di 2 minuti)
            const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
            await ActivePlayer.deleteMany({ lastUpdate: { $lt: twoMinutesAgo } });

            // Conta i giocatori attivi
            const activeCount = await ActivePlayer.countDocuments();
            const activePlayers = await ActivePlayer.find().lean();

            return res.status(200).json({ 
                count: activeCount,
                players: activePlayers
            });
        } catch (error) {
            console.error('Error getting active players:', error);
            return res.status(500).json({ error: 'Error getting active players' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { playerName, deviceType, action } = req.body;

            if (!playerName) {
                return res.status(400).json({ error: 'Player name is required' });
            }

            if (action === 'start') {
                // Aggiungi giocatore attivo
                const existing = await ActivePlayer.findOne({ playerName });
                if (existing) {
                    await ActivePlayer.updateOne(
                        { playerName },
                        { lastUpdate: new Date() }
                    );
                } else {
                    await ActivePlayer.create({
                        playerName,
                        deviceType: deviceType || 'desktop',
                        startTime: new Date(),
                        lastUpdate: new Date()
                    });
                }
            } else if (action === 'end') {
                // Rimuovi giocatore
                await ActivePlayer.deleteOne({ playerName });
            } else if (action === 'update') {
                // Aggiorna lastUpdate
                await ActivePlayer.updateOne(
                    { playerName },
                    { lastUpdate: new Date() }
                );
            }

            // Ritorna il conteggio aggiornato
            const activeCount = await ActivePlayer.countDocuments();
            return res.status(200).json({ success: true, count: activeCount });
        } catch (error) {
            console.error('Error updating active player:', error);
            return res.status(500).json({ error: 'Error updating active player' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
