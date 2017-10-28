var socket;

function generate_id() {
	return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, function() {
		return (Math.random() * 16).toString(16)[0];
	});
}

//TODO: localStorage.user_id = localStorage.user_id || generate_id();
localStorage.user_id = generate_id();

$(function() {
	socket = io();

	socket.on('connect', function () {
		console.log('Connected');

		socket.emit('login', localStorage.user_id, function(status){});
	});

	socket.on('disconnect', function () {
		console.log('Disconnected');
	});

	socket.on('reconnect', function () {
		console.log('Reconnected');
	});

	socket.on('reconnect_error', function () {
		console.log('Failed to reconnect');
	});

    socket.on('start typing', function (talkid) {
    	console.log("User started typing "+talkid);
        addChatTyping(talkid);
    });

    socket.on('stop typing', function (talkid) {
        console.log("User stopped typing "+talkid);
    	removeChatTyping(talkid);
    });

    socket.on('new message', function (message) {
        console.log("New message: " + message.talkid + " " + message.message);
    	addChatMessage(message.talkid, message.message);
    });

	socket.on('other side connected', function(talkid) {
		console.log("Other side connected " + talkid);
	});

	socket.on('other side disconnected', function(talkid) {
		console.log("Other side disconnected " + talkid);
	});
});

// Show typing indicator
function addChatTyping(talkid) {

}

// Removes typing indicator
function removeChatTyping(talkid) {

}

// This adds message to the chat log
function addChatMessage(talkid, message) {

}

function sendMessage(talkid, message) {
    socket.emit('new message', {talkid: talkid, message: message});
}

function startTyping(talkid) {
	socket.emit('start typing', talkid);
}

function stopTyping(talkid) {
	socket.emit('stop typing', talkid);
}


function joinCategory(categoryName) {
	socket.emit('join category', categoryName, function(status, talkid) {
		console.log(status ? 'connected with an expert' : 'sorry, no experts available');
		if(status)
			console.log("Talkid: "+talkid);
	});
}

function joinAsExpert(categoryName) {
	socket.emit('join expert', categoryName, function (status) {
		console.log(status ? 'you have joined as an expert' : 'failed');
	});
}