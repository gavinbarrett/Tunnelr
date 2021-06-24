
import * as url from 'url';
import { checkForChannel } from './channels';
import * as db from './databaseFunctions';

export const handleWSConnection = async (wsocket:WebSocket, req) => {
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
	wsocket.onmessage = async data => {
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
		wsocket.send(JSON.stringify(d));
	}
	wsocket.onclose = () => {
		console.log("Closing connection");
	}
	if (exists.rows.length) {
		// grab all messages
		let n = await db.xread(roomid, 0);
		wsocket.send(JSON.stringify(n));
	}
}