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

const bot = new TelegramBot(tokenTelegram, {polling: true});

var dataSensor;
var oldData;

servIo.sockets.on('connection', (socket) => {
  oldData = readSensor(socket);
  configBot(socket);
});

function readSensor(socket) {
  const dht = new rpiDhtSensor.DHT11(21);
  const readout = dht.read();
  const temp = (readout.temperature.toFixed(0));
  const humid = (readout.humidity.toFixed(0));
  dataSensor = {temp,humid}
  socket.emit('dht11', dataSensor);
  return dataSensor;
}

function configBot(socket) {
	
	bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text.toLowerCase();
    switch(messageText) {
      case 'activar': 
        const intervalId = setInterval(() => {
          dataSensor = readSensor(socket);
          if(dataSensor.temp !== oldData.temp || dataSensor.humid !== oldData.humid) {
            bot.sendMessage(chatId, JSON.stringify(dataSensor));
            oldData = dataSensor;
          }
        }, 10000);
      break;
      case 'temperatura':
        dataSensor = readSensor(socket);
        bot.sendMessage(chatId, 'La temperatura actual es: ' + dataSensor.temp + '°C');
      break;
      case 'humedad':
        dataSensor = readSensor(socket);
        bot.sendMessage(chatId, 'La humedad actual es: ' + dataSensor.humid + '%');
      break;
      case 'desactivar':
        clearInterval(intervalId);
      break;
    }
	});
}
