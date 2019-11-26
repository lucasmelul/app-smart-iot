//  Loading Modules
const express = require('express');
const bodyParser = require('body-parser');
const io = require('socket.io');
const rpiDhtSensor = require('rpi-dht-sensor');

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
