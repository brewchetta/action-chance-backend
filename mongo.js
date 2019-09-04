const MongoClient = require(`mongodb`).MongoClient

const uri = `mongodb+srv://${process.env.MONGOUSER}:${process.env.PASSWORD}@${process.env.CLUSTER}.mongodb.net/test?retryWrites=true&w=majority`

const client = new MongoClient(uri, { useNewUrlParser: true });
exports.client = client

client.connect(error => {
  if (error) throw error
})

const mongoConnect = callback => {
  callback(client.db(`actionchance`))
}

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
