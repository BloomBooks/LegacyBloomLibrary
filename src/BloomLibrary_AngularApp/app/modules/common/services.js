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
   
	.service('bookService', ['Restangular', 'authService', function(restangular, authService) {
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
		this.getBookRange = function (first, count) {
			return restangular.withConfig(authService.config()).all('classes/books').getList({"skip":first, "limit":count}).then(function(resultWithWrapper)   {
				return resultWithWrapper.results;
			})
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