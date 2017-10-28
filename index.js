var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 8080;

server.listen(port, function () {
	console.log('Server listening at port %d', port);
});

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', function (socket) {
	socket.on('join category', function(categoryName) {
		console.log(categoryName);
		// TODO: do some smart stuff to connect people
		socket.emit('chat started');
	})
});