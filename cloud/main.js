
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
  var query = new Parse.Query("bookshelf");
  query.equalTo("name", "Featured");
  query.find({
    success: function(shelves) {
		var featuredShelf = shelves[0];
		var contentQuery = featuredShelf.relation("books").query();
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
