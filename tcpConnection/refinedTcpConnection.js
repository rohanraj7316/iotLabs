/**
 * Created by unio-raj on 3/7/17.
 */
var net = require('net');
var server = net.createServer();
server.on('connection',handleConnection);

server.listen(9000,function () {
   console.log(`server listening to ${server.address()}`);
});
function  handleConnection(conn) {
    var remoteAddress = `${conn._remoteAddress} : ${conn.remotePort}` ;
    console.log('new Client Conection from %s',remoteAddress);
    conn.setEncoding('utf8');

    conn.on('data'.onConnData);
    conn.once('close',onConnClose);
    conn.on('error',onConnClose);

    function onConnData(data) {
        console.log(`connection Data from ${remoteAddress} : ${data}`);
    }
    function onConnClose() {
        console.log(`connection from ${remoteAddress} has been closed`)
    }
    function onConnClose(err) {
        console.log(`connection ${remoteAddress}: ${err.message}`);
    }
}