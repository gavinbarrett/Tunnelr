import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import * as multer from 'multer';
import { authorizeUser, retrieveSession, signUserUp, signUserIn, verifyAccount } from './server/authServer';
import { addChannel, checkForChannel, getMessages, getUpdatedMessages, joinPublicChannel, joinPSKChannel, leaveChannel, loadChannels, loadChannelInfo, queryChannel } from './server/channels';
import { addFriend, findAllUserFriends, queryFriend } from './server/friends';
import { changePassword, deleteAccount, loadUserInfo, logUserOut } from './server/accounts';
import { emailFromOutside, emailFromUser } from './server/contact';
import { handleWSConnection } from './server/websocketServer';
import { uploadUserProfile } from './server/profile';
import { checkForUserTables } from './server/config_db';
import * as WebSocket from 'ws';

const wss = new WebSocket.Server({ port: 8080 });

// create express app instance
const app = express();
// import environment variables
dotenv.config();

const storage = multer.diskStorage({
	destination: './data/profiles/',
	filename: function(req, file, callback) {
		console.log(`The file: ${Object.getOwnPropertyNames(file)}`);
		console.log(file.fieldname);
		console.log(file.originalname);
		console.log(`Req: ${Object.getOwnPropertyNames(req)}`);
		// get uploaded file name
		const filename: string = file.originalname;
		console.log(`Filename: ${filename}`);
		// split by period to get the extension
		const file_parts: Array<string> = filename.split('.').filter(part => part.length);
		// check if the filename contained an extension separated by a period
		console.log(file_parts);
		if (file_parts.length == 2 && file_parts[1] && file_parts[1].length <= 4) {
			const ext: string = file_parts[1];
			const nonce: string = crypto.randomBytes(32).toString('hex');
			console.log(`Saving filename: ${nonce}.${ext}`);
			const new_file = `${nonce}.${ext}`;
			file.originalname = new_file;
			callback(null, new_file);
		} else {
			callback(null, null);
		}
	}
});

export const uploadProfile = multer({ 
	storage: storage,
	fileFilter: function(req, file, cb) {
		// get uploaded file name
		const filename: string = file.originalname;
		console.log(`Filename: ${filename}`);
		// split by period to get the extension
		const file_parts: Array<string> = filename.split('.').filter(part => part.length);
		// check if the filename contained an extension separated by a period
		console.log(file_parts);
		if (file_parts.length == 2 && file_parts[1] && file_parts[1].length <= 4)
			cb(null, true);
		else
			return cb(null, false);
	}
 }).single("file");

// make sure the database and tables are established
checkForUserTables();

// parse json
app.use(express.json({limit: '100mb'}));
// parse cookies
app.use(cookieParser(process.env.SERVERSEC));
app.use(express.static('dist'));

app.post('/signup', signUserUp);
app.get('/verifyaccount', verifyAccount);
app.post('/signin', signUserIn);
app.post('/emailfromoutside', emailFromOutside);

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
app.post('/uploaduserprofile', authorizeUser, uploadProfile, uploadUserProfile);
// change a user's password
app.post('/changepassword', authorizeUser, changePassword);
app.post('/deleteaccount', authorizeUser, deleteAccount);
// search for friends based on a regex
app.post('/queryfriend', authorizeUser, queryFriend);
// search for channels based on a regex
app.post('/querychannel', authorizeUser, queryChannel);
// create a new channel - ** FIXME: change name to createchannel **
app.post('/addchannel', authorizeUser, addChannel);
// send an email to Tunnelr's support from an authorized user
app.post('/emailfromuser', authorizeUser, emailFromUser);

wss.on('connection', handleWSConnection);

app.listen(5000, () => {
	console.log('Listening on port 5000');
});