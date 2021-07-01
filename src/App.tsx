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
import { NotFound } from './components/NotFound';
import { UserAuth } from './UserAuth';
import './components/sass/App.scss';

const App = () => {
	const [user, updateUser] = React.useState('');
	const [loggedIn, updateLoggedIn] = React.useState(false);
	const [profile, updateProfile] = React.useState('images/blank.png');
	//const dataLog = React.useReducer();
	// FIXME once a user logs in, store their name, joined date, list of channels and friends, and profile pic
	const loc = Router.useLocation();
	React.useEffect(() => {
		// try to retrieve prior session
		getSession();
		const sessionData = window.sessionStorage.getItem("data");
		if (sessionData) {
			console.log(`Retrieved session data: ${sessionData}`);
			const { user, loggedin } = JSON.parse(sessionData);
			console.log(`Updating user to ${user}`);
			//updateUser(user);
			//updateLoggedIn(true);
			console.log(`Session store contained: ${user}\n${loggedin}`);
		} 
		/*
		else {
			console.log(`Setting session data`);
			getSession();
		}*/
	}, []);
	const getSession = async () => {
		const resp = await fetch("/getsession", {method: "GET"});
		// FIXME: ajax should return the user's profile picture, friends list, joined channels, and joined date
		const r = await resp.json();
		console.log(r);
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
		<UserAuth.Provider value={{user, updateUser, loggedIn, updateLoggedIn, profile, updateProfile, loc}}>
			<Header user={user} loggedIn={loggedIn}/>
			<Router.Switch>
				<Router.Route path="/" exact render={() => <LandingPage/>}/>
				<Router.Route path="/signup" render={() => <SignUp/>}/>
				<Router.Route path="/signin" render={() => <SignIn/>}/>
				<Router.Route path="/account" render={() => <Account/>}/>
				<Router.Route path="/channel" render={() => <ChannelPage/>}/>
				<Router.Route path="/chat">
					{loggedIn ? <Chat user={user}/> : <Router.Redirect to="/signin"/>}
				</Router.Route>
				<Router.Route path="/notfound" render={() => <NotFound/>}/>
				<Router.Route path="/*">
					<Router.Redirect to="/notfound"/>
				</Router.Route>
			</Router.Switch>
		</UserAuth.Provider>
	</div>);
}

ReactDOM.render(<Router.HashRouter><App/></Router.HashRouter>, document.getElementById('root'));