//import * as urlp from 'url';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { authorizeUser, retrieveSession, signUserUp, signUserIn } from './server/authServer';
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
app.get('/getsession', authorizeUser, retrieveSession);
// log user out of Tunnelr
app.get('/logout', authorizeUser, logUserOut);
// load user channels
app.get('/loadchannels', authorizeUser, loadChannels);
// get messages from channel - ** FIXME: check user against channel access controls **
app.get('/getmessages', authorizeUser, getMessages);
// get updated messages from channel
app.get('/getupdatedmessages', authorizeUser, getUpdatedMessages);
app.get('/findalluserfriends', authorizeUser, findAllUserFriends);
// load channel info
app.get('/loadchannelinfo', authorizeUser, loadChannelInfo);
// load user info
app.get('/loaduserinfo', authorizeUser, loadUserInfo);
// join a channel
app.get('/joinchannel', authorizeUser, joinPublicChannel);
// add a friend
app.get('/addfriend', authorizeUser, addFriend);
// join a channel protected by a shared password
app.post('/joinpskchannel', authorizeUser, joinPSKChannel);
// leave a channel the user is subscribed to
app.get('/leavechannel', authorizeUser, leaveChannel);
// change a user's profile picture
app.put('/uploaduserprofile', upload.single('profile'), authorizeUser, uploadUserProfile);
// change a user's password
app.post('/changepassword', authorizeUser, changePassword);
app.post('/deleteaccount', authorizeUser, deleteAccount);
// search for friends based on a regex
app.post('/queryfriend', authorizeUser, queryFriend);
// search for channels based on a regex
app.post('/querychannel', authorizeUser, queryChannel);
// create a new channel - ** FIXME: change name to createchannel **
app.post('/addchannel', authorizeUser, addChannel);

wss.on('connection', handleWSConnection);

app.listen(5555, () => {
	console.log('Listening on port 5555');
});