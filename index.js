require('dotenv').config()
const socket = require('./socket')
const mongo = require('./mongo')
const con = require('./constants')

console.clear()
console.time('Runtime')

/* Set server to listen */
if (process.env.NODE_ENV !== 'production') {
  con.http.listen(process.env.PORT, () => console.log(`action-chance-backend listening on ${process.env.PORT}`))
} else {
  con.http.listen(() => console.log('action-chance-backend listening'))
}

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
