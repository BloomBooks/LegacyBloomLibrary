var op = require('./BatchOperation.js');

//Not entirely sure if this is good practice. This is simple though.
//Overriding some properties and methods from the BatchOperation class

//Only responsible for updating usage, giving the correct class name from parse, 
//attributes on the parse object for previewing regex query, and the updates for the batched parse objects

op.usageAddendum = '<tag>';
op.classBeingBatchUpdated = 'books';
op.classAttributesToPreview = ['title', 'tags'];

op.verifyRemainingArguments = function(args) {
    if (args.length < 1) {
        return false;
    } else {
        return true;
    }
};

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
