//import * as urlp from 'url';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
//import * as WebSocket from 'ws';
import * as db from './server/databaseFunctions';
import { authenticateUser, retrieveSession, signUserUp, signUserIn } from './server/authServer';
import * as wss from './server/websocketServer';

// create express app instance
const app = express();
// import environment variables
dotenv.config()

// parse json
app.use(express.json());
// parse cookies
app.use(cookieParser(process.env.SERVERSEC));

const queryFriend = async (req, res) => {
	const { friendid } = req.body;
	console.log(friendid);
	const q = 'select * from friends where friend ~* $1';
	res.send(JSON.stringify({"status": "succeeded"}));
}

const queryChannel = async (req, res) => {
	const { channelid } = req.body;
	console.log(channelid);
	const q = 'select * from channels where channel ~* $1';
	res.send(JSON.stringify({"status": "succeeded"}));
}

app.use(express.static('dist'));
app.post('/signup', signUserUp);
app.post('/signin', signUserIn);

/* authenticated functions */
app.get('/getsession', authenticateUser, retrieveSession);
app.post('/queryfriend', authenticateUser, queryFriend);
app.post('/querychannel', authenticateUser, queryChannel);

app.listen(5555, () => {
	console.log('Listening on port 5555');
});
