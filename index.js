/* Build server && requirements */
const app = require(`express`)()
const http = require(`http`).createServer(app)
const port = 3050
const io = require(`socket.io`)(http)
const MongoClient = require(`mongodb`).MongoClient


/* Mongo */
const mongoConnect = callback => MongoClient.connect(`mongodb://localhost:27017/actionchance`, (error, client) => {
  if (error) throw error
  callback(client.db(`actionchance`))
})

// User Count
let userCount = 0
let participants = []
let activeParticipant = null

/* Socket.IO */
const onConnect = (clientIP) => {
  userCount ++
  console.log(`\n---connection: ${clientIP} --------- ${userCount} users---`)
  io.emit(`user connect`, {message: `---a new user connected: ${clientIP}---`, userCount, participants})
}

const onDisconnect = (clientIP) => {
  userCount --
  console.log(`\n---disconnect: ${clientIP} --------- ${userCount} users---`)
  io.emit(`user connect`, {message:`---a user disconnected: ${clientIP}---`, userCount, participants})
}

const onParticipantsChange = newParticipants => {
  participants = newParticipants
  io.emit('change participants', newParticipants)
}

const onActiveParticipantChange = newActiveParticipant => {
  activeParticipant = newActiveParticipant
  io.emit('change active participant', activeParticipant)
}

const socketConnect = socket => {
  // Initial connection
  onConnect(socket.handshake.headers.origin)

  // Other connection types
  socket.on(`disconnect`, () => onDisconnect(socket.handshake.headers.origin))
  socket.on('change participants', onParticipantsChange)
  socket.on('change active participant', onActiveParticipantChange)
}

io.on(`connection`, socketConnect)

/* Set server to listen */
http.listen(port, () => console.log(`action-chance-backend listening on port :${port}`))
