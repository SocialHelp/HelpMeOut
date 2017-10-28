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

var talks = [];

io.on('connection', function (socket) {
	console.log("%s connected", socket.id);

	socket.on('login', function(user_id, callback) {
		if (socket.user_id) // Already logged in?
			return callback(false);
		socket.user_id = user_id;
		socket.user_type = null;
		console.log("%s logged in as %s", socket.id, socket.user_id);
		return callback(true);
	});

	socket.on('join category', function(categoryName, callback) {
		if (!socket.user_id) // Not logged in?
			return callback(false);
		if (socket.user_type) // Already chatting?
			return callback(false);

		// Check for existing talk
		var talk = null, talkid = null, expert = null;
		for(var i = 0; i < talks.length; i++) {
			if(talks[i].user == socket.user_id && talks[i].category == categoryName) {
				Object.keys(io.sockets.sockets).map(function (key) { return io.sockets.sockets[key]; }).forEach(function (s) {
					if(talks[i].expert == s.user_id) {
						expert = s;
					}
				});
				if (expert) {
					talk = talks[i];
					talkid = i;
					console.log("%s resumed talk %d in category %s with %s", socket.user_id, talkid, categoryName, talk.expert);
				} // TODO: else notify user
			}
		}

		if(!talk) {
			Object.keys(io.sockets.sockets).map(function (key) { return io.sockets.sockets[key]; }).forEach(function (s) {
				if (s.user_type == 'expert') {
					if (s.expert_categories.indexOf(categoryName) !== -1) {
						expert = s;
					}
				}
			});
			if (!expert) {
				console.log("%s wants to join category %s but no expert available", socket.user_id, categoryName);
				return callback(false);
			}

			// Start a new talk
			talk = {};
			talk.user = socket.user_id;
			talk.category = categoryName;
			talk.expert = expert.user_id;
			talkid = talks.push(talk) - 1;

			console.log("Started new talk ID:%d %s with %s in category %s", talkid, socket.user_id, expert.user_id, categoryName);
		}

		socket.join("talk"+talkid);
		expert.join("talk"+talkid);

		expert.emit('other side connected', talkid);
		socket.user_type = 'user';

		return callback(true, talkid);
	});

	socket.on('join expert', function(categoryName, callback) {
		if (!socket.user_id) // Not logged in?
			return callback(false);
		if (socket.user_type && socket.user_type != 'expert') // Already chatting as an user?
			return callback(false);

		socket.user_type = 'expert';
		if(!socket.expert_categories)
			socket.expert_categories = [];
		if(socket.expert_categories.indexOf(categoryName) !== -1) // Already registered for a category
			return callback(false);
		socket.expert_categories.push(categoryName);

		console.log("%s is waiting on category %s", socket.user_id, categoryName);
		return callback(true);
	});

	socket.on('disconnecting', function() { // Because room list is unavailable in 'disconnected'
		Object.keys(socket.rooms).forEach(function(room) {
			if(room.indexOf("talk") !== 0)
				return;
			var talkid = Number(room.substr(4));
			socket.to(room).emit('other side disconnected', talkid);
		});
	});

	socket.on('disconnect', function() {
		console.log("%s disconnected", socket.id);
	});


	socket.on('new message', function (message) {
		console.log("New message in talk %d: %s", message.talkid, message.message);
		socket.to("talk"+message.talkid).emit('new message', message);
	});

	socket.on('start typing', function (talkid) {
		socket.to("talk"+talkid).emit('start typing', talkid);
	});

	socket.on('stop typing', function (talkid) {
		socket.to("talk"+talkid).emit('stop typing', talkid);
	});
});