import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Router from 'react-router-dom';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { SignUp } from './components/SignUp';
import { SignIn } from './components/SignIn';
import { Account } from './components/Account';
import { ChannelPage } from './components/ChannelPage';
import { Chat } from './components/Chat';
import './components/sass/App.scss';

export const UserAuth = () => {
	const AuthContext = React.useContext([]);
	return (<div id="">
	</div>);
}

const App = () => {
	const [user, updateUser] = React.useState('');
	const [loggedIn, updateLoggedIn] = React.useState(false);
	const [profile, updateProfile] = React.useState('images/blank.png');
	/*
	const [authState, updateAuthState] = React.useState([{
		name: '',
		profile: 'images/blank.png',
	}]);
	*/
	// FIXME once a user logs in, store their name, joined date, list of channels and friends, and profile pic
	const hist = Router.useHistory();
	const loc = Router.useLocation();
	const AuthContext = React.createContext([]);
	//const data = [authState, updateAuthState];
	React.useEffect(() => {
		// try to retrieve prior session
		getSession();
	}, []);
	const getSession = async () => {
		const resp = await fetch("/getsession", {method: "GET"});
		// FIXME: ajax should return the user's profile picture, friends list, joined channels, and joined date
		const r = await resp.json();
		if (r["status"] === "failed") {
			// FIXME: couldn't reauth session, dont log user back in
			console.log("No session exists; please log in.");
		} else {
			// FIXME: log user into the ui
			console.log('Logging user back into their session');
			updateLoggedIn(true);
			updateUser(r["status"]);
		}
	}
	return (<div className="app-wrapper">
			<Header user={user} loggedIn={loggedIn}/>
			<Router.Switch>
				<Router.Route path="/" exact render={() => <LandingPage loggedIn={loggedIn}/>}/>
				<Router.Route path="/signup" render={() => <SignUp updateLoggedIn={updateLoggedIn} updateUser={updateUser}/>}/>
				<Router.Route path="/signin" render={() => <SignIn updateLoggedIn={updateLoggedIn} updateUser={updateUser}/>}/>
				<Router.Route path="/account" render={() => <Account user={user} updateUser={updateUser} updateLoggedIn={updateLoggedIn} profile={profile} updateProfile={updateProfile} loc={loc}/>}/>
				<Router.Route path="/channel" render={() => <ChannelPage user={user} loggedIn={loggedIn}/>}/>
				<Router.Route path="/chat">
					{loggedIn ? <Chat user={user}/> : <Router.Redirect to="/signin"/>}
				</Router.Route>
			</Router.Switch>
	</div>);
}

ReactDOM.render(<Router.HashRouter><App/></Router.HashRouter>, document.getElementById('root'));