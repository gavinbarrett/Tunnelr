import * as React from 'react';
import { Footer } from './Footer';
import { useLocation } from 'react-router-dom';
import './sass/ChannelPage.scss';

export const ChannelPage = ({user, loggedIn}) => {
    const [name, updateName] = React.useState('');
    const [access, updateAccess] = React.useState('');
    const [mode, updateMode] = React.useState('');
    const [doc, updateDoc] = React.useState('');
    const [created, updateCreated] = React.useState('');
    const [userCount, updateUserCount] = React.useState(null);
    const loc = useLocation();
    React.useEffect(() => {
        console.log('Loaded channel page.');
        const channelName = loc.pathname.split('/')[2];
        console.log(`Loading channel ${channelName}`);
        // load channel details
        getChannelInfo(channelName);
    }, []);
    const getChannelInfo = async channelName => {
        console.log('Getting info.');
        const resp = await fetch(`/loadchannelinfo/?channelname=${channelName}`, {method: 'GET'});
        const r = await resp.json();
        // format channel creation date
        let created_date = r["created_at"].split(" ");
        let date = created_date.splice(1, 4);
        updateDoc(date.join(' '));
        // update name and access controls
        updateName(r["name"]);
        updateAccess(r["access"]);
        updateMode(r["mode"]);
        console.log(r);
    }
    return (<><div id="channel-page">
            <div id="channel-header">{name}</div>
            <div id="channel-access">{`Access Control: ${access}`}{"/"}{mode}</div>
            <div id="doc">{`Created on ${doc}`}</div>
            <div id="join">
                <JoinButton/>
            </div>
        </div>
    <Footer/>
    </>);
}

const JoinButton = () => {
    return (<div id="joinbutton">
        {"Join"}
    </div>);
}