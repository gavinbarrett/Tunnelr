//import * as urlp from 'url';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
//import * as WebSocket from 'ws';
import * as db from './server/databaseFunctions';
import { authenticateUser, retrieveSession, signUserUp, signUserIn } from './server/authServer';
import { addChannel, loadChannels, queryChannel } from './server/channels';
import { queryFriend } from './server/friends';
import * as wss from './server/websocketServer';

// create express app instance
const app = express();
// import environment variables
dotenv.config()

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
app.post('/queryfriend', authenticateUser, queryFriend);
app.post('/querychannel', authenticateUser, queryChannel);
app.post('/addchannel', authenticateUser, addChannel);


app.listen(5555, () => {
	console.log('Listening on port 5555');
});
