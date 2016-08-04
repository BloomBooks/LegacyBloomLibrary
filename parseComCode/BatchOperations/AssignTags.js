var op = require('./BatchOperation.js');
//https is only required so we can make requests in prepareForOperation
var https = require('https');

//Not entirely sure if this is good practice. This is simple though.
//Overriding some properties and methods from the BatchOperation class

//Only responsible for updating usage, giving the correct class name from parse, 
//attributes on the parse object for previewing regex query, and the updates for the batched parse objects

op.usageAddendum = '<tag>';
op.classBeingBatchUpdated = 'books';
op.classAttributesToPreview = ['title', 'tags'];

//The only argument we require is tag
op.verifyRemainingArguments = function (args) {
    if (args.length < 1) {
        return false;
    } else {
        return true;
    }
};

//AssignTags can be used to assign a new bookshelf. Specifically in the case of a new bookshelf.
//The afterSave hook in cloud code creates a new bookshelf for each book... timing issues.
//So just create one now. Note we are returning a promise, so the batch operation doesn't proceed until we finish.
op.prepareForOperation = function (args) {
    const bookshelfPrefix = "bookshelf:";
    var tag = args[0];

    if (tag.indexOf(bookshelfPrefix) == -1) {
        //Not assigning a bookshelf!
        return Promise.resolve();
    } else {
        var bookshelfKey = tag.substr(bookshelfPrefix.length);
        return new Promise(function (resolve, reject) {
            var params = { "key": bookshelfKey };

            var options = {
                host: op.host,
                path: "/1/classes/bookshelf?where=" + encodeURIComponent(JSON.stringify(params)),
                headers: op.headers
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
        }).then(function (bookshelves) {
            if (bookshelves.length > 0) {
                //The bookshelf isn't new
                return Promise.resolve();
            } else {
                return new Promise(function (resolve, reject) {
                    var bookshelf = { "key": bookshelfKey, "englishName": bookshelfKey, "normallyVisible": false };
                    var data = JSON.stringify(bookshelf);
                    var options = {
                        host: op.host,
                        path: "/1/classes/bookshelf",
                        headers: op.headers,
                        method: "POST"
                    };

                    https.request(options, (response) => {
                        var body = '';
                        response.on('data', function (chunk) {
                            body += chunk;
                        });
                        response.on('end', function () {
                            //Done adding the bookshelf
                            resolve();
                        });
                    }).on('error', (error) => {
                        reject(error);
                    }).end(data);
                });
            }
        });
    }
};

//We don't really want multiple of the same tag, so only add uniquely
//Set the updateSource flag to let the cloud code beforeSave hook know that this is an update, not a create
op.updateBodyForObject = function (object, args) {
    var tag = args[0];
    return {
        "tags": {
            "__op": "AddUnique",
            "objects": [tag]
        },
        "updateSource": "true"
    };
};

//Trigger the batch operation
op.batchOperationWithArgs(process.argv);
