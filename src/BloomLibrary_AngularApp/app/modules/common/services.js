angular.module('BloomLibraryApp.services', ['restangular'])
    .factory('authService', ['Restangular', function(restangular) {
        var isLoggedIn = false;
        var userNameX = 'unknown';

        var restangularDefaultConfig = function (restangularConfigurer) {
            var headers = {
                'X-Parse-Application-Id':'R6qNTeumQXjJCMutAJYAwPtip1qBulkFyLefkCE5',
                'X-Parse-REST-API-Key':'P6dtPT5Hg8PmBCOxhyN9SPmaJ8W4DcckyW0EZkIx'
            };
            restangularConfigurer.setBaseUrl('https://api.parse.com/1');//1/classes is a parse.com thing
            restangularConfigurer.setDefaultHeaders(headers);
			
        };

        return {

            userName: function () { return userNameX; },

            isLoggedIn: function () { return isLoggedIn; },          

            setSession : function(sessionToken) {
                if (sessionToken) {
                    headers['X-Parse-Session-Token'] = sessionToken;
                }
                restangular.withConfig(function(restangularConfigurer) {
                    restangularConfigurer.setDefaultHeaders(headers);
                });
            },

            login: function(username, password, successCallback, errorCallback) {
                // GET: .../login
                restangular.withConfig(restangularDefaultConfig).all('login').getList({ 'username': username, 'password': password })
                    .then(function (result) {
                        isLoggedIn = true;
                        userNameX = username;
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
                setSession('');
            }

        }}])
   
	.service('bookService', ['Restangular', function(restangular) {
		var restangularDefaultConfig = function(restangularConfigurer) {
			var headers = {
				'X-Parse-Application-Id':'R6qNTeumQXjJCMutAJYAwPtip1qBulkFyLefkCE5',
				'X-Parse-REST-API-Key':'P6dtPT5Hg8PmBCOxhyN9SPmaJ8W4DcckyW0EZkIx'
			};
			restangularConfigurer.setBaseUrl('https://api.parse.com/1');//1/classes is a parse.com thing
			restangularConfigurer.setDefaultHeaders(headers);
		};
		this.getAllBooks = function () {
		    return restangular.withConfig(restangularDefaultConfig).all('classes/books').getList({"limit":50}).then(function(resultWithWrapper)   {
		        return resultWithWrapper.results;
		    })
		};		
		this.getBookById = function (id) {
		    return restangular.withConfig(restangularDefaultConfig).one('classes/books',id).get();
		};
	}])
	.service('userService', ['Restangular', function(restangular) {
		var checkforerror = function(callback) {
			
			
		};
		var restangularDefaultConfig = function(restangularConfigurer) {
			var headers = {
				'X-Parse-Application-Id':'R6qNTeumQXjJCMutAJYAwPtip1qBulkFyLefkCE5',
				'X-Parse-REST-API-Key':'P6dtPT5Hg8PmBCOxhyN9SPmaJ8W4DcckyW0EZkIx'
			};
			restangularConfigurer.setBaseUrl('https://api.parse.com/1');//1/classes is a parse.com thing
			restangularConfigurer.setDefaultHeaders(headers);
		};
		this.register = function(user, callback) {
			if (!user.mandatoryfield) {
				return restangular.withConfig(restangularDefaultConfig).all('users').post(user).then(callback,callback);
			}
		};
		
		this.readByUserName = function(username, callback) {
			return restangular.withConfig(restangularDefaultConfig).all('users').getList({"where": '{"username": "' + username + '"}'}).then(callback,callback);
		};
	}]);