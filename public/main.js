var socket;

$(function() {
	console.log("Hello!");

	socket = io();

	socket.on('connect', function () {
		console.log('you have been connected');
	});

	socket.on('disconnect', function () {
		console.log('you have been disconnected');
	});

	socket.on('reconnect', function () {
		console.log('you have been reconnected');
	});

	socket.on('reconnect_error', function () {
		console.log('attempt to reconnect has failed');
	});


	socket.on('chat started', function() {
		console.log("Chat started!");
	});
});

function joinCategory(categoryName)
{
	socket.emit('join category', categoryName);
}