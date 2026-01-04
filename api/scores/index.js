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
    deviceType: {
        type: String,
        enum: ['mobile', 'desktop'],
        default: 'desktop'
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
        console.log('MongoDB connection established');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
    }
}

module.exports = async function handler(req, res) {
    await connectDB();

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        try {
            const mobileScores = await Score.find({ deviceType: 'mobile' })
                .sort({ score: -1 })
                .limit(10)
                .lean();
            const desktopScores = await Score.find({ deviceType: 'desktop' })
                .sort({ score: -1 })
                .limit(10)
                .lean();
            return res.status(200).json({ mobileScores, desktopScores });
        } catch (error) {
            console.error('Error retrieving scores:', error);
            return res.status(500).json({ error: 'Error retrieving scores' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { playerName, score, deviceType } = req.body;

            if (!playerName || score === undefined) {
                return res.status(400).json({ error: 'Name and score are required' });
            }

            const newScore = new Score({
                playerName: playerName.substring(0, 20),
                score: parseInt(score),
                deviceType: deviceType || 'desktop',
                timestamp: new Date()
            });

            await newScore.save();

            const mobileScores = await Score.find({ deviceType: 'mobile' })
                .sort({ score: -1 })
                .limit(10)
                .lean();
            const desktopScores = await Score.find({ deviceType: 'desktop' })
                .sort({ score: -1 })
                .limit(10)
                .lean();

            return res.status(200).json({ success: true, mobileScores, desktopScores });
        } catch (error) {
            console.error('Error saving score:', error);
            return res.status(500).json({ error: 'Error saving score' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const { id } = req.query;

            if (id) {
                // Cancella un singolo record per ID
                const result = await Score.deleteOne({ _id: id });
                if (result.deletedCount > 0) {
                    return res.status(200).json({ success: true, message: 'Record deleted' });
                } else {
                    return res.status(404).json({ error: 'Record not found' });
                }
            } else {
                // Cancella tutti i record
                await Score.deleteMany({});
                return res.status(200).json({ success: true, message: 'All records have been deleted' });
            }
        } catch (error) {
            console.error('Error deleting records:', error);
            return res.status(500).json({ error: 'Error deleting records' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
