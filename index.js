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

const getParticipants = callback => mongoConnect(db => {
  db.collection("participants").find().toArray((err, result) => {
    if (err) throw err
    callback(result)
  })
})

const saveParticipants = (participants, callback) => mongoConnect(db => {
  db.collection("participants").remove({})
  db.collection("participants").insert(participants)
  callback(participants)
})

const getActiveParticipant = callback => mongoConnect(db => {
  db.collection("activeParticipant").find().toArray((err, result) => {
    if (err) throw err
    callback(result)
  })
})

const saveActiveParticipant = (participant, callback) => mongoConnect(db => {
  db.collection("activeParticipant").remove({})
  db.collection("activeParticipant").insert(participant)
  callback(participant)
})

/* Variables */
let userCount = 0
// let participants = []
// let activeParticipant = null
let bg = {image: "https://clipart.wpblink.com/sites/default/files/wallpaper/drawn-forest/372214/drawn-forest-adobe-illustrator-372214-239163.jpg", mask: {color: '#7D7D7D', intensity: 25}}
let displayMessage = '|||'

/* Socket.IO */

// sends client all the up to date info once they're connected
const onConnect = (clientIP) => {
  const message = `---a new user connected: ${clientIP}---`

  userCount ++
  console.log(`\n---connection: ${clientIP} --------- ${userCount} users---`)
  io.emit('change background', bg)
  getParticipants(participants => {
    getActiveParticipant(participant => {
      const activeParticipant = participant[0] ? participant[0] : null
      io.emit(`user connect`, {message, userCount, participants, activeParticipant})
    })
  })
}

// simple message logs when a client disconnects
const onDisconnect = (clientIP) => {
  const message = `---a user disconnected: ${clientIP}---`
  userCount --
  console.log(`\n---disconnect: ${clientIP} --------- ${userCount} users---`)
  getParticipants(participants => {
    getActiveParticipant(activeParticipant => {
      io.emit(`user connect`, {message, userCount, participants, activeParticipant})
    })
  })
}

/* On Change Callbacks */
const onParticipantsChange = newParticipants => {
  saveParticipants(newParticipants, participants => {
    io.emit('change participants', newParticipants)
  })
}

const onActiveParticipantChange = activeParticipant => {
  saveActiveParticipant(activeParticipant, () => {
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
  onConnect(socket.handshake.headers.origin)

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
