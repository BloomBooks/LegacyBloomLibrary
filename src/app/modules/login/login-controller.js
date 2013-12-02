'use strict';

angular.module('BloomLibraryApp.login')
	.controller('LoginCtrl', ['$scope', '$dialog', '$timeout', 'silNoticeService', 'authService', '$state',
	                          function ($scope, $dialog, $timeout, silNoticeService, authService, $state) {
       	$scope.login = function() {
       		authService.login($scope.username, $scope.password, function(result) {
       			if (result.error) {
       			    silNoticeService.replace(silNoticeService.ERROR, result.error);
       			} else {
       			    silNoticeService.replace(silNoticeService.SUCCESS, "Login Successful");
					
					// add session token to defaultHeaders
					authService.setSession(result.sessionToken);

					$state.go('browse'); //we're done here. Go back home
       			}
       		}, function(error) {
       			// catch for login credential failure
       			if (error.status === 404) {
       				if (error.data.code != undefined) {
       					if (error.data.code === 101) {
       					    silNoticeService.replace(silNoticeService.ERROR,
            	       				"Login Unsuccessful. Check your username and password and try again. Also check the Caps Lock key.");
       					} else {
       					    silNoticeService.replace(silNoticeService.ERROR, error);
       					}
       				} else {
       				    silNoticeService.replace(silNoticeService.ERROR, error);
       				}
       			} else {
       			    silNoticeService.replace(silNoticeService.ERROR, error);
       			}
       			
       		});
       	};
  }]);