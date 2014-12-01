The main.js file here contains the current parse.com cloud code used by the Bloom library.
As of first submission (11/24/14), the same code is in both the sandbox (deploy 36, on 9 July 2014) and the live site (deploy 10, same date).

To deploy a new version:
See https://parse.com/docs/cloud_code_guide for more.
From a link there you can download the Parse command line tool for Windows.
Get the file and unzip it. I moved the output to I:\ParseComTools.
Initialize it for working on a particular Parse.com, using the command
ParseComTools\parse new

This asks for an email, which is parse@bloomlibrary.org, and a password, which you will need to know!
After you enter the right password, it asks which app you want to make cloud code for. Pick an appropriate number from the list.
This creates a folder under whatever was the current directory when you did it...for example mine is at the root of I:.
The important file (apart from some keys you should protect) is parse/cloud/main.js.
Replace that file with the version checked in here.
Edit it however you need to.
Run 'parse deploy' to make the current version live on parse.com.

Running parse new only needs to be done once for each parse.com app on each developer computer.

Remember to copy any changes back to here and check them in.
Remember to deploy your changes to the live site after you get them working in the sandbox.