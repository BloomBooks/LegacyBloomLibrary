angular.module('BloomLibraryApp.services', ['restangular'])
	.factory('authService', ['Restangular', function (restangular) {
		var isLoggedIn = false;
		var userNameX = 'unknown';
        var bookshelves = [];
		// These headers are the magic keys for our account at Parse.com
		// While someone is logged on, another header gets added (see setSession).
		// The first group are for the silbloomlibrarysandbox we use for development.
		// The second group are for silbloomlibrary used in production.
		// Comment out the ones you aren't using.
		// See also the keys below in the Parse.initialize call.
		headers = {
			'X-Parse-Application-Id': 'yrXftBF6mbAuVu3fO6LnhCJiHxZPIdE7gl1DUVGR',
			'X-Parse-REST-API-Key': 'KZA7c0gAuwTD6kZHyO5iZm0t48RplaU7o3SHLKnj'
		};
//		headers = {
//			'X-Parse-Application-Id': 'R6qNTeumQXjJCMutAJYAwPtip1qBulkFyLefkCE5',
//			'X-Parse-REST-API-Key': 'P6dtPT5Hg8PmBCOxhyN9SPmaJ8W4DcckyW0EZkIx'
//		};
		restangularConfig = function (restangularConfigurer) {
			restangularConfigurer.setBaseUrl('https://api.parse.com/1'); // 1/indicates rev 1 of parse.com API
			restangularConfigurer.setDefaultHeaders(headers);
		};

		factory = {

			userName: function () { return userNameX; },
			setUserName: function (newName) { userNameX = newName; },
            bookShelves: function() {return bookshelves;},

			isLoggedIn: function () { return isLoggedIn; },
			isUserAdministrator: function () { return isUserAdministrator; },

			config: function () { return restangularConfig; },

			setSession: function (sessionToken) {
				var sessionTokenKey = 'X-Parse-Session-Token';
				if (sessionToken) {
					headers[sessionTokenKey] = sessionToken;
					isLoggedIn = true;
				}
				else {
					delete headers[sessionTokenKey];
					isLoggedIn = false;
				}
			},

			login: function (username, password, successCallback, errorCallback) {
				// GET: .../login
				restangular.withConfig(restangularConfig).all('login').getList({ 'username': username, 'password': password })
					.then(function (result) {
						isLoggedIn = true;
						isUserAdministrator = result.administrator;
						userNameX = username;
                        var query = new Parse.Query('bookshelf');
                        query.equalTo('owner', result);
//                        query.find({
//                            success: function (results) {
//                                bookshelves = response.results;
//                            },
//                            error: function (aError) {
//                                alert(aError);
//                            }
//                        });
                        restangular.withConfig(restangularConfig).all('classes/bookshelf').getList({ 'where':{'owner': {"__type":"Pointer","className":"_User","objectId":result.objectId} }})
                            .then(function (response) {
                                bookshelves = response.results;
                            },
                        function(error) {
                            alert(error);
                        });
                        factory.setSession(result.sessionToken); // im not sure this actually works
						successCallback(result);
					},
				function (result) {
					isLoggedIn = false;
					userNameX = 'unknown';
					errorCallback(result);
				});
			},

			logout: function () {
				isLoggedIn = false;
				factory.setSession('');
			},

			// curl -X POST \
			//	-H "X-Parse-Application-Id: mqNCpJ1nB4a597asLF61OwYclJCOwfzgMNTMF6LL" \
			//  -H "X-Parse-REST-API-Key: QN9bdJ8JODDYxUSXqWZTaz2y8WcX3d5kMi6ha3TU" \
			//  -H "Content-Type: application/json" \
			//  -d '{"email":"coolguy@iloveapps.com"}' \
			//  https://api.parse.com/1/requestPasswordReset
			sendResetPassword: function(email)
			{
				// It took some experimentation to get restangular to make the post we wanted, with
				// fewer elements in the path than expected. There may be a simpler way, but this works.
				// Enhance: is there any need/possibility of detecting errors here?
				// For example, what if it's not a valid email address we know? Or if the network is down?
				return restangular.withConfig(restangularConfig).one("requestPasswordReset").post('', {"email":email});
			}
		};

		return factory;
	} ])

	.service('bookService', ['Restangular', 'authService', '$q', '$rootScope', function (restangular, authService, $q, $rootScope) {
		// Initialize Parse.com javascript query module for our project.
		// Note: we would prefer to do this query using the REST API, but it does not currently support substring matching.
		// Please keep using the REST API wherever possible and the javascript API only where necessary.
		// Enhance: it is probably possible to implement server-side functions and access them using REST instead of
		// using the parse.com javascript API. We are limiting use of this API to this one file in order to manage
		// our dependency on parse.com.
		Parse.initialize('yrXftBF6mbAuVu3fO6LnhCJiHxZPIdE7gl1DUVGR', '16SZXB7EhUBOBoNol5f8gGypThAiqagG5zmIXfvn');
//		Parse.initialize('R6qNTeumQXjJCMutAJYAwPtip1qBulkFyLefkCE5', 'bAgoDIISBcscMJTTAY4mBB2RHLfkowkqMBMhQ1CD');
		this.getAllBooks = function () {
			return restangular.withConfig(authService.config()).all('classes/books').getList({ "limit": 50 }).then(function (resultWithWrapper) {
				return resultWithWrapper.results;
			});
		};
		this.getAllBooksCount = function () {
			return restangular.withConfig(authService.config()).all('classes/books').getList({ "limit": 0, "count": 1 }).then(function (resultWithWrapper) {
				return resultWithWrapper.count;
			});
		};

        this.getBookshelf = function(shelfName) {
            // This version retrieves a version of the data and is shorter. But we use this object in ways that require
            // it to be an actual parse.com API bookshelf object.
//            return restangular.withConfig(authService.config()).all('classes/bookshelf').getList({ "name": shelfName }).then(function (resultWithWrapper) {
//                return resultWithWrapper.results[0];
//            });
            var defer = $q.defer();
            var query = new Parse.Query('bookshelf');
                query.equalTo("name", shelfName);
            query.find({
                success: function (results) {
                    // I am not clear why the $apply is needed. I got the idea from http://jsfiddle.net/Lmvjh/3/.
                    // There is further discussion at http://stackoverflow.com/questions/17426413/deferred-resolve-in-angularjs.
                    // Maybe it is NOT needed here; copied logic from getFilteredBookRange
                    $rootScope.$apply(function () { defer.resolve(results[0]); });
                },
                error: function (aError) {
                    defer.reject(aError);
                }
            });
            return defer.promise;
        };

        // Reverse whether the book is a member of the shelf.
        this.ToggleBookInShelf = function(book, shelf) {
            // This should work (preliminary version...to ADD only) but runs into a bug in Parse,
            // No 'Access-Control-Allow-Origin' header is present on the requested resource.
            // So we use the javascript api
//            restangular.withConfig(authService.config()).one('classes/bookshelf/'+shelf.objectId).post('',
//                {books:{"__op":"AddRelation","objects":[{"__type":"Pointer","className":"books","objectId":book.objectId}]}});
            // the shelf and book objects may be restangular ones, not javascript ones. We need proper javascript API objects.
            // We can simplify this if we use javascript API objects more widely...but I think we may need the JSON-ified
            // objects for the angularJS interaction.
            var bookshelf = Parse.Object.extend("bookshelf");
            var query = new Parse.Query(bookshelf);
            query.get(shelf.objectId, {
                success: function(javaShelf) {
                    var books = Parse.Object.extend("books");
                    var bookQuery = new Parse.Query(books);
                    bookQuery.get(book.objectId, {
                        success: function(javaBook) {
                            var relation = javaShelf.relation("books");
                            var presentQuery = relation.query();
                            presentQuery.equalTo("objectId", book.objectId);
                            presentQuery.find({
                                success:function(list) {
                                    if (list.length > 0) {
                                        relation.remove(javaBook);
                                    }
                                    else {
                                        relation.add(javaBook);
                                    }
                                    javaShelf.save();
                                }
                            });
                        },
                        error: function(object, error) {
                            alert(error);
                        }
                    });
                },
                error: function(object, error) {
                    alert(error);
                }
            });
        };

		// Gets the count of books whose search field (currently lowercase title plus concat of lowercase tags) contains searchString.
		// Returns a promise which will deliver the count.
		// The caller will typically do getFilteredBooksCount(...).then(function(count) {...}
		// and inside the scope of the function count will be the book count.
		// See comments in getFilteredBookRange for how the parse.com query is mapped to an angularjs promise.
		this.getFilteredBooksCount = function (searchString, shelf) {
			var defer = $q.defer();
			var query = new Parse.Query('books');
            if (searchString && !shelf) {
                query.contains('search', searchString.toLowerCase());
            }
            if (shelf) {
                query = shelf.relation("books").query();
            }
            query.count({
				success: function (count) {
					$rootScope.$apply(function () { defer.resolve(count); });
				},
				error: function (aError) {
					defer.reject(aError);
				}
			});

			return defer.promise;
		};

		this.getBookRange = function (first, count) {
			return restangular.withConfig(authService.config()).all('classes/books').getList({ "skip": first, "limit": count }).then(function (resultWithWrapper) {
				return resultWithWrapper.results;
			});
		};

		// We want a subset of the books whose search field contains searchString.
		// From that set we want up to count items starting at first (0-based).
		// We will return the result as an angularjs promise. Typically the caller will
		// do something like getFilteredBookRange(...).then(function(books) {...do something with books}
		// By that time books will be an array of json-encoded book objects from parse.com.
		this.getFilteredBookRange = function (first, count, searchString, shelf, sortBy, ascending) {
			var defer = $q.defer(); // used to implement angularjs-style promise
            // This is a parse.com query, using the parse-1.2.13.min.js script included by index.html
			var query = new Parse.Query('books');
			// Configure the query to give the results we want.
			query.skip(first);
			query.limit(count);
			//query.include("uploader"); // reinstate this and code below if we need contents of uploader
			if (searchString && !shelf) {
				query.contains('search', searchString.toLowerCase());
			}
            if (shelf) {
                query = shelf.relation("books").query();
            }
			// Review: have not yet verified that sorting works at all. At best it probably works only for top-level complete fields.
			// It does not work for e.g. volumeInfo.title.
			if (sortBy) {
				if (ascending) {
					query.ascending(sortBy);
				}
				else {
					query.descending(sortBy);
				}
			}
			// query.find returns a parse.com promise, but it is not quite the same api as
			// as an angularjs promise. Instead, translate its find and error funtions using the
			// angularjs promise.
			query.find({
				success: function (results) {
					var objects = new Array(results.length);
					for (i = 0; i < results.length; i++) {
						// reinstate this and the line above if we need the contents (more than objectID) of the uploader field.
//						// without this the extra fields downloaded by include("uploader") don't get copied to objects.
//						var user = results[i].get("uploader");
//						if (user)
//						{
//							results[i].set("uploader", user.toJSON());
//						}
						objects[i] = results[i].toJSON();
					}
					// I am not clear why the $apply is needed. I got the idea from http://jsfiddle.net/Lmvjh/3/.
					// There is further discussion at http://stackoverflow.com/questions/17426413/deferred-resolve-in-angularjs.
					// Without it, the display does not update properly; typically each click updates to what it
					// should have been after the previous click.
					$rootScope.$apply(function () { defer.resolve(objects); });
				},
				error: function (aError) {
					defer.reject(aError);
				}
			});

			return defer.promise;
		};

		this.getBookById = function (id) {
			return restangular.withConfig(authService.config()).one('classes/books', id).get({include:"uploader"});
		};

		this.deleteBook = function (id) {
			return restangular.withConfig(authService.config()).one('classes/books', id).remove();
		};
	} ])
	.service('userService', ['Restangular', 'authService', function (restangular, authService) {
		var checkforerror = function (callback) {


		};

		this.register = function (user, callback) {
			if (!user.mandatoryfield) {
				return restangular.withConfig(authService.config()).all('users').post(user).then(callback, callback);
			}
		};

		this.readByUserName = function (username, callback) {
			return restangular.withConfig(authService.config()).all('users').getList({ "where": '{"username": "' + username + '"}' }).then(callback, callback);
		};
	} ])
	.service('bookCountService', function () { // service to provide shared access to this object between detail and browse for delete
		var bookCountObject = {bookCount: 0};
		return {
			getCount: function() {
				return bookCountObject;
			}
		};
	});
