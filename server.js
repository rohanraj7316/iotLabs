/**
 * Created by unio-raj on 3/7/17.
 */


var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');

app.listen(8080,function(){
  console.log('server is listening to port number 7000');
});

function handler(req,res) {
  console.log('inside handler');
}

io.on('connection',function (socket) {
  console.log('connection is stablished');

  socket.on('disconnect',function(){
    console.log('connection got disconnect');
  });

  socket.on('data',function(data){
    console.log('inside data listener: ', data);
  });

  socket.on('close',function(){
    console.log('socket connection closed');
  });

  socket.on('error',function(err){
    console.log('error occure in socket connection');
  });

})
