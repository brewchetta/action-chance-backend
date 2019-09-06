require('dotenv').config()
const socket = require('./socket')
const mongo = require('./mongo')
const con = require('./constants')

// Send shutdown message
const shutdown = () => {
  mongo.client.close()
  console.log('\nShutting down...')
  socket.io.emit('shutdown', 'Server has shut down')
  con.http.close(() => {
    console.log(`Shutdown complete for port :${con.port}`)
  })
  process.nextTick(() => process.exit(0))
}

process.on('SIGINT', shutdown)

/* Set server to listen */
con.http.listen(con.port, () => console.log(`action-chance-backend listening on port :${con.port}`))
