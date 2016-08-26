var https = require('https');
var readline = require('readline');

//Note the application won't terminate until all readline interfaces are closed
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var hostname = "api.parse.com";
var headers = {};
var mode, attribute, environment = "test", remainingArgs = [];

//Pass in a readline object, and optionally a username and password
//Returns an object with a username and a password property, using the passed in values if available
getCredentials = function (username, password) {
    return new Promise(function (resolve, reject) {
        if (username) {
            resolve(username);
        } else {
            console.log("To update object(s) requires a logged in user that has permissions to modify the object. If in doubt, check the ACL and CLP.");
            rl.question("Username: ", function (answer) {
                resolve(answer);
            });
        }
    }).then(function (name) {
        return new Promise(function (resolve, reject) {
            if (password) {
                resolve({ "username": name, "password": password });
            } else {
                //Conceal input for password
                var stdin = process.openStdin(), query = "Password: ";
                var concealHandler = function (char) {
                    char = char + "";
                    switch (char) {
                        case "\n":
                        case "\r":
                        case "\u0004":
                            break;
                        default:
                            //This is manually clearing the line of the password entry and writing the prompt again.
                            //Essentially disconnecting the visible input from what we are receiving.
                            //This is using ANSI escape codes. \033[ is the Control Sequence Introducer
                            //2K erases in line, the entire line, but doesn't move the cursor. 
                            //200D moves the cursor back n spaces, stopping at the edge of the screen
                            //Assumes prompts are less than 200 characters long
                            process.stdout.write("\033[2K\033[200D" + query);
                            break;
                    }
                }
                process.stdin.on("data", concealHandler);

                rl.question(query, function (passwd) {
                    process.stdin.removeListener('data', concealHandler);
                    resolve({ "username": name, "password": passwd });
                });
            }
        });
    });
};

//Pass in the value obtained from getCredentials and the BloomLibrary environment to login to (test, sandbox, prod)
//Will authenticate all future requests as the logged in user
loginUser = function (creds, environment) {
    if (environment == "test") {
        headers['X-Parse-Application-Id'] = 'llt7pS0BDnuPvz7Laci2NY04jWWrzmDhlLapQVxv';
        headers['X-Parse-REST-API-Key'] = 'ZklnIdWBqDUwZo9dR3tp7EAFWOEOU4O5rdv9NLfj';
    } else if (environment == "sandbox") {
        headers['X-Parse-Application-Id'] = 'yrXftBF6mbAuVu3fO6LnhCJiHxZPIdE7gl1DUVGR';
        headers['X-Parse-REST-API-Key'] = 'KZA7c0gAuwTD6kZHyO5iZm0t48RplaU7o3SHLKnj';
    } else if (environment == "prod") {
        headers['X-Parse-Application-Id'] = 'R6qNTeumQXjJCMutAJYAwPtip1qBulkFyLefkCE5';
        headers['X-Parse-REST-API-Key'] = 'P6dtPT5Hg8PmBCOxhyN9SPmaJ8W4DcckyW0EZkIx';
    }

    return new Promise(function (resolve, reject) {
        var options = {
            host: hostname,
            path: "/1/login?username=" + creds.username + "&password=" + creds.password,
            headers: headers
        };

        https.get(options, (response) => {
            var body = '';
            if (response.statusCode == 404) {
                reject(new Error("Invalid Login"));
            }
            response.on('data', function (chunk) {
                body += chunk;
            });
            response.on('end', function () {
                headers['X-Parse-Session-Token'] = JSON.parse(body).sessionToken;
                resolve();
            });
        }).on('error', (error) => {
            reject(error);
        }).end();
    });
};

//Sends updates to the Parse service backend
batchUpdate = function (objects, tag) {
    //Slightly fancy here, batching update requests to the parse service.
    //They support up to fifty requests in a  batch, so splitting up by fifties
    var promises = [];
    for (var i = 0; i < objects.length; i += 50) {
        promises.push(new Promise(function (resolve, reject) {
            var requests = [];
            for (var j = i; j < i + 50 && j < objects.length; j++) {
                requests.push({
                    "method": "PUT",
                    "path": "/1/classes/" + module.exports.classBeingBatchUpdated + "/" + objects[j].objectId,
                    "body": module.exports.updateBodyForObject(objects[j], remainingArgs)
                });
            }
            var data = JSON.stringify({ "requests": requests });
            var postHeaders = headers;
            postHeaders['Content-Type'] = 'application/json';
            var options = {
                host: hostname,
                method: "POST",
                path: "/1/batch",
                headers: postHeaders
            }

            https.request(options, (response) => {
                var body = '';
                response.on('data', function (chunk) {
                    body += chunk;
                });
                response.on('end', function () {
                    resolve(JSON.parse(body));
                });
            }).on('error', (error) => {
                console.error(error);
                reject(error);
            }).end(data);
        }));
    }
    return Promise.all(promises);
};

//Fetches objects matching the <regex> on <attribute> from Parse
findObjects = function (attr, regex) {
    return new Promise(function (resolve, reject) {
        var params = {};
        //TODO: this could be enhanced to handle regex options with this syntax: where={"name":{"$regex":"myregex","$options":"i"}}
        params[attr] = { "$regex": regex };
        var options = {
            host: hostname,
            path: "/1/classes/" + module.exports.classBeingBatchUpdated + "?limit=1000&where=" + encodeURIComponent(JSON.stringify(params)),
            headers: headers
        };

        https.get(options, (response) => {
            var body = '';
            response.on('data', function (chunk) {
                body += chunk;
            });
            response.on('end', function () {
                resolve(JSON.parse(body).results);
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
};

previewObjects = function (objects) {
    //If not forcing the update, display the targeted section of data
    if (mode == "-l" || mode == "-i") {
        if (mode == "-i") {
            console.log();
            console.log("Will batch update the following " + module.exports.classBeingBatchUpdated + ":");
        }
        console.log();
        objects.forEach(function (object) {
            //Show preview attributes, but also the filtered attribute (if not included)
            var attributes = module.exports.classAttributesToPreview;
            if (attributes.indexOf(attribute) == -1) {
                attributes.push(attribute);
            }
            attributes.forEach(function(attr) {
                console.log(attr + ": " + object[attr]);
            });
            console.log(); //A little helpful spacing to group object info
        });
        console.log("Total: " + objects.length);
        console.log();
    }
};

batchOperation = function (args) {
    //This is basically all the footwork to getting the arguments parsed, nothing fancy
    var programName = process.argv[1].replace(/\\/g, "/").split("/").pop();
    exitWithUsage = function () {
        console.log('usage: node ' + programName + ' [-u <username>] [-p <passwd>] [-e env] (-i | -l | -f) <attr> <regex> ' + module.exports.usageAddendum);
        process.exit(1);
    }

    if (process.argv.length < 6)
        exitWithUsage();

    var regex, username, password;
    for (var i = 2; i < process.argv.length; i++) {
        var arg = process.argv[i];
        if (arg == "-i" || arg == "-l" || arg == "-f") {
            mode = arg;
        } else if (arg == "-u") {
            if (process.argv.length > i + 1) {
                username = process.argv[i + 1];
                i++;
            } else {
                exitWithUsage();
            }
        } else if (arg == "-p") {
            if (process.argv.length > i + 1) {
                password = process.argv[i + 1];
                i++;
            } else {
                exitWithUsage();
            }
        } else if (arg == "-e") {
            if (process.argv.length > i + 1) {
                environment = process.argv[i + 1];
                i++;
            } else {
                exitWithUsage();
            }
        } else if (!attribute) {
            attribute = arg;
        } else if (!regex) {
            regex = arg;
        } else {
            remainingArgs.push(arg);
        }
    }

    if (!mode || !attribute || !regex || !(module.exports.verifyRemainingArguments(remainingArgs))) {
        exitWithUsage();
    }

    //Main flow of the script. Done using the Javascript Promise mechanism
    //For this script, essential steps are:
    /*
        Get necessary information from user
        Authenticate with Parse
        Fetch objects matching the passed regex and attribute
        Optionally list the fetched data
        Batch update the fetched objects
    */
    getCredentials(username, password).then(function (credentials) {
        return loginUser(credentials, environment);
    }).then(function () {
        return findObjects(attribute, regex);
    }).then(function (objects) {
        //No point if there is no data to modify
        if (objects.length == 0) {
            return Promise.reject(new Error("No Matches Found"));
        }

        previewObjects(objects);

        //Interactive mode checks if the user wants to follow through
        //Forcing immediately proceeds
        //Listing continues, but without any data to change
        if (mode == "-i") {
            return new Promise(function (resolve, reject) {
                rl.question("Proceed? ", (answer) => {
                    if (answer == "yes") {
                        resolve(objects);
                    } else {
                        reject(new Error("Aborted"));
                    }
                });
            });
        } else if (mode == "-f") {
            return Promise.resolve(objects);
        } else if (mode == "-l") {
            return Promise.resolve();
        }
    }).then(function (objects) {
        if (mode == "-l") {
            //No changes to make, not going to send the batch request
            //Resolving an empty array of changes
            return Promise.resolve([]);
        } else {
            return module.exports.prepareForOperation(remainingArgs).then(function (){
                return batchUpdate(objects, remainingArgs);
            });
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
            console.log("Successfully updated " + count + " objects");
        }
        rl.close();
    }).catch(function (error) {
        //Not as useful for debugging... but this is how we notify the user when finishing in an abnormal way
        console.log(error.message);
        //For debugging use this to get the full info and stack trace
        //console.error(error);
        rl.close();
    });
};


module.exports = {
    //These properties and functions should be replaced with the correct values for the desired operation
    usageAddendum: '',
    classBeingBatchUpdated: '',
    classAttributesToPreview: [],

    //Verify necessary arguments for the final operation (e.g. adding a tag)
    verifyRemainingArguments: function (args) {
        return true;
    },

    //If there are changes that should be made before performing a batch operation, do them here
    prepareForOperation: function(args) {
        return Promise.resolve();
    },

    //The remaining are passed to this function for use in updating the fetched objects
    updateBodyForObject: function (object, args) {

    },

    //Call to perform the operation, takes an argument list directly from process.argv
    batchOperationWithArgs: batchOperation,

    //Exposed for preparing for a batch operation
    host: hostname,
    headers: headers,
};
