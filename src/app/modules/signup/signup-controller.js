(function () { // to wrap use strict
	'use strict';

	angular.module('BloomLibraryApp.signup', ['ui.router', 'BloomLibraryApp.services', 'palaso.ui.notice'])//, 'BloomLibraryApp.detail'])
    .config(function config($stateProvider) {
		$stateProvider.state('signup', {
			url: "/signup",
			templateUrl: 'modules/signup/signup.tpl.html',
			controller: 'SignupCtrl',
			title: 'Sign Up'
		});
	})
	.directive('ngBlur', ['$parse', function ($parse) {
		return function (scope, element, attr) {
			var fn = $parse(attr['ngBlur']);
			element.bind('blur', function (event) {
				scope.$apply(function () {
					fn(scope, { $event: event });
				});
			});
		};
	} ])
	.controller('SignupCtrl', ['$scope', 'userService', 'silNoticeService', '$state', 'authService', '$modal', function SignupCtrl($scope, userService, notice, $state, auth, $modal) {
		$scope.record = {};
		$scope.record.id = '';
		$scope.userRegistered = false;
		$scope.showPassword = false;
		$scope.agreeToTerms = false;

		var e = document.getElementById("hpot");
		if (e)
		{
			e.style.display = 'none'; // don't want humans to see this, only spambots
		}

		$scope.createUser = function (record) {
			if (record.notHuman) {
				return true; // In theory, only spambots will see and fill in this field, which JavaScript deletes.
			}
			if (!$scope.agreeToTerms) {
				$modal.open({
					templateUrl: 'modules/login/mustAgree.tpl.html',
					controller: 'mustAgree',
					windowClass: 'ccmodal'
				});
				return true; // abort creating user.
			}
			if (record.email) {
				record.username = record.email;
				$scope.submitting = true;
				userService.register(record, function (result) {
					$scope.submitting = false;
					if (result.data && result.data.error) {
						notice.push(notice.ERROR, result.data.error);
					} else if (result.objectId) {
						notice.clear();
						auth.setUserName(record.email);
						$state.go('browse');
						auth.setSession(result.sessionToken);
					}
				});
				return true;
			} else {
				notice.push(notice.WARN, "The email address is not valid");
			}
		};

		//we'er using the email for the account hame
		$scope.checkUserAccount = function () {
			$scope.userNameOk = false;
			$scope.userNameExists = false;
			if ($scope.record.email) {
				$scope.userNameLoading = true;
				userService.readByUserName($scope.record.email, function (result) {
					$scope.userNameLoading = false;
					if (result.length === 0) {
						$scope.userNameOk = true;
						$scope.userNameExists = false;
					} else {
						$scope.userNameOk = false;
						$scope.userNameExists = true;
					}
					// todo: check for error state
				});
			}
		};
	} ]);
} ());   // end wrap-everything function