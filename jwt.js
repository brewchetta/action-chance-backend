  // Import JWT
const jwt = require('jsonwebtoken')

/* JWT */
const createToken = payload => jwt.sign(payload, process.env.SECRET, { algorithm: process.env.ALGORITHM })
const verifyToken = token => jwt.verify(token, process.env.SECRET, { algorithm: process.env.ALGORITHM })

exports.createToken = createToken
exports.verifyToken = verifyToken
