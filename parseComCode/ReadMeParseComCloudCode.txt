The main.js file here contains the current parse.com cloud code used by the Bloom library.
As of first submission (11/24/14), the same code is in both the sandbox (deploy 36, on 9 July 2014) and the live site (deploy 10, same date).

To deploy a new version:
See https://parse.com/docs/cloud_code_guide for more.
You can download the Parse command line tool for Windows at https://parse.com/downloads/cloud_code/cli/parse-windows/latest

Get the file and unzip it. I moved the output to I:\ParseComTools.
(It is possible the download link will only contain an executable file. In that event, change the filename to parse.exe.)
Initialize it for working on a particular Parse.com, using the command
ParseComTools\parse new <your_app_directory>
If <your_app_directory> is not provided, it will default to 'parse'

This asks for an email, which is parse@bloomlibrary.org, and a password, which you will need to know!
Alternatively, you can use your own account if you have one. (If you sign in using your Google account, you'll need to add a password on parse.com.)
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
