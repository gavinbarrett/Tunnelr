//import * as urlp from 'url';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import * as db from './server/databaseFunctions';
import { authenticateUser, retrieveSession, signUserUp, signUserIn } from './server/authServer';
import { addChannel, checkForChannel, getMessages, getUpdatedMessages, loadChannels, loadChannelInfo, queryChannel } from './server/channels';
import { queryFriend } from './server/friends';
import { loadUserInfo, logUserOut } from './server/accounts';
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

/* 
authenticated functions 
*/
// retrieve user session
app.get('/getsession', authenticateUser, retrieveSession);
// log user out of Tunnelr
app.get('/logout', authenticateUser, logUserOut);
// load user channels
app.get('/loadchannels', authenticateUser, loadChannels);
// get messages from channel - ** FIXME: check user against channel access controls **
app.get('/getmessages', authenticateUser, getMessages);
// get updated messages from channel
app.get('/getupdatedmessages', authenticateUser, getUpdatedMessages);
// load channel info
app.get('/loadchannelinfo', authenticateUser, loadChannelInfo);
// load user info
app.get(`/loaduserinfo`, authenticateUser, loadUserInfo);
// search for friends based on a regex
app.post('/queryfriend', authenticateUser, queryFriend);
// search for channels based on a regex
app.post('/querychannel', authenticateUser, queryChannel);
// create a new channel - ** FIXME: change name to createchannel **
app.post('/addchannel', authenticateUser, addChannel);

wss.on('connection', async (ws:WebSocket, req) => {
	console.log('A client has connected');
	const uobj = url.parse(req.url);
	const pathname = uobj.pathname;
	const p = new URLSearchParams(uobj.search);
	const roomid = p.get("roomID");
	const exists = await checkForChannel(roomid);
	console.log(roomid);
	// FIXME: extract the id of the last message
	console.log(`Channel: ${exists.rows.length}`);
	// FIXME: Check pathname. If it doesn't correspond to a channel, reject connection
	ws.on('message', async data => {
		console.log(`Receiving message on channel ${roomid}`);
		const { sender, message, lastid } = JSON.parse(data.toString('utf-8'));
		let string = `{"message": "${message}", "sender": "${sender}"}`
		console.log(`Last message was: ${lastid}`);
		// add message payload to the stream
		db.xadd(roomid, string);
		// read the new stream
		// FIXME set the second arg to be the id of the last message sent to the user
		let d = await db.xread(roomid, lastid);
		console.log(`d: ${d}`);
		console.log(`${sender} sent:> ${message}`);
		ws.send(JSON.stringify(d));
	});
	ws.on('close', () => {
		console.log("Closing connection");
	});
	if (exists.rows.length) {
		// grab all messages
		let n = await db.xread(roomid, 0);
		ws.send(JSON.stringify(n));
	}
});

app.listen(5555, () => {
	console.log('Listening on port 5555');
});