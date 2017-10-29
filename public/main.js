var socket;
var currentTalkId = null;

function generate_id() {
	return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, function() {
		return (Math.random() * 16).toString(16)[0];
	});
}

//TODO: localStorage.user_id = localStorage.user_id || generate_id();
localStorage.user_id = generate_id();

$(function() {
	console.log("Hello!");

	socket = io();

	socket.on('connect', function () {
		console.log('Connected');

		socket.emit('login', localStorage.user_id, function(status){});
	});

	socket.on('disconnect', function () {
		alert('you have been disconnected');
	});

	socket.on('reconnect', function () {
		alert('you have been reconnected');
	});

	socket.on('reconnect_error', function () {
		console.log('attempt to reconnect has failed');
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
		currentTalkId = talkid;
		alert("Other side connected " + talkid);
	});

	socket.on('other side disconnected', function(talkid) {
		alert("Other side disconnected " + talkid);
		if (talkid === currentTalkId)
			currentTalkId = null;
	});

    $(document).keypress(function(e) {
        if(e.which === 13) {
	        if(currentTalkId === null)
	        	return alert("You are not connected!");
            sendMessage(currentTalkId, $("#message-input").val());
            $("#message-input").val("")
        }
    });

    $( "#connect" ).click(function() {
        joinCategory($("#message-input").val())
    });

    $( "#joinasexpert" ).click(function() {
		joinAsExpert($("#message-input").val())
    });

	$(".question").click(function(e) {
		var category = e.target.innerText;
		console.log(category);
		$("#questions").hide();
		joinCategory(category);
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
	$("#chatlog").append("<div class=\"row message-remote-row\">\n" +
		"                <div class=\"message\">\n" +
		"                    " + message + "\n" +
		"                </div>\n" +
		"            </div>")
}

function addLocalChatMessage(message) {
    $("#chatlog").append("<div class=\"row message-my-row\">\n" +
        "                <div class=\"message message-my\">\n" +
        "                    " + message + "\n" +
        "                </div>\n" +
        "            </div>")
}

function sendMessage(talkid, message) {
    socket.emit('new message', {talkid: talkid, message: message});
    addLocalChatMessage(message);
}

function startTyping(talkid) {
	socket.emit('start typing', talkid);
}

function stopTyping(talkid) {
	socket.emit('stop typing', talkid);
}


function joinCategory(categoryName) {
	socket.emit('join category', categoryName, function(status, talkid) {
		if(status) {
			$("#questions").hide();
			$("#chatRoom").show();
			$("#status").html("Connected with an expert in category: <b>"+categoryName+"</b>");
		} else {
			$("#questions").show();
			$("#chatRoom").hide();
			$("#status").html("?");
		}

		if(status)
			console.log("Talkid: "+talkid);
		else
			alert('sorry, no experts available');

        currentTalkId = talkid;
	});
}

function joinAsExpert(categoryName) {
	socket.emit('join expert', categoryName, function (status) {
		if(status) {
			$("#questions").hide();
			$("#chatRoom").show();
			$("#status").html("You are an expert in category: <b>"+categoryName+"</b>");
		} else {
			$("#questions").show();
			$("#chatRoom").hide();
			$("#status").html("?");
			alert('failed');
		}
	});
}
