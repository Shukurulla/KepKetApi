const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        logger.info('MongoDB ga muvaffaqiyatli ulandi');
    } catch (error) {
        logger.error('MongoDB ga ulanishda xatolik:', error);
        process.exit(1);
    }
};

module.exports = connectDB;