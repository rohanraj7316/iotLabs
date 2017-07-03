/**
 * Created by unio-raj on 3/7/17.
 */
var portnumber,ipaddress;
var net = require('net');
var server = net.createServer(function (socket) {
   socket.write('Echo Server');
   socket.pipe(socket);
});

server.listen(portnumber,ipaddress);

var net = require('net');

var client = new net.Socket();
client.connect(portnumber,ipaddress,function () {
   console.log('Connected');
});

client.on('data',function (data) {
   console.log('Recieved Data' + data);
   client.destroy();
});

client.on('close',function () {
   console.log('connection closed')
});