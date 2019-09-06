/* Build server && requirements */
const app = require(`express`)()
const http = require(`http`).createServer(app)

const defaultRoom = [
  {name: 'participants', participants: []},
  {name: 'activeParticipant', activeParticipant: null},
  {name: 'bg', bg: {
    image: "https://clipart.wpblink.com/sites/default/files/wallpaper/drawn-forest/372214/drawn-forest-adobe-illustrator-372214-239163.jpg",
    mask: {color: '#7D7D7D', intensity: 25}
  }},
  {name: 'initiative', initiative: true}
]
const port = 3050

exports.defaultRoom = defaultRoom
exports.port = port
exports.http = http
