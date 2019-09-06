require('dotenv').config()
const socket = require('./socket')
const mongo = require('./mongo')
const con = require('./constants')

/* Set server to listen */
con.http.listen(con.port, () => console.log(`action-chance-backend listening on port :${con.port}`))
