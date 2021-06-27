
import * as url from 'url';
import { checkForChannelExistence } from './channels';
import * as db from './databaseFunctions';

let roomClients: Object = {};

export const handleWSConnection = async (wsocket:WebSocket, req) => {
    console.log(`A client has connected from ${wsocket}`);
	console.log(`Sender: ${Object.getOwnPropertyNames(wsocket["_sender"])}`);
	console.log(`Receiver: ${Object.getOwnPropertyNames(wsocket["_receiver"])}`);
	// A client has connected from domain,_events,_eventsCount,_maxListeners,_binaryType,_closeCode,_closeFrameReceived,_closeFrameSent,_closeMessage,_closeTimer,_extensions,_protocol,_readyState,_receiver,_sender,_socket,_isServer
	const uobj = url.parse(req.url);
	const p = new URLSearchParams(uobj.search);
	const roomid = p.get("roomID");
	const username = p.get("user");
	// add a client websocket object to the array of clients in a room 
	
	console.log(`About to create object for user ${username}`);
	//const wsObj = {[`${username}`]: wsocket};
	console.log('Object created');
	// FIXME: add the websocket object under the roomid and username keys
	if (roomClients[roomid]/*&& roomClients[roomid].hasOwnProperty(username)*/) {
		console.log('Adding the socket to the old data store.');
		roomClients[roomid][username] = wsocket;
	} else {
		console.log('Adding the socket to the data store.');
		roomClients[roomid] = {};
		roomClients[roomid][username] = wsocket;
	}

	console.table(roomClients);
	// domain,_events,_eventsCount,_maxListeners,_binaryType,_closeCode,_closeFrameReceived,_closeFrameSent,_closeMessage,_closeTimer,_extensions,_protocol,_readyState,_receiver,_sender,_socket,_isServer

	const exists = await checkForChannelExistence(roomid);
	console.log(roomid);
	// FIXME: extract the id of the last message
	console.log(`Channel: ${exists.rows.length}`);
	// FIXME: Check pathname. If it doesn't correspond to a channel, reject connection
	wsocket.onmessage = async data => {
		// FIXME: put clients into a data store such as Redis based on room and send data out to all clients when the room gets a message
		console.log(`Receiving message on channel ${roomid}`);
		//console.log(`Data: ${data.data}`);
		const { sender, message, lastid } = JSON.parse(data.data);
		let string = `{"message": "${message}", "sender": "${sender}"}`
		console.log(`Last message was: ${lastid}`);
		// add message payload to the stream
		db.xadd(roomid, string);
		// read the new stream
		// FIXME set the second arg to be the id of the last message sent to the user
		let d = await db.xread(roomid, lastid);
		console.log(`d: ${d}`);
		console.log(`${sender} sent:> ${message}`);
		// FIXME: iterate through all clients in the room
		if (roomClients && roomClients[roomid]) {
			console.log('About to loop through clients.');
			console.log(roomClients[roomid]);
			roomClients[roomid].map((elem, id) => {
				let key = Object.getOwnPropertyNames(elem);
				console.log(`Key: ${key}`);
				// send data to the client
				elem[key[0]].send(JSON.stringify(d));
			});
		}
	}
	wsocket.onclose = () => {
		console.log(`Closing ${username}'s connection to channel ${roomid}`);
		// remove websocket connection from roomClients
		if (roomClients[roomid] && roomClients[roomid][username]) delete roomClients[roomid][username];
	}
	if (exists.rows.length) {
		// grab all messages
		let n = await db.xread(roomid, 0);
		wsocket.send(JSON.stringify(n));
	}
}