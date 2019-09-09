const con = require('./constants')
const jwt = require('./jwt')
const mongo = require('./mongo')

const io = require(`socket.io`)(con.http)

/* CORS */
io.origins((origin, callback) => {
  console.log(`---incoming request from ${origin}---`)
  if (origin) {
    return callback('origin allowed', true)
  }

  callback(null, true)
})

/* Variables */
const displayMessages = {}

/* Socket.IO */

// sends client all the up to date info once they're connected
const getRoomInfo = (data, socket) => {
  const room = data.room
  const parsedRec = {}

  // Get all records for a single room
  mongo.getCompleteRecords(room, records => {
    records.forEach(r => parsedRec[r.name] = r[r.name])
    // If room doesn't have data, add the data and build parsedRec
    if (!parsedRec.participants && !parsedRec.activeParticipant && !parsedRec.bg && !parsedRec.initiative) {
      con.defaultRoom.forEach(r => parsedRec[r.name] = r[r.name])
      mongo.createDefaultRoom(data.room)
    }

    socket.emit('join room', parsedRec)
    socket.join(room.name)
  })
}

// verify password match for the room
const verifyPassword = (data, socket, callback) => {
  mongo.getRecord('password', data.room, jwt.createToken(data.room.password), res => {
    if (data.room.password === jwt.verifyToken(res.data)) callback()
    else {
      console.log(`---Invalid password: ${socket.handshake.headers.origin}---`)
      socket.emit('invalid password', 'Invalid password for this room')
    }
  })
}

// verifies password and then sends room info
const onRequestRoomInfo = (data, socket) => {
  verifyPassword(data, socket, () => getRoomInfo(data, socket))
  // getRoomInfo(data, socket)
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
    io.sockets.in(request.room.name).emit('change participants', request)
  })
}

const onActiveParticipantChange = request => {
  mongo.saveRecord('activeParticipant', request, () => {
    io.sockets.in(request.room.name).emit('change active participant', request)
  })
}

const onBGChange = request => {
  mongo.saveRecord('bg', request, () => {
    io.sockets.in(request.room.name).emit('change background', request)
  })
}

const onDisplayMessageChange = request => {
  displayMessages[request.room.name] = request.data
  io.sockets.in(request.room.name).emit('change display message', request)
}
// TODO: Make display messages room specific

const onInitiativeChange = request => {
  mongo.saveRecord('initiative', request, () => {
    io.sockets.in(request.room.name).emit('change initiative use', request)
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

// Shutdown message
exports.shutdown = () => {
  mongo.client.close()
  console.log('\nShutting down...')
  io.emit('shutdown', 'Server has shut down')
  con.http.close(() => {
    console.log(`Shutdown complete for port :${process.env.PORT}`)
  })
  process.nextTick(() => process.exit(0))
}
