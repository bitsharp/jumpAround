// Test file per verificare che l'API funzioni
// Esegui: npm test

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jump-around';

async function testConnection() {
    console.log('🔍 Testing connection to:', MONGODB_URI.replace(/:[^:]*@/, ':****@'));
    
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB connection successful!');
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
}

testConnection();
