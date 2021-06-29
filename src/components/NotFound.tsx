import * as React from 'react';
import { Footer } from './Footer';
import './sass/NotFound.scss';

export const NotFound = () => {
    return (<><div id="notfound">
        {"404: Page not found"}
    </div>
    <Footer/></>);
}