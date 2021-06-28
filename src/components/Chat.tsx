import * as React from 'react';
import { useHistory } from 'react-router-dom';
import { Channel } from './Channel';
import { PromptBox } from './PromptBox';
import { Footer } from './Footer';
import './sass/Chat.scss';

const SideBar = ({expanded, updateExpanded, prmpt, updatePrompt, updatePage, userChannels, user, setSocket, wsocket, minimized, updateMinimized}) => {
	const [id, updateID] = React.useState();
	const [activeChannel, updateActiveChannel] = React.useState('');
	const switchPage = () => {
		// toggle expanding sidebar on and off
		expanded.length ? updateExpanded('') : updateExpanded('expanded');
		expanded.length ? updateMinimized('minimized') : updateMinimized('');
	}
	const upPrompt = () => {
		// toggle 
		if (expanded.length)
			prmpt.length ? updatePrompt('') : updatePrompt('showing');
	}
	const upPage = value => () => {
		if (expanded.length) {
			// display the channel page
			updatePage(<Channel sender={user} id={value} wsocket={wsocket} minimized={minimized} updateMinimized={updateMinimized}/>);
			// open a websocket on the {value} channel
			setSocket(value);
		}
	}
	const upHome = () => {
		if (expanded.length)
			updatePage(<ChatMenu minimized={minimized} updateMinimized={updateMinimized}/>);
	}
	return (<div className={`channel-bar ${expanded}`}>
		<div id="box" onClick={switchPage}>{">"}</div>
		<div className={`add-channel${expanded} chatmenu`} onClick={upHome}>{"Chat Menu"}</div>
		<div className={`add-channel${expanded} addchannel`} onClick={upPrompt}>
			<div className="channel-banner">
				{"+ New Channel"}
			</div>
		</div>
		{userChannels.length ? userChannels.map((elem, idx) => {
			return <div key={idx} className={`add-channel${expanded}`} onClick={upPage(elem.channelname)}>{elem.channelname}</div>
		}) : ''}
	</div>);
}

const ChatMenu = ({minimized, updateMinimized}) => {
	const [friendSearchList, updateFriendSearchList] = React.useState([]);
	const [channelSearchList, updateChannelSearchList] = React.useState([]);
	const history = useHistory();
	const queryFriend = async event => {
		// FIXME: validate input
		// FIXME: if valid, send to server to query db
		console.log(event.target.value);
		if (event.target.value === '') {
			updateFriendSearchList([]);
			return;
		}
		if (event.target.value.match(/^[a-z0-9]+$/i)) {
			const resp = await fetch("/queryfriend", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({"username": event.target.value})});
			const r = await resp.json();
			console.log(r);
			if (r["status"] === "failed") return;
			else updateFriendSearchList(r["status"]);
		}
	}
	const queryChannel = async event => {
		// FIXME: validate input
		// FIXME: if valid, send to server to query db
		console.log(event.target.value);
		if (event.target.value === '') {
			updateChannelSearchList([]);
			return;
		}
		if (event.target.value.match(/^[a-z0-9]+$/i)) {
			const resp = await fetch("/querychannel", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({"channelid": event.target.value})});
			const r = await resp.json();
			console.log(r);
			if (r["status"] === "failed") return;
			else updateChannelSearchList(r["status"]);
		}
	}
	const showUser = user => {
		console.log(`Showing ${user}`);
		history.push(`/account/${user}`);
	}
	const showChannel = channel => {
		console.log(channel);
		history.push(`/channel/${channel}`);
	}
	const addFriendFromSuggestions = async () => {} 
	return(<div className={`chat-menu ${minimized}`}>
		<div id="friend-search-box">
			<p className="search-title">{"search for friends"}</p>
			<div className="search-box-wrapper">
				<input className="search-box" id="friend-search" placeholder={'e.g. beatbox99'} onChange={queryFriend}/>
				<div id="friend-search-list">
					{friendSearchList.length ? friendSearchList.map(elem => {
						return <div className="friend-box"><p className="friend-sugg" onClick={() => showUser(elem.username)}>{elem.username}</p><p className={"friend-box-add"} onClick={addFriendFromSuggestions}>{"+"}</p></div>;
					}) : ''}
				</div>
			</div>
		</div>
		<div id="channel-search-box">
			<p className="search-title">{"search for channels"}</p>
			<div className="search-box-wrapper">
				<input list="channel-search-list" className="search-box" id="channel-search" placeholder={'e.g. @meadowpeak'} onChange={queryChannel}/>
				<div id="channel-search-list">
					{channelSearchList.length ? channelSearchList.map(elem => {
						return <p className={"channel-sugg"} onClick={() => showChannel(elem.channelname)}>{elem.channelname}</p>;
					}) : ''}
				</div>
			</div>
		</div>
	</div>);
}

export const Chat = ({user}) => {
	const [message, updateMessage] = React.useState('');
	const [expanded, updateExpanded] = React.useState('');
	const [prmpt, updatePrompt] = React.useState('');
	const [userChannels, updateUserChannels] = React.useState([]);
	const [channelID, updateChannelID] = React.useState('');
	const [minimized, updateMinimized] = React.useState('');
	const [page, updatePage] = React.useState(<ChatMenu minimized={minimized} updateMinimized={updateMinimized}/>);
	const wsocket = React.useRef(null);

	React.useEffect(() => {
		loadUserChannels();
	}, []);

	const loadUserChannels = async () => {
		/* load the channels the user belongs to */
		const resp = await fetch("/loadchannels", {method: "GET"});
		const r = await resp.json();
		console.log(r['status']);
		if (r["status"] !== "failed")
			updateUserChannels(r["status"]);
	}

	const setSocket = id => {
		if (wsocket.current) {
			wsocket.current.close();
			console.log('Closed old websocket connection.');
		}
		console.log(`Opening channel: ${id}`);
		// establish websocket connection
		wsocket.current = new WebSocket(`ws://192.168.1.110:8080/?roomID=${id}&user=${user}`);
		console.log(`WebSocket channel ${id} established.`);
	}
	return (<><div id="chat-wrapper">
		<SideBar expanded={expanded} updateExpanded={updateExpanded} prmpt={prmpt} updatePrompt={updatePrompt} updatePage={updatePage} userChannels={userChannels} user={user} setSocket={setSocket} wsocket={wsocket} minimized={minimized} updateMinimized={updateMinimized}/>
			{page}
		<PromptBox showing={prmpt} updatePrompt={updatePrompt} loadChannels={loadUserChannels}/>
	</div>
	<Footer/></>);
}