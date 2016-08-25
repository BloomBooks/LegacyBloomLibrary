Batch Operations on the data stored in Parse

***

## Warning

Batch operations can be dangerous, resulting in data being completely removed from the database.
Ensure a backup of the database is performed before operating on it.

## Backing up the database

John Hatton should fill this in.

## Operations

All operations will take the form:

```sh
node <operation_file.js> [-u username] [-p password] [-e env] (-i | -l | -f) <attr> <regex> <additional_args>
```

#### Arguments

Credentials are necessary to modify the database, if rejected, check ACL and CLP for the object

The default environment is 'test'. Other valid environments are 'sandbox' and 'prod'.

Objects are matched based on the supplied attribute and regex

Additional arguments depend on the operation

#### Modes

There are three modes for running the batch operation. 

Interactive (-i), objects will be previewed, require approval before execution.

List (-l), only preview the objects, don't execute the operation.

Force Execution (-f), no preview, executes the operation.

## Creating a new operation

* Create a new .js file for the operation
* Require BatchOperation.js
* Set the properties usageAddendum, classBeingBatchUpdated and classAttributesToPreview on BatchOperation
* Set the methods verifyRemainingArguments and updateBodyForObject on BatchOperation
* If necessary, perform pre-batch operations by setting prepareForOperation on BatchOperation
* After everything is set, call 'batchOperationWithArgs(process.argv)' on the BatchOperation.

AssignTags.js can be used as an example.

Note that BatchOperation currently only performs update operations, not create or delete.

See http://parseplatform.github.io/docs/rest/guide/#batch-operations for body format.
