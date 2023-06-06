const CLIENT_ID = '799933401682-pfkgrgs9re98s7ch30tc6t0eqiht5n0v.apps.googleusercontent.com';
const API_KEY = 'AIzaSyB-X-ejFcyTCbqJVdtPtl8G4JQJNPv3rNw';

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://slides.googleapis.com/$discovery/rest?version=v1';

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/presentations.readonly';
let tokenClient;
let gapiInited = false;
let gisInited = false;

document.getElementById('authorize_button').style.visibility = 'hidden';
document.getElementById('signout_button').style.visibility = 'hidden';
document.getElementById('load_button').style.visibility = 'hidden';
document.getElementById('input').style.visibility = 'hidden';
document.getElementById('slide_title').style.visibility = 'hidden';
document.getElementById('send').style.visibility = 'hidden';
document.getElementById('connectBtn').style.visibility = 'hidden';
/**
 * Callback after api.js is loaded.
 */
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    maybeEnableButtons();
}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
    });
    gisInited = true;
    maybeEnableButtons();
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('authorize_button').style.visibility = 'visible';
    }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        document.getElementById('signout_button').style.visibility = 'visible';
        document.getElementById('authorize_button').innerText = 'Refresh';
        document.getElementById('load_button').style.visibility = 'visible';
        document.getElementById('input').style.visibility = 'visible';
        document.getElementById('slide_title').style.visibility = 'visible';
        document.getElementById('send').style.visibility = 'hidden';
        textInput = document.getElementById('input');
        textInput.onkeypress = getTitle();
        await getTitle();
    };

    if (gapi.client.getToken() === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        // Skip display of account chooser and consent dialog for an existing session.
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        document.getElementById('content').innerText = '';
        document.getElementById('authorize_button').innerText = 'Authorize';
        document.getElementById('signout_button').style.visibility = 'hidden';
        document.getElementById('load_button').style.visibility = 'hidden';
        document.getElementById('upload_button').style.visibility = 'hidden';
        document.getElementById('jsonContent').innerText = "";
        document.getElementById('slide_title').innerText = "Ender a valid google slides URL:"
        
    }
}