const MongoClient = require(`mongodb`).MongoClient
const con = require('./constants')

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
  db.collection(room.name).findOne({name}, (err, result) => {
    if (err) throw err
    if (!result) {
      console.log(`---creating new record of ${name} for ${room.name}---`)
      db.collection(room.name).insertOne({name, [name]: _default })
      callback({data: _default})
    } else {
      callback({data: result[name]})
    }
  })
})

// Gets info for a room on join
exports.getCompleteRecords = (room, callback) => {
  mongoConnect(db => {
    db.collection(room.name).find().project({password: 0, _id: 0}).toArray((err, records) => callback(records))
  })
}

// Creates default room params
exports.createDefaultRoom = (room) => {
  console.log(`---Building out default room for ${room.name}---`)
  mongoConnect(db => db.collection(room.name).insertMany(con.defaultRoom))
}

// Save a record to a collection
// --> uses findAndReplace rather than insert since it should already exist
exports.saveRecord = (name, request, callback) => mongoConnect(db => {
  db.collection(request.room.name).findOneAndReplace({name}, {name, [name]:request.data})
  callback(request.data)
})
