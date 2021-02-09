const express = require('express');
const WebSocket = require('ws');
const app = express();

const ws = new WebSocket.Server({ port: 8080 });

ws.on('connection', () => {
	console.log('A client has connected');
	ws.on('message', data => {
		console.log(data);
	});
});

app.use(express.static('dist'));
app.listen(5555, () => {
	console.log('Listening on port 5555');
});
