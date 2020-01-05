require('dotenv').config()
const socket = require('./socket')
const mongo = require('./mongo')
const con = require('./constants')

console.clear()
console.time('Runtime')

/* Set server to listen */
con.http.listen(process.env.PORT || 3050, () => console.log(`action-chance-backend listening on ${process.env.PORT || 3050}`))

// Shutdown
process.on('SIGINT', () => {
  console.clear()
  console.timeEnd('Runtime')
  socket.shutdown()
})

process.on('SIGTERM', () => {
  console.clear()
  console.timeEnd('Runtime')
  socket.shutdown()
})
