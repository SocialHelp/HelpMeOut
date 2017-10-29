var socket;
var currentTalkId = null;
var activeConversations = [];

function generate_id() {
	return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, function() {
		return (Math.random() * 16).toString(16)[0];
	});
}

localStorage.user_id = localStorage.user_id || generate_id();
//localStorage.user_id = generate_id();

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

    socket.on('new message', function (message) {
        console.log("New message: " + message.talkid + " " + message.message);
    	addChatMessage(message.talkid, message.message);
    });

	socket.on('other side connected', function(talkid) {
		if ($("#status").html().indexOf("buddy") !== -1) { // TODO: a terrible hack (yeah!)
			$("#status").html($("#status").html().replace("Waiting for", "Connected with"));
		}

		var conversation = activeConversations.filter(function( obj ) {
            return obj.id == talkid;
        })[0];

		console.log(conversation);

        if (conversation == undefined || !conversation.active) {
        	console.log(currentTalkId);
        	console.log(conversation);
            if (!$("#chatlog-"+talkid).length) {
            	conversation = {id: talkid, active: true};
                activeConversations.push(conversation);
                addTab(talkid);
            } else if (conversation.id == currentTalkId) {
                $("#message-input").prop("disabled", false);
                $("#message-input").val("");
			} else if (currentTalkId === null) {
            	console.log("ppp");
				currentTalkId = talkid;
                $("#message-input").prop("disabled", false);
                $("#message-input").val("");
            }
            conversation.active = true;
        }
	});

	socket.on('other side disconnected', function(talkid) {
    	activeConversations.find(function (obj) { return obj.id === talkid; }).active = false;
		if (talkid === currentTalkId) {
            currentTalkId = null;
            $("#message-input").prop("disabled", true);
            $("#message-input").val("Rozmówca jest rozłączony");
        }
	});

    $(document).keypress(function(e) {
        if(e.which === 13) {
	        if(currentTalkId === null)
	        	return alert("You are not connected!");
            sendMessage(currentTalkId, $("#message-input").val()); // TODO: Sprawdź czy podłączone
            $("#message-input").val("");
        }
    });

	$(".question").click(function(e) {
		var category = e.target.innerText;
		$(".question").hide();
		(!e.ctrlKey?e.shiftKey?joinAsExpert:joinCategory:joinBuddy)(category);
	});
});

// This adds message to the chat log
function addChatMessage(talkid, message) {
	$("#chatlog-"+talkid).append("<div class=\"row message-remote-row\">\n" +
		"                <div class=\"message\">\n" +
		"                    " + message + "\n" +
		"                </div>\n" +
		"            </div>")
}

function addLocalChatMessage(message) {
	console.log("Chat message sent: " + message + " " + currentTalkId);
    $("#chatlog-"+currentTalkId).append("<div class=\"row message-my-row\">\n" +
        "                <div class=\"message message-my\">\n" +
        "                    " + message + "\n" +
        "                </div>\n" +
        "            </div>")
}

function addTab(talkid) {
    $("#conversations-tabs").append(
        "        <li class=\"nav-item\">\n" +
        "            <a class=\"conversation-tab nav-link\" data-tab-id=\"" + talkid + "\" href=\"#\">" + talkid + "</a>" +
        "        </li>\n");

    $("#chat-logs").append("<div class='tab' id=\"chatlog-" + talkid + "\">\n" +
        "\n" +
        "</div>");

    $(".conversation-tab[data-tab-id='"+talkid+"']").click(function (e) {
        currentTalkId = e.target.dataset.tabId;
        $(".active-tab").removeClass("active-tab");
        $(".active").removeClass("active");
        $(e.target).addClass("active");

        var status = !activeConversations.find(function (obj) { return obj.id === talkid; }).active;
        $("#message-input").prop("disabled", status);

		$("#message-input").val(status ? "Rozmówca jest rozłączony" : "");
        $("#chatlog-"+currentTalkId).addClass("active-tab");
    });

    if (currentTalkId === null) {
        currentTalkId = talkid;
        $(".conversation-tab[data-tab-id='"+talkid+"']").addClass("active");
        $("#chatlog-"+talkid).addClass("active-tab");
    }
}

function sendMessage(talkid, message) {
    socket.emit('new message', {talkid: talkid, message: message});
    addLocalChatMessage(message);
}

function joinCategory(categoryName) {
	socket.emit('join category', categoryName, function(status, talkid) {
		if(status) {
			$(".question").hide();
			$("#chatRoom").show();
			$("#status").html("Connected with an expert in category: <b>"+categoryName+"</b>");
		} else {
			$(".question").show();
			$("#chatRoom").hide();
			$("#status").html("?");
		}

		if(status) {
            if (!activeConversations.filter(function( obj ) {
                return obj.id == talkid;
            }).active) {
                activeConversations.push({id: talkid, active: true});
                addTab(talkid);
            }
        } else
			alert('sorry, no experts available');

        currentTalkId = talkid;
	});
}

function joinAsExpert(categoryName) {
	socket.emit('join expert', categoryName, function (status) {
		if(status) {
			$(".question").hide();
			$("#chatRoom").show();
			$("#status").html("You are an expert in category: <b>"+categoryName+"</b>");
		} else {
			$(".question").show();
			$("#chatRoom").hide();
			$("#status").html("?");
			alert('failed');
		}
	});
}

function joinBuddy(categoryName) {
	socket.emit('join buddy talk', categoryName, function(status, talkid) {
		if(status) {
			$(".question").hide();
			$("#chatRoom").show();
			$("#status").html((talkid !== null ? "Connected with" : "Waiting for") + " a buddy in category: <b>"+categoryName+"</b>");

			if(talkid != null) {
				if (!(talkid in activeConversations)) {
					activeConversations.push(talkid);
					addTab(talkid);
				}

				currentTalkId = talkid;
			}
		} else {
			$(".question").show();
			$("#chatRoom").hide();
			$("#status").html("?");
			alert('error');
		}
	});
}
