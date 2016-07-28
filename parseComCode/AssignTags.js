//Note the application won't terminate until all readline interfaces are closed
var readline = require('readline');
var https = require('https');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

if (process.argv.length < 5) {
    console.error('Expected attribute regex tag');
    // attribute regex tagToAssign');
    process.exit(1);
}

var attribute = process.argv[2];
var regex = process.argv[3];
var tag = process.argv[4];

var hostname = "api.parse.com";
var headers = {
    //test api strings
    'X-Parse-Application-Id': 'llt7pS0BDnuPvz7Laci2NY04jWWrzmDhlLapQVxv',
    'X-Parse-REST-API-Key': 'ZklnIdWBqDUwZo9dR3tp7EAFWOEOU4O5rdv9NLfj',
    //silbloomlibrarysandbox api strings
    //'X-Parse-Application-Id': 'yrXftBF6mbAuVu3fO6LnhCJiHxZPIdE7gl1DUVGR',
    //'X-Parse-REST-API-Key': 'KZA7c0gAuwTD6kZHyO5iZm0t48RplaU7o3SHLKnj',        
    // we're live! Use the real silbloomlibrary api strings.
    //'X-Parse-Application-Id': 'R6qNTeumQXjJCMutAJYAwPtip1qBulkFyLefkCE5',
    //'X-Parse-REST-API-Key': 'P6dtPT5Hg8PmBCOxhyN9SPmaJ8W4DcckyW0EZkIx',
    'Content-Type': 'application/json'
};

loginUser = function () {
    return new Promise(function (resolve, reject) {
        console.log("To update object(s) requires a logged in user with moderator or creator permissions.");
        console.log();
        rl.question("Username: ", function (username) {
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
                        process.stdout.write("\033[2K\033[200D" + query);
                        break;
                }
            }
            process.stdin.on("data", concealHandler);

            rl.question(query, function (password) {
                process.stdin.removeListener('data', concealHandler);
                var options = {
                    host: hostname,
                    path: "/1/login?username=" + username + "&password=" + password,
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
        });
    });
}

findBooks = function (attribute, regex) {
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
}

assignTagToBooks = function (books, tag) {

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

loginUser().then(function () {
    return findBooks(attribute, regex);
}).then(function (books) {
    if (books.length == 0) {
        return Promise.reject(new Error("No Books"));
    }

    console.log();
    books.forEach(function (book) {
        console.log("title: " + book.title);
        if (attribute != "title" && attribute != "tags" && book[attribute])
            console.log(attribute + ": " + book[attribute]);
        console.log("tags: " + book.tags);
        console.log() //A little helpful spacing to group book info
    });

    return new Promise(function (resolve, reject) {
        rl.question("Proceed with adding the tag " + tag + "? ", (answer) => {
            if (answer == "yes") {
                resolve(books);
            } else {
                reject(new Error("Aborted"));
            }
        });
    });
}).then(function (books) {
    return assignTagToBooks(books, tag);
}).then(function (batches) {
    //batches.forEach(function(batch) {
        //batch.forEach(function(response) {
            //var updates = response.success;
            //Only updated fields are returned (search, tags, updatedAt)
        //});
    //});
    console.log("Success");
    rl.close();
}).catch(function (error) {
    console.log("Error: " + error.message);
    rl.close();
});
