import * as React from 'react';
import { Footer } from './Footer';
import { useLocation } from 'react-router-dom';
import './sass/ChannelPage.scss';

export const ChannelPage = ({user, loggedIn}) => {
    const [name, updateName] = React.useState('');
    const [access, updateAccess] = React.useState('');
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
        console.log(r);
    }
    return (<><div id="channel-page">
            <div id="channel-header">{"Channel Name"}</div>
            <div id="channel-access">{"Access Level"}</div>
            <div id="doc">{"DOC"}</div>
            <div id="join">{"Join"}</div>
        </div>
    <Footer/>
    </>);
}