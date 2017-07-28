const express = require('express');
const uuidv4 = require('uuid/v4');
const SocketServer = require('ws').Server;

// Set the port to 3001
const PORT = 3001;

// Create a new express server
const server = express()
   // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
const wss = new SocketServer({ server });

// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.

// Broadcast to all.
function broadcast(data) {
  wss.clients.forEach((client) => {
    client.send(data);
  });
};

function broadcastUserCount() {
  const connectedCountObj = {
    type: "connectedUserCount",
    id: uuidv4(),
    count: wss.clients.size
  };
  broadcast(JSON.stringify(connectedCountObj));
}

wss.on('connection', (ws) => {
  console.log(`Number of connected client = ${wss.clients.size}`);
  broadcastUserCount();

  ws.onmessage = function (event) {
    const sentObject = JSON.parse(event.data);
    console.log(sentObject);
    let objectToSend = {};
    switch(sentObject.type) {
      case "postMessage":
        objectToSend = {
          type: "incomingMessage",
          id: uuidv4(),
          username: sentObject.username,
          content: sentObject.content,
          userColor: sentObject.userColor
        }
        break;
      case "postNotification":
        objectToSend = {
          type: "incomingNotification",
          id: uuidv4(),
          content: sentObject.content
        }
        break;
      default:
        throw new Error("Unknown event type " + sentObject.type);
    }
    console.log(objectToSend);
    broadcast(JSON.stringify(objectToSend));
  }

  ws.on('close', () => {
    console.log('Client disconnected')
    broadcastUserCount();
  });
});
