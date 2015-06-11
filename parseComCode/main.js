
// This job updates all current records 'search' field.
// Enhance: pull out common code in this and beforeSave("book").
Parse.Cloud.job("populateSearch", function(request, status) {
  // Set up to modify user data
  Parse.Cloud.useMasterKey();
  var counter = 0;
  // Query for all books
  var query = new Parse.Query('books');
  query.each(function(book) {
	  var tags = book.get("tags");
	  var search = book.get("title").toLowerCase();
	  var index;
	  for (index = 0; index < tags.length; ++index) {
		search = search + " " + tags[index].toLowerCase();
	  }
      book.set("search", search);
      if (counter % 100 === 0) {
        // Set the  job's progress status
        status.message(counter + " books processed.");
      }
      counter += 1;
      return book.save();
  }).then(function() {
    // Set the job's success status
    status.success("Update completed successfully.");
  }, function(error) {
    // Set the job's error status
    status.error("Uh oh, something went wrong.");
  });
});

// Makes new and updated books have the right search string and ACL.
Parse.Cloud.beforeSave("books", function(request, response) {
	var book = request.object;
	var tags = book.get("tags");
	var search = book.get("title").toLowerCase();
	var index;
	if (tags) {
		for (index = 0; index < tags.length; ++index) {
			search = search + " " + tags[index].toLowerCase();
		}
	}
    request.object.set("search", search);
	
	var creator = request.user;
	
	if (creator && request.object.isNew()) { // created normally, someone is logged in and we know who, restrict access
		var newACL = new Parse.ACL();
		// According to https://parse.com/questions/beforesave-user-set-permissions-for-self-and-administrators,
		// a user can always write their own object, so we don't need to permit that.
		newACL.setPublicReadAccess(true);
		newACL.setRoleWriteAccess("moderator", true); // allows moderators to delete
		newACL.setWriteAccess(creator, true);
		request.object.setACL(newACL);
	}
	response.success();
});

// Return the books that should be shown in the default browse view.
// Currently this is those in the Featured bookshelf, followed by all the others.
// Each group is sorted alphabetically by title.
Parse.Cloud.define("defaultBooks", function(request, response) {
  var first = request.params.first;
  var count = request.params.count;
  var includeOutOfCirculation = request.params.includeOutOfCirculation;
  var query = new Parse.Query("bookshelf");
  query.equalTo("name", "Featured");
  query.find({
    success: function(shelves) {
		var featuredShelf = shelves[0];
		var contentQuery = featuredShelf.relation("books").query();
        var shelfName = featuredShelf.get("name");
        if (!includeOutOfCirculation)
            contentQuery.containedIn('inCirculation', [true, undefined]);
		contentQuery.include("langPointers");
        contentQuery.ascending("title");
        contentQuery.limit(1000); // max allowed...hoping no more than 1000 books in shelf??
		contentQuery.find({
			success: function(shelfBooks) {
                var results = [];
                var shelfIds = Object.create(null); // create an object with no properties to be a set
                var resultIndex = 0;
                for (var i = 0; i < shelfBooks.length; i++) {
                    if (resultIndex >= first && resultIndex < first + count) {
                        shelfBooks[i].attributes.bookshelf = shelfName;
                        results.push(shelfBooks[i]);
                    }
                    resultIndex++;
                    shelfIds[shelfBooks[i].id] = true; // put in set
                }
                var skip = 0;
                // This function implements a query loop by calling itself inside each
                // promise fulfilment if more results are needed.
                var runQuery = function() {
                    var allBooksQuery = new Parse.Query("books");
                    if (!includeOutOfCirculation)
                        allBooksQuery.containedIn('inCirculation', [true, undefined]);
					allBooksQuery.include("langPointers");
                    allBooksQuery.ascending("title");
                    allBooksQuery.skip(skip); // skip the ones we already got
                    allBooksQuery.find({
                        success: function (allBooks) {
                            skip += allBooks.length; // skip these ones next iteration
                            for (var i = 0; i < allBooks.length && resultIndex < first + count; i++) {
                                if (!(allBooks[i].id in shelfIds)) {
                                    if (resultIndex >= first) {
                                        results.push(allBooks[i]);
                                    }
                                    resultIndex++;
                                }
                            }
                            if (allBooks.length == 0 || resultIndex >= first + count) {
                                // either we can't get any more, or we got all we need.
                                response.success(results);
                                return;
                            }
                            runQuery(); // launch another iteration.
                        },
                        error: function () {
                            response.error("failed to find all books");
                        }
                    });
                }
                runQuery(); // start the recursive loop.
			},
			error: function() {
			  response.error("failed to find books of featured shelf");
			}
		})
    },
    error: function() {
      response.error("failed to find featured shelf");
    }
  });
});


// This function is used to set up the fields used in the bloom library.
// Adding something here should be the ONLY way fields and classes are added to parse.com.
// After adding one, it is recommended that you first deploy the modified cloud code (see ReadMeParseComCloudCode.txt)
// to our 'test' project, run it, and verify that the result are as expected.
// Then try on the bloomlibrarysandbox (where you should also develop and test the
// functionality that uses the new fields).
// Finally deploy and run on the live database.
// Currently this will not delete fields or tables; if you want to do that it will have to be
// by hand.
// Run this function from a command line like this (with the appropriate keys for the application inserted)
// curl -X POST -H "X-Parse-Application-Id: <insert ID>"  -H "X-Parse-REST-API-Key: <insert REST key>" https://api.parse.com/1/functions/setupTables
// Note: if you are debugging future versions of this and get an error like this:
// {"code":141,"error":"{\"administrator\":false,\"username\":\"xxyyzzAVeryUnlikelyDummyName\",\"password\":\"Unguessable\"}"}
// Probably an earlier run created but did not delete the fake user that we use as target for Pointer<_User> fields.
// Just delete that user by hand in the parse.com data browser.
Parse.Cloud.define("setupTables", function(request, response) {
    // Required BloomLibrary classes/fields
    // Note: code below currently requires that 'books' is first.
    // Current code supports only String, Boolean, Number, Array, Pointer<_User>, and Relation<books>.
    // It would be easy to generalize the pointer/relation code provided we can organize so that classes that are
    // the target of relations or pointers occur before the fields targeting them.
    // This is because the way we 'create' a field is to create an instance of the class that has that field.
    // These instances can also be conveniently used as targets when creating instances of classes
    // that refer to them.
    var classes = [
        {
            name: "books",
            fields: [
                {name: "allTitles", type:"String"},
                {name: "baseUrl", type:"String"},
                {name: "bookInstanceId", type:"String"},
                {name: "bookLineage", type:"String"},
                {name: "bookOrder", type:"String"},
                {name: "bookletMakingIsAppropriate", type:"Boolean"},
                {name: "copyright", type:"String"},
                {name: "credits", type:"String"},
                {name: "currentTool", type:"String"},
                {name: "downloadSource", type:"String"},
                {name: "experimental", type:"Boolean"},
                {name: "folio", type:"Boolean"},
                {name: "formatVersion", type:"String"},
                {name: "inCirculation", type: "Boolean"},
                {name: "isbn", type:"String"},
                {name: "langPointers", type:"Array"},
                {name: "languages", type:"Array"},
                {name: "librarianNote", type:"String"},
                {name: "license", type:"String"},
                {name: "licenseNotes", type:"String"},
                {name: "pageCount", type:"Number"},
                {name: "readerToolsAvailable", type:"Boolean"},
                {name: "search", type:"String"},
                {name: "suitableForMakingShells", type:"Boolean"},
                {name: "suitableForVernacularLibrary", type:"Boolean"},
                {name: "summary", type:"String"},
                {name: "tags", type:"Array"},
                {name: "thumbnail", type:"String"},
                {name: "title", type:"String"},
                {name: "tools", type:"Array"},
                {name: "uploader", type:"Pointer<_User>"}
            ]
        },
        {
            name: "bookshelf",
            fields: [
                {name: "name", type:"String"},
                {name: "books", type:"Relation<books>"},
                {name: "owner", type:"Pointer<_User>"}
            ]
        },
        {
            name: "language",
            fields: [
                {name: "ethnologueCode", type:"String"},
                {name: "isoCode", type:"String"},
                {name: "name", type:"String"},
                {name: "englishName", type:"String"}
            ]
        }
    ];

    var ic = 0;
    var aUser = null;
    // If we're updating a 'live' table, typically we will have locked it down so
    // only with the master key can we add fields or classes.
    Parse.Cloud.useMasterKey();

    var doOne = function() {
        var className = classes[ic].name;
        var parseClass = Parse.Object.extend(className);
        var instance = new parseClass();
        var val = null;
        var fields = classes[ic].fields;
        for (var ifld = 0; ifld < fields.length; ifld++) {
            var fieldName = fields[ifld].name;
            var fieldType = fields[ifld].type;
            switch (fieldType) {
                case "String":
                    instance.set(fieldName, "someString");
                    break;
                case "Boolean":
                    instance.set(fieldName, true);
                    break;
                case "Number":
                    instance.set(fieldName, 1);
                    break;
                case "Array":
                    instance.set(fieldName, ["one", "two"]);
                    break;
                case "Pointer<_User>":
                    instance.set(fieldName, aUser);
                    break;
                case "Relation<books>":
                    // This could be generalized if we have other kinds of relation one day.
                    var target = classes[0].parseObject;
                    var relation = instance.relation(fieldName);
                    relation.add(target);
                    break;
            }
        }
        instance.save(null, {
            success: function (newObj) {
                // remember the new object so we can destroy it later, or use it as a relation target.
                classes[ic].parseObject = newObj;
                ic++;
                if (ic < classes.length) {
                    doOne(); // recursive call to the main method to loop
                }
                else {
                    // Start a new recursive iteration to delete the objects we don't need.
                    ic = 0;
                    deleteOne();
                }
            },
            error: function (error) {
                response.error(error);
            }
        });
    };
    var deleteOne = function() {
        // Now we're done, the class and fields must exist; we don't actually want the instances
        var newObj = classes[ic].parseObject;
        newObj.destroy({success: function () {
            ic++;
            if (ic < classes.length) {
                deleteOne(); // recursive loop
            }
            else {
                cleanup();
            }
        },
            error: function (error) {
                response.error(error);
            }
        });
    };
    var cleanup = function() {
        // We've done the main job...now some details.
        var versionType = Parse.Object.extend("version");
        var query = new Parse.Query("version");
        query.find({
            success: function (results) {
                var version;
                if (results.length >= 1) {
                    // updating an existing project, already has version table and instance
                    version = results[0];
                }
                else {
                    version = new versionType();
                }
                version.set("minDesktopVersion", "2.0");
                version.save({
                    success: function () {
                        // Finally destroy the spurious user we made.
                        aUser.destroy({success: function () {
                            response.success("Tables created!");
                        },
                            error: function (error) {
                                response.error(error);
                            }
                        });
                    },
                    error: function (error) {
                        response.error(error);
                    }
                })
            },
            error: function (error) {
                response.error(error);
            }
        });
    };
    // Create a user.
    Parse.User.signUp("xxyyzzAVeryUnlikelyDummyName", "Unguessable", {administrator: false}, {
        success: function(newUser) {
            aUser = newUser;
            doOne(); // start the recursion.
        },
        error: function (error) {
            response.error(error);
        }
    });

});
