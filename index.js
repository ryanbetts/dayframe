var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/remote', function(req, res){
    res.sendfile('remote/remote.html');
});

app.get('/scene', function(req, res){
    res.sendfile('scene/scene.html');
});

app.use(express.static('public'));

var sockets = {
    sceneId: null,
    remoteId: null
}

var daydreamState = {
    remoteConnected: false,
    sceneConnected: false
}

var SCENES_ROOM = 'scenes';

io.on('connection', function(socket){

    var broadcastToRemote = function (evtName, data) {
        if (sockets.remoteId) {
            socket.broadcast.to(sockets.remoteId).emit(evtName, data);
        }
    }

    var broadcastToScene = function (evtName, data) {
        io.to(SCENES_ROOM).emit(evtName, data);
    }

    // figure out which type of client connected and broadcast a connection event
    if (socket.handshake.query.type == 'scene') {
        console.log('scene:connected');
        sockets.sceneId = socket.id;
        daydreamState.sceneConnected = true;
        socket.join(SCENES_ROOM);
        broadcastToRemote('scene:connected', daydreamState)
    } else if (socket.handshake.query.type == 'remote') {
        console.log('remote:connected');
        sockets.remoteId = socket.id;
        daydreamState.remoteConnected = true;
        broadcastToScene('remote:connected', daydreamState)
    }

    // welcome the new connection with the current state
    socket.emit('welcome', daydreamState);

    // handle disconnection events
    socket.on('disconnect', function() {
        console.log('disconnect');
        if (socket.id == sockets.remoteId) {
            console.log('remote:disconnected');
            sockets.remoteId = null;
            daydreamState.remoteConnected = false;
            broadcastToScene('remote:disconnected', daydreamState)
        } else if (socket.id == sockets.sceneId) {
            console.log('scene:disconnected');
            sockets.sceneId = null;
            daydreamState.sceneConnected = false;
            broadcastToRemote('scene:disconnected', daydreamState)
        }
    });

    // REMOTE EVENTS

    socket.on('motion:change', function (data) {
        broadcastToScene('motion:change', data);
    });
    socket.on('orientation:change', function (data) {
        broadcastToScene('orientation:change', data);
    });
    socket.on('trackpad:touchstart', function (data) {
        broadcastToScene('trackpad:touchstart', data);
    });
    socket.on('trackpad:touchmove', function (data) {
        broadcastToScene('trackpad:touchmove', data);
    });
    socket.on('trackpad:touchend', function (data) {
        broadcastToScene('trackpad:touchend', data);
    });
    socket.on('trackpad:click', function (data) {
        broadcastToScene('trackpad:click', data);
    });
    socket.on('trackpad:swipeleft', function (data) {
        broadcastToScene('trackpad:swipeleft', data);
    });
    socket.on('trackpad:swiperight', function (data) {
        broadcastToScene('trackpad:swiperight', data);
    });
    socket.on('trackpad:swipeup', function (data) {
        broadcastToScene('trackpad:swipeup', data);
    });
    socket.on('trackpad:swipedown', function (data) {
        broadcastToScene('trackpad:swipedown', data);
    });
    socket.on('home:tap', function (data) {
        broadcastToScene('home:tap', data);
    });
    socket.on('app:tap', function (data) {
        broadcastToScene('app:tap', data);
    });
});

var port = process.env.PORT || 3000
http.listen(port, function(){
    console.log('listening on *:'+port);
});
