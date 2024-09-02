const crypto = require('crypto');

// ... Boshqa funksiyalar o'zgarishsiz qoladi ...

/**
 * Tasodifiy buyurtma raqamini yaratadi
 * @returns {string} Buyurtma raqami
 */
exports.generateOrderNumber = () => {
    // 9 baytli tasodifiy qiymat yaratamiz
    const randomBytes = crypto.randomBytes(9);
    // Bu qiymatni 16 lik sanoq sistemasidagi satrga aylantiramiz
    const randomHex = randomBytes.toString('hex').toUpperCase();
    // "ORDER-" prefiksini qo'shamiz va dastlabki 9 ta belgini olamiz
    return 'ORDER-' + randomHex.substring(0, 9);
};

// ... Qolgan funksiyalar o'zgarishsiz qoladi ...