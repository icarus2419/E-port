const { route } = require('./_poker');
module.exports = (req, res) => route(req, res, 'next_hand');
