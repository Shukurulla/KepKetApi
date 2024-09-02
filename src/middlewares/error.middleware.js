const logger = require('../utils/logger');

module.exports = (error, req, res, next) => {
    logger.error(error.message, { error });
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
};