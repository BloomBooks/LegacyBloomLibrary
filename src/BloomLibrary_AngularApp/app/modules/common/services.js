angular.module('BloomLibraryApp.services', ['restangular'])
    .factory('authService', ['Restangular', function(restangular) {
        var isLoggedIn = false;
        var userNameX = 'unknown';
		// These headers are the magic keys for our account at Parse.com
		// While someone is logged on, another header gets added (see setSession).
		var headers = {
			'X-Parse-Application-Id':'R6qNTeumQXjJCMutAJYAwPtip1qBulkFyLefkCE5',
			'X-Parse-REST-API-Key':'P6dtPT5Hg8PmBCOxhyN9SPmaJ8W4DcckyW0EZkIx'
		};

		var restangularConfig = function (restangularConfigurer) {
			restangularConfigurer.setBaseUrl('https://api.parse.com/1');// 1/indicates rev 1 of parse.com API
            restangularConfigurer.setDefaultHeaders(headers);
        };

        var factory = {

            userName: function () { return userNameX; },
			setUserName: function(newName) {userNameX = newName;},

			isLoggedIn: function () { return isLoggedIn; },

			config: function () { return restangularConfig;},

            setSession : function(sessionToken) {
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

            login: function(username, password, successCallback, errorCallback) {
                // GET: .../login
				restangular.withConfig(restangularConfig).all('login').getList({ 'username': username, 'password': password })
                    .then(function (result) {
                        isLoggedIn = true;
                        userNameX = username;
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
            }

        };

        return factory;
        }])

	.service('bookService', ['Restangular', 'authService', '$q', '$rootScope', function(restangular, authService, $q, $rootScope) {
		// Initialize Parse.com javascript query module for our project.
		// Note: we would prefer to do this query using the REST API, but it does not currently support substring matching.
		// Please keep using the REST API wherever possible and the javascript API only where necessary.
		// Enhance: it is probably possible to implement server-side functions and access them using REST instead of
		// using the parse.com javascript API. We are limiting use of this API to this one file in order to manage
		// our dependency on parse.com.
		Parse.initialize('R6qNTeumQXjJCMutAJYAwPtip1qBulkFyLefkCE5', 'bAgoDIISBcscMJTTAY4mBB2RHLfkowkqMBMhQ1CD');
		this.getAllBooks = function () {
			return restangular.withConfig(authService.config()).all('classes/books').getList({"limit":50}).then(function(resultWithWrapper)   {
		        return resultWithWrapper.results;
		    })
		};
		this.getAllBooksCount = function () {
			return restangular.withConfig(authService.config()).all('classes/books').getList({"limit":0, "count":1}).then(function(resultWithWrapper)   {
				return resultWithWrapper.count;
			})
		};

		// Gets the count of books whose title contains searchString.
		// Returns a promise which will deliver the count.
		// The caller will typically do getFilteredBooksCount(...).then(function(count) {...}
		// and inside the scope of the function count will be the book count.
		// See comments in getFilteredBookRange for how the parse.com query is mapped to an angularjs promise.
		this.getFilteredBooksCount = function (searchString) {
			var defer = $q.defer();
			var query = new Parse.Query('books');
			if (searchString)
				query.contains('volumeInfo.title', searchString);
			query.count({
				success : function(count) {
					$rootScope.$apply(function(){defer.resolve(count)});
				},
				error : function(aError) {
					defer.reject(aError);
				}
			});

			return defer.promise;
		};

		this.getBookRange = function (first, count) {
			return restangular.withConfig(authService.config()).all('classes/books').getList({"skip":first, "limit":count}).then(function(resultWithWrapper)   {
				return resultWithWrapper.results;
			})
		};

		// We want a subset of the books whose title contains searchString.
		// From that set we want up to count items starting at first (0-based).
		// We will return the result as an angularjs promise. Typically the caller will
		// do something like getFilteredBookRange(...).then(function(books) {...do somethign with books}
		// By that time books will be an array of json-encoded book objects from parse.com.
		this.getFilteredBookRange = function (first, count, searchString, sortBy, ascending) {
			var defer = $q.defer(); // used to implement angularjs-style promise
			// This is a parse.com query, using the parse-1.2.13.min.js script included by index.html
			var query = new Parse.Query('books');
			// Configure the query to give the results we want.
			query.skip(first);
			query.limit(count);
			if (searchString)
				query.contains('volumeInfo.title', searchString);
			// Review: have not yet verified that sorting works at all. At best it probably works only for top-level complete fields.
			// It does not work for e.g. volumeInfo.title.
			if (sortBy) {
				if (ascending)
					query.ascending(sortBy);
				else
					query.descending(sortBy);
			}
			// query.find returns a parse.com promise, but it is not quite the same api as
			// as an angularjs promise. Instead, translate its find and error funtions using the
			// angularjs promise.
			query.find({
				success : function(results) {
					var objects = new Array(results.length);
					for (i = 0; i < results.length; i++)
					{
						objects[i] = results[i].toJSON();
					}
					// I am not clear why the $apply is needed. I got the idea from http://jsfiddle.net/Lmvjh/3/.
					// There is further discussion at http://stackoverflow.com/questions/17426413/deferred-resolve-in-angularjs.
					// Without it, the display does not update properly; typically each click updates to what it
					// should have been after the previous click.
					$rootScope.$apply(function(){defer.resolve(objects)});
				},
				error : function(aError) {
					defer.reject(aError);
				}
			});

			return defer.promise;
		};

		this.getBookById = function (id) {
			return restangular.withConfig(authService.config()).one('classes/books',id).get();
		};
	}])
	.service('userService', ['Restangular', 'authService', function(restangular, authService) {
		var checkforerror = function(callback) {


		};

		this.register = function(user, callback) {
			if (!user.mandatoryfield) {
				return restangular.withConfig(authService.config()).all('users').post(user).then(callback,callback);
			}
		};

		this.readByUserName = function(username, callback) {
			return restangular.withConfig(authService.config()).all('users').getList({"where": '{"username": "' + username + '"}'}).then(callback,callback);
		};
	}]);