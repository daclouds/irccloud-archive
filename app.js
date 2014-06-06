var config = require('./config');

var request = require('request');
var WebSocketClient = require('websocket').client;

var options = {
	url: 'https://www.irccloud.com/chat/auth-formtoken',
	headers: {
		'Content-Length': 0
	}
};

request.post(options, function(err, response, body) {
	var body = JSON.parse(body);
	login(body.token);
});

function login(token) {
	options.url = 'https://www.irccloud.com/chat/login';
	options.headers = {
		'x-auth-formtoken': token
	};
	options.form = {
		'email': config.email,
		'password': config.password,
		'token': token
	};
	request.post(options, function(err, response, body) {
		stream(body);
	});
}

function stream(options) {

	var json = JSON.parse(options);
	// console.log(json);
	var headers = {
		'Upgrade': 'WebSocket',
		'Connection': 'Upgrade',
		// 'User-Agent': '[REDACTED]',
		'Cookie': 'session=' + json.session,
		// 'Sec-WebSocket-Key': '[REDACTED]==',
		'Host': 'www.irccloud.com',
		'Origin': 'https://www.irccloud.com',
		'Sec-WebSocket-Version': '13'
	};

	var protocols = {
		'Sec-WebSocket-Protocol': 'chat' 
	};

	var origin = 'https://www.irccloud.com';
	var requestUrl = 'wss://'+ json.websocket_host + json.websocket_path;
	// console.log(requestUrl);

	var client = new WebSocketClient();
	var streamid = '';
	
	client.on('connectFailed', function(error) {
		console.log('Connect Error: ' + error.toString());
	});
	
	client.on('connect', function(connection) {
		console.log('WebSocket client connected');
		connection.on('error', function(error) {
			console.log('Connection Error: ' + error.toString());
		});
		connection.on('close', function() {
			console.log('Connection Closed');
		});
		connection.on('message', function(message) {
			if (message.type == 'utf8') {
				var utf8Data = JSON.parse(message.utf8Data);
				console.log(utf8Data);
				
				if (utf8Data.type == 'header') {
					streamid = utf8Data.streamid;
				}
				
				/*
				if (utf8Data.type == 'oob_include') {
					console.log(utf8Data.url);
					requestUrl = 'https://' + json.websocket_host + utf8Data.url;
					console.log('requestUrl: ', requestUrl);

					headers['streamid'] = streamid;

					headers['Origin'] = 'https://alpha.irccloud.com';
					origin = 'https://alpha.irccloud.com';

					// console.log(headers);
					// client.connect(requestUrl, protocols, origin, headers);									
				}
				*/
			}
		});
	});
	
	client.connect(requestUrl, protocols, origin, headers);
}
