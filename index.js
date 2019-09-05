// Import environmental files
require('dotenv').config()
// Import JWT
const jwt = require('jsonwebtoken')
// Import mongo connection
const mongo = require('./mongo')

/* Build server && requirements */
const app = require(`express`)()
const http = require(`http`).createServer(app)
const port = 3050
const io = require(`socket.io`)(http)

/* CORS */
io.set('origins', '*:*')

/* JWT */
const createToken = payload => jwt.sign(payload, process.env.SECRET, { algorithm: process.env.ALGORITHM })
const verifyToken = token => jwt.verify(token, process.env.SECRET, { algorithm: process.env.ALGORITHM })

/* Variables */
const displayMessages = {}

/* Socket.IO */

// sends client all the up to date info once they're connected
const getRoomInfo = (data, socket) => {
  const room = data.room

  // Send new socket all information it needs to get up with the others
  mongo.getRecord('participants', room, [], participants => socket.emit('change participants', participants))

  mongo.getRecord('activeParticipant', room, null, activeParticipant => socket.emit('change active participant', activeParticipant))

  mongo.getRecord('bg', room, {image: "https://clipart.wpblink.com/sites/default/files/wallpaper/drawn-forest/372214/drawn-forest-adobe-illustrator-372214-239163.jpg", mask: {color: '#7D7D7D', intensity: 25}}, bg => socket.emit('change background', bg))

  mongo.getRecord('initiative', room, true, initiativeUse => {
    socket.emit('change initiative use', initiativeUse)
  })

  // And then add socket to room
  socket.join(room)
}

// verify password match for the room
const verifyPassword = (data, socket, callback) => {
  mongo.getRecord('password', data.room, createToken(data.password), res => {
    if (data.password === verifyToken(res.data)) callback()
    else {
      console.log(`---Invalid password: ${socket.handshake.headers.origin}---`)
      socket.emit('invalid password', 'Invalid password for this room')
    }
  })
}

// verifies password and then sends room info
const onRequestRoomInfo = (data, socket) => {
  verifyPassword(data, socket, () => getRoomInfo(data, socket))
}

// simple message logs when a client connects/disconnects
const onConnect = (socket) => {
  console.log(`\n---connection: ${socket.handshake.headers.origin} ---`)
}

const onDisconnect = (clientIP) => {
  console.log(`\n---disconnect: ${clientIP} ---`)
}

/* On Change Callbacks */
const onParticipantsChange = request => {
  mongo.saveRecord('participants', request, participants => {
    io.sockets.in(request.room).emit('change participants', request)
  })
}

const onActiveParticipantChange = request => {
  mongo.saveRecord('activeParticipant', request, () => {
    io.sockets.in(request.room).emit('change active participant', request)
  })
}

const onBGChange = request => {
  mongo.saveRecord('bg', request, () => {
    io.sockets.in(request.room).emit('change background', request)
  })
}

const onDisplayMessageChange = request => {
  displayMessages[request.room] = request.data
  io.sockets.in(request.room).emit('change display message', request)
}
// TODO: Make display messages room specific

const onInitiativeChange = request => {
  mongo.saveRecord('initiative', request, () => {
    io.sockets.in(request.room).emit('change initiative use', request)
  })
}

/* Main Socket Connection */

const socketConnect = socket => {
  // Initial connection
  onConnect(socket)

  // Other connection types
  socket.on(`disconnect`, () => onDisconnect(socket.handshake.headers.origin))
  socket.on('change participants', onParticipantsChange)
  socket.on('change active participant', onActiveParticipantChange)
  socket.on('change background', onBGChange)
  socket.on('change display message', onDisplayMessageChange)
  socket.on('change initiative use', onInitiativeChange)
  socket.on('request room info', data => onRequestRoomInfo(data, socket))
}

io.on(`connection`, socketConnect)

// Send shutdown message
const shutdown = () => {
  mongo.client.close()
  console.log('\nShutting down...')
  io.emit('shutdown', 'Server has shut down')
  http.close(() => {
    console.log(`Shutdown complete for port :${port}`)
  })
  process.nextTick(() => process.exit(0))
}

process.on('SIGINT', shutdown)

/* Set server to listen */
http.listen(port, () => console.log(`action-chance-backend listening on port :${port}`))
