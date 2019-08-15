// Import mongo connection
const mongo = require('./mongo')

/* Build server && requirements */
const app = require(`express`)()
const http = require(`http`).createServer(app)
const port = 3050
const io = require(`socket.io`)(http)

/* Variables */
let displayMessage = '|||'

/* Socket.IO */

// sends client all the up to date info once they're connected
const onRequestRoomInfo = (room, socket) => {

  // Send new socket all information it needs to get up with the others
  mongo.getRecord('participants', room, [], participants => socket.emit('change participants', participants))

  mongo.getRecord('activeParticipant', room, null, activeParticipant => socket.emit('change active participant', activeParticipant))

  mongo.getRecord('bg', room, {image: "https://clipart.wpblink.com/sites/default/files/wallpaper/drawn-forest/372214/drawn-forest-adobe-illustrator-372214-239163.jpg", mask: {color: '#7D7D7D', intensity: 25}}, bg => socket.emit('change background', bg))

  mongo.getRecord('initiative', room, true, initiativeUse => {
    socket.emit('change initiative use', initiativeUse)
  })
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
    io.emit('change participants', request)
  })
}

const onActiveParticipantChange = request => {
  mongo.saveRecord('activeParticipant', request, () => {
    io.emit('change active participant', request)
  })
}

const onBGChange = request => {
  mongo.saveRecord('bg', request, () => {
    io.emit('change background', request)
  })
}

const onDisplayMessageChange = newMessage => {
  displayMessage = newMessage
  io.emit('change display message', displayMessage)
}
// TODO: Make display messages room specific

const onInitiativeChange = request => {
  mongo.saveRecord('initiative', request, () => {
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
