import * as url from 'url';
import * as WebSocket from 'ws';
import { authenticateUser } from './authServer';

export const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws:WebSocket, req) => {
	/* A client has connected to the server */
	console.log('A client has connected');
	const uobj = url.parse(req.url, true);
	const pathname = uobj.pathname;
	const query = uobj.query;
	console.log(pathname);
	console.log(query);
	ws.on('message', data => {
		console.log(`Client sent:> ${data}`);
		ws.send("I'm doing pretty well today, thanks.");
	})
	ws.on('close', () => {
		console.log("Closing connection");
	});
});
