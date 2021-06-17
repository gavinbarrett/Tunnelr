//import * as urlp from 'url';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import * as db from './server/databaseFunctions';
import { authenticateUser, retrieveSession, signUserUp, signUserIn } from './server/authServer';
import { addChannel, checkForChannel, getMessages, getUpdatedMessages, loadChannels, queryChannel } from './server/channels';
import { queryFriend } from './server/friends';
import { loadAccount } from './server/accounts';
import * as url from 'url';
import * as WebSocket from 'ws';

const wss = new WebSocket.Server({ port: 8080 });

// create express app instance
const app = express();
// import environment variables
dotenv.config();

// parse json
app.use(express.json());
// parse cookies
app.use(cookieParser(process.env.SERVERSEC));

app.use(express.static('dist'));
app.post('/signup', signUserUp);
app.post('/signin', signUserIn);

/* authenticated functions */
app.get('/getsession', authenticateUser, retrieveSession);
app.get('/loadchannels', authenticateUser, loadChannels);
app.get('/loadaccount', authenticateUser, loadAccount);
app.get('/getmessages', authenticateUser, getMessages);
app.get('/getupdatedmessages', authenticateUser, getUpdatedMessages);
app.post('/queryfriend', authenticateUser, queryFriend);
app.post('/querychannel', authenticateUser, queryChannel);
app.post('/addchannel', authenticateUser, addChannel);

wss.on('connection', async (ws:WebSocket, req) => {
	console.log('A client has connected');
	const uobj = url.parse(req.url);
	const pathname = uobj.pathname;
	const p = new URLSearchParams(uobj.search);
	const roomid = p.get("roomID");
	const exists = await checkForChannel(roomid);
	console.log(roomid);
	console.log(`Channel: ${exists.rows.length}`);
	// FIXME: Check pathname. If it doesn't correspond to a channel, reject connection
	ws.on('message', data => {
		console.log(`Receiving message on channel ${roomid}`);
		const { sender, message } = JSON.parse(data.toString('utf-8'));
		db.xadd(roomid, message, sender);
		console.log(`${sender} sent:> ${message}`);
	});
	ws.on('close', () => {
		console.log("Closing connection");
	});
});

app.listen(5555, () => {
	console.log('Listening on port 5555');
});
