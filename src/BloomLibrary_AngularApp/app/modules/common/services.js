angular.module('BloomLibraryApp.services', ['restangular'])
	.service('authService', ['Restangular', function(restangular) {
		var restangularDefaultConfig = function(restangularConfigurer) {
			var headers = {
				'X-Parse-Application-Id':'R6qNTeumQXjJCMutAJYAwPtip1qBulkFyLefkCE5',
				'X-Parse-REST-API-Key':'P6dtPT5Hg8PmBCOxhyN9SPmaJ8W4DcckyW0EZkIx'
			};
			restangularConfigurer.setBaseUrl('https://api.parse.com/1');//1/classes is a parse.com thing
			restangularConfigurer.setDefaultHeaders(headers);
			
		};
		this.setSession = function(sessionToken) {
			if (sessionToken) {
				headers['X-Parse-Session-Token'] = sessionToken;
			}
			restangular.withConfig(function(restangularConfigurer) {
				restangularConfigurer.setDefaultHeaders(headers);
			});
		};
		this.login = function(username, password, successCallback, errorCallback) {
			// GET: .../login
			restangular.withConfig(restangularDefaultConfig).all('login').getList({'username': username, 'password': password}).then(successCallback, errorCallback);
		};
	}])
	.service('bookService', ['Restangular', function(restangular) {
		var restangularDefaultConfig = function(restangularConfigurer) {
			var headers = {
				'X-Parse-Application-Id':'R6qNTeumQXjJCMutAJYAwPtip1qBulkFyLefkCE5',
				'X-Parse-REST-API-Key':'P6dtPT5Hg8PmBCOxhyN9SPmaJ8W4DcckyW0EZkIx'
			};
			restangularConfigurer.setBaseUrl('https://api.parse.com/1');//1/classes is a parse.com thing
			restangularConfigurer.setDefaultHeaders(headers);
			
		};
		this.books_list = function() {
			return restangular.withConfig(restangularDefaultConfig).all('classes/books').getList();
		};
	}])
;