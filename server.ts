import * as url from 'url';
import * as express from 'express';
import * as WebSocket from 'ws';
import * as db from './server/databaseFunctions';
import { signUserUp, signUserIn } from './server/authServer';
const app = express();

app.use(express.json());

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws:WebSocket, req) => {
	/* A client has connected to the server */
	console.log('A client has connected');
	//console.log(url.parse(req.url));
	ws.on('message', data => {
		console.log(`Client sent:> ${data}`);
		ws.send("I'm doing pretty well today, thanks.");
	})
	ws.on('close', () => {
		console.log("Closing connection");
	});
});

app.use(express.static('dist'));
app.post('/signup', signUserUp);
app.post('/signin', signUserIn);

app.listen(5555, () => {
	console.log('Listening on port 5555');
});
