'use strict';

angular.module('BloomLibraryApp.signup', ['ui.router', 'BloomLibraryApp.services', 'palaso.ui.notice'])//, 'BloomLibraryApp.detail'])
    .config(function config($stateProvider) {
        $stateProvider.state('signup', {
                    url: "/signup",
                    templateUrl: 'modules/signup/signup.tpl.html',
                    controller: 'SignupCtrl'
        }); 
    })
	.directive('ngBlur', ['$parse', function($parse) {
	  return function(scope, element, attr) {
	    var fn = $parse(attr['ngBlur']);
	    element.bind('blur', function(event) {
	      scope.$apply(function() {
	        fn(scope, {$event:event});
	      });
	    });
	  }
	}])
	.controller('SignupCtrl', ['$scope', 'userService', 'silNoticeService', function SignupCtrl($scope, userService, notice) {
		$scope.record = {};
		$scope.record.id = '';
		$scope.userRegistered = false;
		
		$scope.createUser = function(record) {
			record.username = record.email;
			$scope.submitting = true;
			userService.register(record, function(result) {
				$scope.submitting = false;
				if (result.error) {
					notice.push(notice.ERROR, result.error);
				} else if (result.objectId) {
					notice.push(notice.SUCCESS, "Thank you, " + record.name + ", for registering.  We will contact you via email when your account is active.");
					$("#userForm").fadeOut();
				}
			});
			return true;
		};
		$scope.checkUserName = function() {
			$scope.userNameOk = false;
			$scope.userNameExists = false;
			if ($scope.record.email) {
				$scope.userNameLoading = true;
				userService.readByUserName($scope.record.email, function(result) {
					$scope.userNameLoading = false;
					if (result.results.length == 0) {
						$scope.userNameOk = true;
						$scope.userNameExists = false;
					} else {
						$scope.userNameOk = false;
						$scope.userNameExists = true;
					}
				});
			}
		}
	}])
;