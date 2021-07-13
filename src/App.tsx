import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Router from 'react-router-dom';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { SignUp } from './components/SignUp';
import { SignIn } from './components/SignIn';
import { Account } from './components/Account';
import { Contact } from './components/Contact';
import { ChannelPage } from './components/ChannelPage';
import { Chat } from './components/Chat';
import { NotFound } from './components/NotFound';
import { UserInfo } from './UserInfo';
import { Messages } from './Messages';
import './components/sass/App.scss';

const App = () => {
	const [landingMessage, updateLandingMessage] = React.useState('');
	const [errorMessage, updateErrorMessage] = React.useState('');
	const [user, updateUser] = React.useState('');
	const [loggedIn, updateLoggedIn] = React.useState(false);
	const [joined, updateJoined] = React.useState('');
	const [profile, updateProfile] = React.useState('images/blank.png');
	const [friends, updateFriends] = React.useState([]);
	const [pending, updatePending] = React.useState([]);
	const [channels, updateChannels] = React.useState([]);
	// FIXME once a user logs in, store their name, joined date, list of channels and friends, and profile pic
	const loc = Router.useLocation();
	React.useEffect(() => {
		// try to retrieve prior session
		getSession();
	}, []);
	const getSession = async () => {
		const resp = await fetch("/getsession", {method: "GET"});
		// FIXME: ajax should return the user's profile picture, friends list, joined channels, and joined date
		if (resp.status == 200) {
			const payload = await resp.json();
			// FIXME: couldn't reauth session, dont log user back in
			console.log("No session exists; please log in.");
			console.log('Logging user back into their session');
			const { user, created_at, friends, pending, channels, profile } = payload; 
			updateLoggedIn(true);
			updateUser(user);
			const created_date = created_at.split(' ');
			const date = created_date.splice(1, 3);
			updateJoined(date.join(' '));
			updateFriends(friends);
			updatePending(pending);
			updateChannels(channels);
			profile ? updateProfile(`data:image/png;base64,${profile}`) : updateProfile('images/blank.png');
		}
	}
	return (<div className="app-wrapper">
		<UserInfo.Provider value={{user, updateUser, loggedIn, updateLoggedIn, joined, updateJoined, profile, updateProfile, friends, updateFriends, pending, updatePending, channels, updateChannels, loc}}>
		<Messages.Provider value={{landingMessage, updateLandingMessage, errorMessage, updateErrorMessage}}>
			<Header user={user} loggedIn={loggedIn}/>
			<Router.Switch>
				<Router.Route path="/" exact render={() => <LandingPage/>}/>
				<Router.Route path="/signup" render={() => <SignUp/>}/>
				<Router.Route path="/signin" render={() => <SignIn/>}/>
				<Router.Route path="/account" render={() => <Account/>}/>
				<Router.Route path="/contact" render={() => <Contact/>}/>
				<Router.Route path="/channel" render={() => <ChannelPage/>}/>
				<Router.Route path="/chat">
					{loggedIn ? <Chat user={user}/> : <Router.Redirect to="/signin"/>}
				</Router.Route>
				<Router.Route path="/notfound" render={() => <NotFound/>}/>
				<Router.Route path="/*">
					<Router.Redirect to="/notfound"/>
				</Router.Route>
			</Router.Switch>
		</Messages.Provider>
		</UserInfo.Provider>
	</div>);
}

ReactDOM.render(<Router.HashRouter><App/></Router.HashRouter>, document.getElementById('root'));