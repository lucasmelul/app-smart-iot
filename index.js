//  Loading Modules
const express = require('express');
const bodyParser = require('body-parser');
const io = require('socket.io');
const rpiDhtSensor = require('rpi-dht-sensor');
const TelegramBot = require('node-telegram-bot-api');
const tokenTelegram = '909712718:AAHV4yTi65jcZHASJEk14NRl-xFm9a6Xf8E';

//  Express Setting
const app = express();
const port = '3000';
app.set('view engine', 'ejs');
const routes = require('./routes');

//  Http urlencoded
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false,
}));
//  Loading JS CSS Plugins
// app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname.concat('/public')));

//  Express Route
app.get('/', routes.index);

const server = app.listen(port, () => {
  console.log('\x1b[44m', `La app está corriendo en el puerto ${port}`);
});

//  Socket
const servIo = io.listen(server);

servIo.sockets.on('connection', (socket) => {
//  Sending DHT11 Data to Browser
  let oldData = readSensor(socket);
  setInterval(() => {
    //  DHT11
    const data = readSensor(socket);
    if(data.temp !== oldData.temp || data.humid !== oldData.humid) {
      console.log("cambió data");
      //pegarle al bot de telegram
      oldData = data;
    }
  }, 10000);
});

function readSensor(socket) {
  const dht = new rpiDhtSensor.DHT11(21);
  const readout = dht.read();
  const temp = (readout.temperature.toFixed(0));
  const humid = (readout.humidity.toFixed(0));

  socket.emit('dht11', {
    temp, humid,
  });
  return {
    temp,
    humid
  }
}



// replace the value below with the Telegram token you receive from @BotFather

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(tokenTelegram, {polling: true});

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, 'Received your message');
});