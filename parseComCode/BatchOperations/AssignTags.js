//Note the application won't terminate until all readline interfaces are closed
var readline = require('readline');
var https = require('https');
var services = require('./BatchServices.js');

//readline is used to interact with the user
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

//This is basically all the footwork to getting the arguments parsed, nothing fancy
var programName = process.argv[1].replace(/\\/g, "/").split("/").pop();
exitWithUsage = function() {
    console.log('usage: node ' + programName + ' -i <attr> <regex> <tag> [-u <username>] [-p <password>]');
    console.log('       node ' + programName + ' -l <attr> <regex> <tag> [-u <username>] [-p <password>]');
    console.log('       node ' + programName + ' -f <attr> <regex> <tag> [-u <username>] [-p <password>]');
    process.exit(1);
}

if (process.argv.length < 6)
    exitWithUsage();

var mode = process.argv[2];
if (mode != "-i" && mode != "-l" && mode != "-f") {
    exitWithUsage();
}

var attribute, regex, tag, username, password;
for (var i=3; i<process.argv.length; i++) {
    var arg = process.argv[i];
    if (arg == "-u") {
        if (process.argv.length > i+1) {
            username = process.argv[i+1];
            i++;
        } else {
            exitWithUsage();
        }
    } else if (arg == "-p") {
        if (process.argv.length > i+1) {
            password = process.argv[i+1];
            i++;
        } else {
            exitWithUsage();
        }
    }else if (!attribute) {
        attribute = arg;
    }else if (!regex) {
        regex = arg;
    }else if (!tag) {
        tag = arg;
    }
}

if (!attribute || !regex || !tag) {
    exitWithUsage();
}

//Main flow of the script. Done using the Javascript Promise mechanism
//Functions are in the BatchServices.js file
//For this script, essential steps are:
/*
    Get necessary information from user
    Authenticate with Parse
    Fetch books matching the passed regex and attribute
    Optionally list the fetched data
    Batch update the fetched books with the tag
*/
services.getCredentials(rl, username, password).then(function (credentials) {
    return services.loginUser(credentials);
}).then(function () {
    return services.findBooks(attribute, regex);
}).then(function (books) {
    //No point if there is no data to modify
    if (books.length == 0) {
        return Promise.reject(new Error("No Books"));
    }

    //If not forcing the update, display the targeted section of data
    if (mode == "-l" || mode == "-i") {
        if (mode == "-i") {
            console.log();
            console.log("Will add the tag '" + tag + "' to the following books:");
        }
        console.log();
        books.forEach(function (book) {
            //Since assigning tags... going to display the common identifier (title) along with the tags list
            //The filtered attribute will also be shown (though not again)
            console.log("title: " + book.title);
            if (attribute != "title" && attribute != "tags" && book[attribute])
                console.log(attribute + ": " + book[attribute]);
            console.log("tags: " + book.tags);
            console.log() //A little helpful spacing to group book info
        });
    }

    //Interactive mode checks if the user wants to follow through
    //Forcing immediately proceeds
    //Listing continues, but without any data to change
    if (mode == "-i") {
        return new Promise(function (resolve, reject) {
            rl.question("Proceed with adding the tag " + tag + "? ", (answer) => {
                if (answer == "yes") {
                    resolve(books);
                } else {
                    reject(new Error("Aborted"));
                }
            });
        });
    } else if (mode == "-f") {
        return Promise.resolve(books);
    } else if (mode == "-l") {
        return Promise.resolve();
    }
}).then(function (books) {
    if (mode == "-l") {
        //No changes to make, not going to send the batch request
        //Resolving an empty array of changes
        return Promise.resolve([]);
    } else {
        return services.assignTagToBooks(books, tag);
    }
}).then(function (batches) {
    var count = 0;
    batches.forEach(function (batch) {
        count += batch.length;
        //Only updated fields are returned (for books, those fields are: search, tags, updatedAt)
        //Could potentially refetch the objects though for an after picture
        //batch.forEach(function(response) {
        //    var updates = response.success;
        //});
    });
    if (mode != "-l") {
        console.log();
        console.log("Successfully added the tag '" + tag + "' to " + count + " books");
    }
    rl.close();
}).catch(function (error) {
    //Not as useful for debugging... but this is how we notify the user when finishing in an abnormal way
    console.log(error.message);
    //For debugging use this to get the full info and stack trace
    //console.error(error);
    rl.close();
});
