
import * as url from 'url';
import { checkForChannelExistence } from './channels';
import * as db from './databaseFunctions';

let roomClients: Object = {};

export const handleWSConnection = async (wsocket:WebSocket, req) => {
    console.log(`A client has connected.`);
	const uobj = url.parse(req.url);
	const args = new URLSearchParams(uobj.search);
	const roomid = args.get("roomID");
	const username = args.get("user");
	// add a client websocket object to the array of clients in a room 
	if (roomClients[roomid]) {
		roomClients[roomid][username] = wsocket;
	} else {
		roomClients[roomid] = {};
		roomClients[roomid][username] = wsocket;
	}

	console.table(roomClients);

	const exists = await checkForChannelExistence(roomid);
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
		console.log(`${sender} sent:> ${message}`);
		// read the new stream
		// FIXME set the second arg to be the id of the last message sent to the user
		let newMessage = await db.xread(roomid, lastid);
		// FIXME: iterate through all clients in the room
		if (roomClients && roomClients[roomid]) {
			// iterate through the websocket clients connected to the channel
			
			for (const channel in roomClients[roomid]) {
				roomClients[roomid][channel].send(JSON.stringify(newMessage));
			}
			/*roomClients[roomid].map((elem, id) => {
				let key = Object.getOwnPropertyNames(elem);
				// send data to the client
				elem[key[0]].send(JSON.stringify(newMessage));
			});*/
		}
	}
	wsocket.onclose = () => {
		// remove websocket connection from roomClients
		console.log(`Closing ${username}'s connection to channel ${roomid}`);
		if (roomClients[roomid] && roomClients[roomid][username]) delete roomClients[roomid][username];
	}
	// check for messages in the channel
	if (exists.rows.length) {
		// grab all messages
		let messages = await db.xread(roomid, 0);
		// send the full set of messages to the client
		wsocket.send(JSON.stringify(messages));
	}
}