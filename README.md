A teleprompter application for the Monocle by Brilliant Labs

Gathers speakers notes from a Google Slides presentation using the Google Slides API. Any text found in speakers notes of presentation will be displayed on the Monocle.

# Setup: #

## Setup Credentials ##
1. Ensure Node & NPM are installed
2. Create a new Google Cloud Project at https://cloud.google.com/
3. In the Google Cloud console, go to Menu menu > APIs & Services > Credentials
4. Click Create Credentials > OAuth client ID
5. Click Application type > Web application
6. In the Name field, enter a name for the credential (doesn't matter)
7. Add authorized URIs related to your app:
    1. Client-Side App- Under Authorized JavaScript origins, click Add URI & enter http://localhost:3000
    2. Server-Side App Under Authorized redirect URIs, click Add URI & enter http://localhost:3000/
8. Click Create
9. Enter Client ID into top of `auth.js`

## Create API Key ##
1. In the Google Cloud console, go to Menu > APIs & Services > Credentials
2. Create credentials > API Key
3. Copy API Key & Paste into top of `auth.js`

## Setup Enviornment ##
1. Run `npm install` to install Deps.
2. upload `main.py` to root of monocle using [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=brilliantlabs.brilliant-ar-studio)

## Run Webpage ##
Run `node server` to start webpage at http://localhost:3000

## Details ##
* Number of current slide displayed in top right of display
* Left/Right touch pads of Monocle allow for navigation between slides

## Notes ##
* Works best if each line of notes is < 25 characters
* Invalid speakers notes will likely be skipped during display
* Currently doesn't control slideshow, just notes displayed on monocle
