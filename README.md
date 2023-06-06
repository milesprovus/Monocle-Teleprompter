A teleprompter application for the Monocle by Brilliant Labs

Uses the Google Slides API to gather speakers notes from a presentation, then displays the slides on the monocle.


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
9. Enter Client ID into top of _auth.js_

## Create API Key ##
1. In the Google Cloud console, go to Menu > APIs & Services > Credentials
2. Create credentials > API Key
3. Copy API Key & Paste into top of _auth.js_
