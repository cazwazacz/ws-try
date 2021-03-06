const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 8080;
const Message = require('./models/message');
const createMessage = require('./lib/createMessage');

const app = express();
app.use(express.static('public'));

let databaseUrl = process.env.MONGO_URI;

mongoose.connect(databaseUrl, function(err) {
  if (err) {
    console.log(err);
  } else {
    console.log('Successfully connected to database');

    app.get('/api/messages', function(req, res) {
      Message.find({}, function(err, messages) {
        if (err) { return console.log(err) };
        res.json(messages);
      })
    });

    const server = http.createServer(app);
    const wss = new WebSocket.Server({ server });

    wss.on('connection', function connection(ws, req) {
      const location = url.parse(req.url, true);

      ws.on('message', function incoming(data) {
        createMessage(Message, JSON.parse(data).name, JSON.parse(data).message);
        wss.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(data);
          }
        });
      })

      ws.on('error', function(error) {
        console.log('one client down');
      })
    });

    server.listen(PORT, function listening() {
      console.log('Listening on %d', server.address().port);
    });

  }
});
