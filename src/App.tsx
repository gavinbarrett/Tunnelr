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

const App = () => {
	const [user, updateUser] = React.useState('');
	const [loggedIn, updateLoggedIn] = React.useState(false);
	const hist = Router.useHistory();
	React.useEffect(() => {
		// try to retrieve prior session
		getSession();
	}, []);
	const getSession = async () => {
		const resp = await fetch("/getsession", {method: "GET"});
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
			<Router.Route path="/account" render={() => <Account user={user} updateUser={updateUser} updateLoggedIn={updateLoggedIn}/>}/>
			<Router.Route path="/channel" render={() => <ChannelPage user={user} loggedIn={loggedIn}/>}/>
			<Router.Route path="/chat">
				{loggedIn ? <Chat user={user}/> : <Router.Redirect to="/signin"/>}
			</Router.Route>
		</Router.Switch>
	</div>);
}

ReactDOM.render(<Router.HashRouter><App/></Router.HashRouter>, document.getElementById('root'));
