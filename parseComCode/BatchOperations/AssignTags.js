var op = require('./BatchOperation.js');

op.usageAddendum = '<tag>';
op.classBeingBatchUpdated = 'books';
op.classAttributesToPreview = ['title', 'tags'];

//Not entirely sure if this is good practice. This is simple though.
//Overriding updateObjects from the BatchOperation class

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
