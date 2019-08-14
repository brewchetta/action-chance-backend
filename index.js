/* Build server && requirements */
const app = require(`express`)()
const http = require(`http`).createServer(app)
const port = 3050
const io = require(`socket.io`)(http)
const MongoClient = require(`mongodb`).MongoClient

/* Variables */
let userCount = 0
// let bg = {image: "https://clipart.wpblink.com/sites/default/files/wallpaper/drawn-forest/372214/drawn-forest-adobe-illustrator-372214-239163.jpg", mask: {color: '#7D7D7D', intensity: 25}}
let displayMessage = '|||'

/* Mongo */
const mongoConnect = callback => MongoClient.connect(`mongodb://localhost:27017/actionchance`, (error, client) => {
  if (error) throw error
  callback(client.db(`actionchance`))
})

// Get a record from a collection
const getRecord = (name, room, _default, callback) => mongoConnect(db => {
  db.collection(room).findOne({name}, (err, result) => {
    if (err) throw err
    if (!result) {
      console.log(`---creating new record of ${name} for ${room}---`)
      db.collection(room).insertOne({name, [name]: _default })
      callback({room: room, data: _default})
    } else {
      callback({room, data: result[name]})
    }
  })
})

// Save a record to a colletion
// --> uses findAndReplace rather than insert since it should already exist
const saveRecord = (name, request, callback) => mongoConnect(db => {
  db.collection(request.room).findOneAndReplace({name}, {name, [name]:request.data})
  callback(request)
})

/* Socket.IO */

// sends client all the up to date info once they're connected
const onConnect = (socket) => {
  // Increase user count
  userCount ++
  // Emit message to all sockets and backend
  const message = `---a new user connected: ${socket.handshake.headers.origin}---`
  io.emit('user connect', {message, userCount})
  console.log(`\n---connection: ${socket.handshake.headers.origin} --------- ${userCount} users---`)
}

const onRequestRoomInfo = (room, socket) => {

  // Send new socket all information it needs to get up with the others
  getRecord('participants', room, [], participants => socket.emit('change participants', participants))

  getRecord('activeParticipant', room, null, activeParticipant => socket.emit('change active participant', activeParticipant))

  getRecord('bg', room, {image: "https://clipart.wpblink.com/sites/default/files/wallpaper/drawn-forest/372214/drawn-forest-adobe-illustrator-372214-239163.jpg", mask: {color: '#7D7D7D', intensity: 25}}, bg => socket.emit('change background', bg))

  getRecord('initiative', room, true, initiativeUse => {
    socket.emit('change initiative use', initiativeUse)
  })

  socket.emit('change display message', displayMessage)
}

// simple message logs when a client disconnects
const onDisconnect = (clientIP) => {
  // Decrease user count
  userCount --
  // Send message to all other sockets
  const message = `---a user disconnected: ${clientIP}---`
  console.log(`\n---disconnect: ${clientIP} --------- ${userCount} users---`)
  io.emit('user connect', {message, userCount})
}

/* On Change Callbacks */
const onParticipantsChange = request => {
  saveRecord('participants', request, participants => {
    io.emit('change participants', request)
  })
}

const onActiveParticipantChange = request => {
  saveRecord('activeParticipant', request, () => {
    io.emit('change active participant', request)
  })
}

const onBGChange = request => {
  saveRecord('bg', request, () => {
    io.emit('change background', request)
  })
}

const onDisplayMessageChange = newMessage => {
  displayMessage = newMessage
  io.emit('change display message', displayMessage)
}
// TODO: Make display messages room specific

const onInitiativeChange = request => {
  saveRecord('initiative', request, () => {
    io.emit('change initiative use', request)
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
  socket.on('request room info', room => onRequestRoomInfo(room, socket))
}

io.on(`connection`, socketConnect)

/* Set server to listen */
http.listen(port, () => console.log(`action-chance-backend listening on port :${port}`))
