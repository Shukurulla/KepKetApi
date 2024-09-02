module.exports = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.userData) {
            return res.status(403).json({
                message: 'Foydalanuvchi malumotlari topilmadi' });
    }
    
    const { role } = req.userData;
            if (allowedRoles.includes(role)) {
                next();
            } else {
                res.status(403).json({ message: 'Ruxsat etilmagan' });
            }
        };
    };