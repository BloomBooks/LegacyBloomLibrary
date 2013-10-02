'use strict';

angular.module('BloomLibraryApp.login')
	.controller('LoginCtrl', ['$scope', '$dialog', '$timeout', 'silNoticeService', 'authService', 
	                          function ($scope, $dialog, $timeout, silNoticeService, authService) {
       	$scope.login = function() {
       		authService.login($scope.username, $scope.password, function(result) {
       			if (result.error) {
	       			silNoticeService.push(silNoticeService.ERROR, result.error);
       			} else {
					silNoticeService.push(silNoticeService.SUCCESS, "Login Successful");
					
					// add session token to defaultHeaders
					authService.setSession(result.sessionToken);
       				var user = result;
       			}
       		}, function(error) {
	       		silNoticeService.push(silNoticeService.ERROR, error);
       			
       		});
       	}
  }]);