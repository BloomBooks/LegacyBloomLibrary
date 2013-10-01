angular.module('BloomLibraryApp.services', ['restangular'])
	.service('authService', ['Restangular', function(Restangular) {
		this.setSession = function(sessionToken) {
			var headers = {
				'X-Parse-Application-Id':'R6qNTeumQXjJCMutAJYAwPtip1qBulkFyLefkCE5',
				'X-Parse-REST-API-Key':'P6dtPT5Hg8PmBCOxhyN9SPmaJ8W4DcckyW0EZkIx'
			};
			if (sessionToken) {
				headers['X-Parse-Session-Token'] = sessionToken;
			}
			Restangular.withConfig(function(RestangularConfigurer) {
				RestangularConfigurer.setDefaultHeaders(headers);
			});
		};
		this.login = function(username, password, successCallback, errorCallback) {
       		Restangular.one('login').getList({'username': username, 'password': password}).then(successCallback, errorCallback);
		}
	}])
;