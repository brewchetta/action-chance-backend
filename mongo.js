const MongoClient = require(`mongodb`).MongoClient

const mongoConnect = callback => MongoClient.connect(`mongodb://localhost:27017/actionchance`, (error, client) => {
  if (error) throw error
  callback(client.db(`actionchance`))
})

// Get a record from a collection
exports.getRecord = (name, room, _default, callback) => mongoConnect(db => {
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
exports.saveRecord = (name, request, callback) => mongoConnect(db => {
  db.collection(request.room).findOneAndReplace({name}, {name, [name]:request.data})
  callback(request)
})
