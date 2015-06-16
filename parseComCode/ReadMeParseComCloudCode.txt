The main.js file here contains the current parse.com cloud code used by the Bloom library.
As of first submission (11/24/14), the same code is in both the sandbox (deploy 36, on 9 July 2014) and the live site (deploy 10, same date).

To deploy a new version:
See https://parse.com/docs/cloud_code_guide for more.
You can download the Parse command line tool for Windows at https://parse.com/downloads/cloud_code/cli/parse-windows/latest
N.B. The current version of the Parse CLI (2.0.9) is unstable. If the Parse CLI is not updated, see 06/03/15 notes below.

Get the file and unzip it. I moved the output to I:\ParseComTools.
(It is possible the download link will only contain an executable file. In that event, change the filename to parse.exe.)
Initialize it for working on a particular Parse.com, using the command
ParseComTools\parse new <your_app_directory>
If <your_app_directory> is not provided, it will default to 'parse'

This asks for an email, which is parse@bloomlibrary.org, and a password, which you will need to know!
After you enter the right password, it asks which app you want to make cloud code for. Pick an appropriate number from the list.
This creates a folder (<your_app_directory>) under whatever was the current directory when you did it...for example mine is at the root of I:.

The important file (apart from some keys you should protect) is your_app_directory/cloud/main.js.
Replace that file with the version checked in here.
Edit it however you need to.

Change the current directory to the newly created your_app_directory folder.
Run 'parse deploy' (or '../parse.exe deploy' or similar if parse is not in your path or you are not running the ParseConsole provided in the zip)
to make the current version live on parse.com.

Running 'parse new' only needs to be done once for each parse.com app on each developer computer.
Subsequent calls may be made to parse deploy without re-authentication.

Remember to copy any changes back to here and check them in.
Remember to deploy your changes to the live site after you get them working in the sandbox.

06/03/15 Usage Notes
There appears to be a major issue with Parse CLI 2.0.9, which is currently the "latest" version on parse.com.
The discussion at the following page confirms the issue is not local:
https://groups.google.com/forum/#!searchin/parse-developers/parse%2420windows%2420cli%24202.0.9/parse-developers/WoRnDft4qmE/kkJeCkYhdAAJ
Hopefully these issues are resolved, but in the event they are not follow the steps I took below.

1) Download an older, but stable, version of Parse CLI: https://parse.com/downloads/windows/console/parse.zip.
2) Unzip, and run ParseConsole.exe (making the parse command available in any directory).
3) Call 'parse new', enter email and password, and enter '1'.
    (N.B. only the first listed project in Parse is available for download, but any set of keys may be used for upload.)
4) As a result of 'parse new', a folder called 'parse' will be created.
5) Replace parse\cloud\main.js with current version of main.js
6) Manually change the "results" part of parse\config\global.json from
    "results": {
      "applicationId": {
          "appName": <appName>,
          "applicationId": <appID>,
          "masterKey": <masterKey>
      },
      "masterKey": {
          "appName": <appName>,
          "applicationId": <appID>,
          "masterKey": <masterKey>
      }
    }
to
    "results": {
      "appName": <appName>,
      "applicationId": <appID>,
      "masterKey": <masterKey>
    }
This change is necessary due to an internal change to parse.com with outdated interface.
7) Change current directory to parse.
8) Call 'parse deploy'. Server code should now be updated.