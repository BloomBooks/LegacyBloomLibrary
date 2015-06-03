The main.js file here contains the current parse.com cloud code used by the Bloom library.
As of first submission (11/24/14), the same code is in both the sandbox (deploy 36, on 9 July 2014) and the live site (deploy 10, same date).

To deploy a new version:
See https://parse.com/docs/cloud_code_guide for more.
You can download the Parse command line tool for Windows at https://parse.com/downloads/windows/console/parse.zip.
Get the file and unzip it. I moved the output to I:\ParseComTools.
Initialize it for working on a particular Parse.com, using the command
ParseComTools\parse new

This asks for an email, which is parse@bloomlibrary.org, and a password, which you will need to know!
After you enter the right password, it asks which app you want to make cloud code for. Pick an appropriate number from the list.
This creates a folder under whatever was the current directory when you did it...for example mine is at the root of I:.

The important file (apart from some keys you should protect) is parse/cloud/main.js.
Replace that file with the version checked in here.
Edit it however you need to.

The CLI produces a file parse/config/global.json. This file appears to be incompatible with the deploy function.
You will need to edit the JSON file such that the "results" object only has one layer of properties
which correspond to the parse.com project in question: appName, applicationId, masterKey.
Part of global.json the CLI generates looks something like:
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
but should be changed to
    "results": {
      "appName": <appName>,
      "applicationId": <appID>,
      "masterKey": <masterKey>
    }

Run 'parse deploy' to make the current version live on parse.com.
N.B. The 'deploy' part of this code requires that the current directory be the new 'parse' folder created.

Running parse new only needs to be done once for each parse.com app on each developer computer.

Remember to copy any changes back to here and check them in.
Remember to deploy your changes to the live site after you get them working in the sandbox.