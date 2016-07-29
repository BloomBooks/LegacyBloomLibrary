var https = require('https');

var hostname = "api.parse.com";
var headers = { };

module.exports = {
    //Pass in a readline object, and optionally a username and password
    //Returns an object with a username and a password property, using the passed in values if available
    getCredentials: function (rl, username, password) {
        return new Promise(function(resolve, reject) {
            if (username) {
                resolve(username);
       	    } else {
                console.log("To update object(s) requires a logged in user that has permissions to modify the object. If in doubt, check the ACL and CLP.");
                rl.question("Username: ", function (answer) {
                    resolve(answer);
                });
            }
        }).then(function(name) {
            return new Promise(function(resolve, reject) {
                if (password) {
                    resolve({"username": name, "password": password});
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
                        resolve({"username": name, "password": passwd});
                    });
                }
       	    });
        });
    },

    //Pass in the value obtained from getCredentials and the BloomLibrary environment to login to (test, sandbox, prod)
    //Will authenticate all future requests as the logged in user
    loginUser: function (creds, environment) {
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
    },

    //Fetches books matching the regex on <attribute> from Parse
    findBooks: function (attribute, regex) {
        return new Promise(function (resolve, reject) {
            var params = {};
            params[attribute] = { "$regex": regex };
            var options = {
                host: hostname,
                path: "/1/classes/books?where=" + encodeURIComponent(JSON.stringify(params)),
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
    },

    //Sends updates to the Parse service backend
    assignTagToBooks: function (books, tag) {
        //Slightly fancy here, batching update requests to the parse service.
        //They support up to fifty requests in a  batch, so splitting up by fifties
        var promises = [];
        for (var i = 0; i < books.length; i += 50) {
            promises.push(new Promise(function (resolve, reject) {
                var requests = [];
                for (var j = i; j < i + 50 && j < books.length; j++) {
                    requests.push({
                        "method": "PUT",
                        "path": "/1/classes/books/" + books[j].objectId,
                        "body": {
                            "tags": {
                                "__op": "AddUnique",
                                "objects": [tag]
                            }
                        }
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
    }
};
