//import * as urlp from 'url';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { authenticateUser, retrieveSession, signUserUp, signUserIn } from './server/authServer';
import { addChannel, checkForChannel, getMessages, getUpdatedMessages, joinPublicChannel, joinPSKChannel, leaveChannel, loadChannels, loadChannelInfo, queryChannel } from './server/channels';
import { addFriend, findAllUserFriends, queryFriend } from './server/friends';
import { changePassword, deleteAccount, loadUserInfo, logUserOut, uploadUserProfile } from './server/accounts';
import { handleWSConnection } from './server/websocketServer';
import * as multer from 'multer';
import * as WebSocket from 'ws';

const wss = new WebSocket.Server({ port: 8080 });

// create express app instance
const app = express();
// import environment variables
dotenv.config();

// parse json
app.use(express.json({limit: '100mb'}));
// parse cookies
app.use(cookieParser(process.env.SERVERSEC));
const upload = multer({ storage: multer.memoryStorage() });
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
app.get('/findalluserfriends', authenticateUser, findAllUserFriends);
// load channel info
app.get('/loadchannelinfo', authenticateUser, loadChannelInfo);
// load user info
app.get('/loaduserinfo', authenticateUser, loadUserInfo);
// join a channel
app.get('/joinchannel', authenticateUser, joinPublicChannel);
// add a friend
app.get('/addfriend', authenticateUser, addFriend);
// join a channel protected by a shared password
app.post('/joinpskchannel', authenticateUser, joinPSKChannel);
// leave a channel the user is subscribed to
app.get('/leavechannel', authenticateUser, leaveChannel);
// change a user's profile picture
app.put('/uploaduserprofile', upload.single('profile'), authenticateUser, uploadUserProfile);
// change a user's password
app.post('/changepassword', authenticateUser, changePassword);
app.post('/deleteaccount', authenticateUser, deleteAccount);
// search for friends based on a regex
app.post('/queryfriend', authenticateUser, queryFriend);
// search for channels based on a regex
app.post('/querychannel', authenticateUser, queryChannel);
// create a new channel - ** FIXME: change name to createchannel **
app.post('/addchannel', authenticateUser, addChannel);

wss.on('connection', handleWSConnection);

app.listen(5555, () => {
	console.log('Listening on port 5555');
});