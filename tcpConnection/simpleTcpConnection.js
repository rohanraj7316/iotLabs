
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var net = require('net');
var _ = require('underscore');
var events = require('events');
var fs = require('fs');
var log = require('./modules/log')(module);
var logInput = require('./modules/logInput')(module);
var config = require('./modules/config');
var parser = require('./modules/parsing/parser');
var nodeadmin = require('nodeadmin');
var mysql      = require('mysql');

module.exports = function() {

    var em = new events.EventEmitter();

    io.on('connection', function (socket) {

        log.info('socket.io connected');

        socket.on('disconnect', function () {
            log.info('socket.io disconnected');
        });

        socket.on('map message', function (msg) {
            log.info('map message: ' + msg);
            io.emit('map message', msg);
        });
    });

    var portHttp = config.get('http:port');
    http.listen(portHttp, function () {
        var serverAddress = http.address();
        log.info('HTTP listening on ' + serverAddress.family + ' ' + serverAddress.address + ':' + serverAddress.port + ' - UI is available in browser'); // TODO: put 'UI disabled' if config.ui.disabled
    });

    var tcpInputEncoding = config.get('tcp:input_log_encoding') || 'ascii';

    var tcpIdleTimeout = config.get('tcp:idle_timeout') || 30000;

    var portTcp = config.get('tcp:port');

    var tcp = net.createServer(function (socket) {

        var client = 'host ' + socket.remoteAddress + ':' + socket.remotePort;
        log.info('TCP connected ' + client);
        socket.setTimeout(tcpIdleTimeout, function () {
            socket.destroy();
        });

        tcp.getConnections(function (err, count) {
            if (err) {
                log.error('ERROR on counting active TCP connections');
                return;
            }
            //server.maxConnections # Set this property to reject connections when the server's connection count gets high.
            log.info('TCP active connections: ' + count);// + ' of max: ' + tcp.maxConnections); // undefined
        });

        /**
         * Procession of received data.
         *
         * @param {Buffer} buffer - raw binary data of Buffer type.
         */
        socket.on('data', function (buffer) {

            log.info('TCP got data from ' + client);
            try {
                logInput.info( buffer.toString( tcpInputEncoding ) ); // saving data input -> into a file.
            } catch (ex) {
                log.error('file logging failure: ' + ex);
            }

            var parsedData = parser.parse(socket, buffer); // (buffer instanceof Buffer) == true

            if (!parsedData) {	//	null || undefined
                log.error("Data wasn't parsed. Connection dropped.");
                socket.destroy(); //  release socket resources
                return;
            }

            var parsedMaps; // expected format - Array of Maps with extracted data values.
            if (_.isArray(parsedData)) {
                if (parsedData.length == 0) { // empty Array
                    log.info('Connection still opened, looking for next data packet.');
                    return;
                }
                parsedMaps = parsedData;
            }

            if (!parsedMaps) {
                log.error("Can't process parsed data. Connection dropped.");
                socket.destroy();
                return;                //  TODO:   keep connection opened, as there may be additional data ?
            }

            socket.end();

            try {
                for (var index = 0; index < parsedMaps.length; index++)
                {
                    var mapData = parsedMaps[index];
                    var deviceId = mapData['IMEI'];
                    var fuel = mapData['fuel'];
                    var rpm = mapData['rpm'];
                    var tps = mapData['tps'];
                    var state = mapData['state'];
                    var speed = mapData['speed'];
                    var speedobd = mapData['speedobd'];

                    if (deviceId) {
                        //  utcDate,utcTime
                        var utcDateTime = mapData['utcDateTime'];
                        var utcDate = mapData['utcDate'];
                        var utcTime = mapData['utcTime'];
                        var utcDate = new Date(mapData['utcDate']);
                        var utcTime = new Date(mapData['utcTime']);
                        var utcDateTime = new Date(parseInt(mapData['utcDate']) + parseInt(mapData['utcTime']));
                        var date = new Date(mapData['utcDate']);
                        //log.debug('date: ' + utcDate + ' time: ' + utcTime);
                        //log.debug('date & time as Date: ' + utcDateTime); // OUTPUT: date & time as Date: 1377818379000
                        log.debug('date&time as String: ' + utcDateTime.toString()); // the same !

                        var lat = mapData['latitude'];
                        var lng = mapData['longitude'];
                        var date = new Date(mapData['utcDateTime']);

                        var text = '\r\n'+'  '+date+',  '+deviceId+',  '+lat+',  '+lng+',  '+fuel+',  '+rpm+',  '+tps+',  '+state+',  '+speed+',  '+speedobd;

                        fs.appendFile('newdata.txt',text, function (err) {
                            if (err)
                                return console.log(err);
                            console.log('file is written');
                        });

                        var objUI = {
                            type: 'marker',
                            deviceId: deviceId,
                            utcDateTime: new Date(utcDateTime).toUTCString(),
                            altitude: mapData['altitude'],
                            speed: mapData['speed'],
                            heading: mapData['heading'],
                            lat: lat,
                            lng: lng
                        };
                        io.emit('map message', objUI);
                    }
                }
            } catch (ex) {
                log.error('UI update failure: ' + ex);
            }

            em.emit('gps_data', parsedMaps);
            em.emit('gps_data_tcp', parsedMaps);
        });

        socket.on('close', function () {
            log.info('TCP disconnected ' + client);
        });

        socket.on('error', function (err) {
            log.error('TCP: ', err);
        });

    }).listen(portTcp, function () {
        var serverAddress = tcp.address();
        log.info('TCP  listening on ' + serverAddress.family + ' ' + serverAddress.address + ':' + serverAddress.port);
    });
};
