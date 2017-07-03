/**
 * Created by unio-raj on 3/7/17.
 */
//var portnumber,ipaddress;
var net = require('net');
var server = net.createServer(function (socket) {
   socket.write('Echo Server');
   socket.pipe(socket);
});

server.listen(8080,'52.43.200.112');

// var net = require('net');
//
// var client = new net.Socket();
// client.connect(8080,'52.43.200.112',function () {
//    console.log('Connected');
// });
//
// client.on('data',function (data) {
//    console.log('Recieved Data' + data);
//    client.destroy();
// });
//
// client.on('close',function () {
//    console.log('connection closed')
// });