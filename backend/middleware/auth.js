// Mock Authentication for development
module.exports = (req, res, next) => {
    req.user = { id: 'admin_001', email: 'admin@veritas.local' };
    next();
};