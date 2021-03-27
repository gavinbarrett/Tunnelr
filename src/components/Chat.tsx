import * as React from 'react';
import './sass/Chat.scss';

const PromptBox = ({showing}) => {
	return (<div className={`prompt ${showing}`}>
		<div className={`prompt-box ${showing}`}>
			{"This is a prompt"}
		</div>
	</div>);
}

const Channel = () => {
	const [message, updateMessage] = React.useState('');
	const sendMessage = () => {
		if (message === '') return;
		console.log(message);
	}
	return (<div className="channel">
		<input placeholder={"Input your chat here"} onChange={e => updateMessage(e.target.value)}/>
		<button onClick={sendMessage}>{"Send"}</button>
	</div>);
}

const SideBar = ({expanded, updateExpanded, prmpt, updatePrompt, updatePage}) => {
	const alter = () => {
		// toggle expanding sidebar on and off
		expanded.length ? updateExpanded('') : updateExpanded('expanded');
	}
	const upPrompt = () => {
		// toggle 
		if (expanded.length)
			prmpt.length ? updatePrompt('') : updatePrompt('showing');
	}
	const upPage = () => {
		updatePage(<Channel/>);
	}
	const upHome = () => {
		updatePage(<ChatMenu/>);
	}
	return (<div className={`channel-bar ${expanded}`}>
		<div id="box" onClick={alter}></div>
		<div className={`add-channel${expanded}`} onClick={upHome}>{"Chat Menu"}</div>
		<div className={`add-channel${expanded}`} onClick={upPrompt}>{"+ Add Channel"}</div>
		<div className={`add-channel${expanded}`} onClick={upPage}>{"Test Channel"}</div>
	</div>);
}


const ChatMenu = () => {

	const queryFriend = async () => {
		// FIXME: validate input
		// FIXME: if valid, send to server to query db
	}

	const queryBox = async () => {
		// FIXME: validate input
		// FIXME: if valid, send to server to query db
	}

	return(<div id="chat-menu">
		<div id="friend-search-box">
			<p className="search-title">{"search for friends"}</p>
			<div className="search-box-wrapper">
				<input className="search-box" id="friend-search"/>
			</div>
		</div>
		<div id="channel-search-box">
			<p className="search-title">{"search for boxes"}</p>
			<div className="search-box-wrapper">
				<input className="search-box" id="channel-search"/>
			</div>
		</div>
	</div>);
}

export const Chat = () => {
	const [message, updateMessage] = React.useState('');
	const [expanded, updateExpanded] = React.useState('');
	const [prmpt, updatePrompt] = React.useState('');
	const [page, updatePage] = React.useState(<ChatMenu/>);
	return (<div id="chat-wrapper">
		<SideBar expanded={expanded} updateExpanded={updateExpanded} prmpt={prmpt} updatePrompt={updatePrompt} updatePage={updatePage}/>
			{page}
		<PromptBox showing={prmpt}/>
	</div>);
}
