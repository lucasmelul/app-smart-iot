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
    dataSensor = readSensor(socket);
    switch(messageText) {
      case 'activar': 
        bot.sendMessage(chatId, parseText(dataSensor.temp, 'temp') + '/n' + parseText(dataSensor.humid, 'humid'));
        const intervalId = setInterval(() => {
          if(dataSensor.temp !== oldData.temp){
            bot.sendMessage(chatId, 'La temperatura cambió de ' + oldData.temp + '°C a ' + dataSensor.temp + '°C');
          }
          if(dataSensor.humid !== oldData.humid){
            bot.sendMessage(chatId, 'La humedad cambió de ' + oldData.humid + '% a ' + dataSensor.humid + '%');
          }
        }, 10000);
      break;
      case 'temperatura':
        bot.sendMessage(chatId, parseText(dataSensor.temp, 'temp'));
      break;
      case 'humedad':
        bot.sendMessage(chatId, parseText(dataSensor.humid, 'humid'));
      break;
      case 'desactivar':
        clearInterval(intervalId);
      break;
    }
    oldData = dataSensor;
	});
}

function parseText(value, type) {
  if(type === 'temp') {
    return 'La temperatura actual es: ' + value + '°C'
  }

  if(type === 'humid') {
    return 'La humedad actual es: ' + value + '%'
  }
}
