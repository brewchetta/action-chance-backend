/* Build server && requirements */
const app = require(`express`)()
const http = require(`http`).createServer(app)
const port = 3050
const io = require(`socket.io`)(http)
const MongoClient = require(`mongodb`).MongoClient

/* Variables */
let userCount = 0
let bg = {image: "https://clipart.wpblink.com/sites/default/files/wallpaper/drawn-forest/372214/drawn-forest-adobe-illustrator-372214-239163.jpg", mask: {color: '#7D7D7D', intensity: 25}}
let displayMessage = '|||'

/* Mongo */
const mongoConnect = callback => MongoClient.connect(`mongodb://localhost:27017/actionchance`, (error, client) => {
  if (error) throw error
  callback(client.db(`actionchance`))
})

// Get a record from a collection
const getRecord = (name, dfault, callback) => mongoConnect(db => {
  db.collection("room1").findOne({name}, (err, result) => {
    if (err) throw err
    if (!result) {
      console.log(result)
      console.log(`---creating empty list of ${name} for room1---`)
      db.collection("room1").insert({name, [name]: dfault })
      callback(dfault)
    } else {
      callback(result[name])
    }
  })
})

// Save a record to a colletion
// --> uses find and replace rather than insert since it should already exist
const saveRecord = (name, item, callback) => mongoConnect(db => {
  db.collection("room1").findOneAndReplace({name}, {name, [name]:item})
  callback(item)
})

/* Socket.IO */

// sends client all the up to date info once they're connected
const onConnect = (socket) => {
  userCount ++
  const message = `---a new user connected: ${socket.handshake.headers.origin}---`
  io.emit('user connect', {message, userCount})
  console.log(`\n---connection: ${socket.handshake.headers.origin} --------- ${userCount} users---`)

  socket.emit('change background', bg)
  getRecord('participants', [], participants => socket.emit('change participants', participants))
  getRecord('activeParticipant', null, activeParticipant => socket.emit('change active participant', activeParticipant))
}

// simple message logs when a client disconnects
const onDisconnect = (clientIP) => {
  const message = `---a user disconnected: ${clientIP}---`
  userCount --
  console.log(`\n---disconnect: ${clientIP} --------- ${userCount} users---`)
  io.emit('user connect', {message, userCount})
}

/* On Change Callbacks */
const onParticipantsChange = newParticipants => {
  saveRecord('participants', newParticipants, participants => {
    io.emit('change participants', newParticipants)
  })
}

const onActiveParticipantChange = activeParticipant => {
  saveRecord('activeParticipant', activeParticipant, () => {
    io.emit('change active participant', activeParticipant)
  })
}

const onBGChange = newBG => {
  bg = newBG
  io.emit('change background', bg)
}

const onDisplayMessageChange = newMessage => {
  displayMessage = newMessage
  io.emit('change display message', displayMessage)
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
}

io.on(`connection`, socketConnect)

/* Set server to listen */
http.listen(port, () => console.log(`action-chance-backend listening on port :${port}`))
