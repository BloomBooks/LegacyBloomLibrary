(function () { // to wrap use strict
	'use strict';

	angular.module('BloomLibraryApp.login', ['ui.router', 'BloomLibraryApp.services', 'palaso.ui.notice'])//, 'BloomLibraryApp.detail'])
	.config(function config($stateProvider) {

		$stateProvider.state('login', {
			//review: I had wanted to have the main view be named, and have the name be 'main', but then nothing would show
			//it's as if the top level view cannot be named. (note that you can specify it by saying views: {'@': 
			url: "/login",
			templateUrl: 'modules/login/login.tpl.html',
			controller: 'LoginCtrl'
		});
	})
;

	angular.module('BloomLibraryApp.login')
	.controller('LoginCtrl', ['$scope', '$dialog', '$timeout', 'silNoticeService', 'authService', '$state',
		function ($scope, $dialog, $timeout, silNoticeService, authService, $state) {

			// Handle a bug in angular: it does not see when the browser auto-fills the user name
			// and so does not update the model.
			// See https://github.com/angular/angular.js/issues/1460#issuecomment-18572604.
			// This code is modeled on a suggestion there by chrisirhc
			var timer = null;
			var wantTimer = true;
			function startTimer() {
				if (timer != null)
				{
					$timeout.cancel(timer); // just in case we already started one
				}
				if (!wantTimer)
				{
					return;
				}
				timer = $timeout(function () {
					var value = $("#username").val();
					if (value && $scope.username !== value) {
						$scope.username = value;
					}
					startTimer();
				}, 500); // Run this check every half second while login screen active
			}

			$scope.$on('$destroy', function () {
				$timeout.cancel(timer);
				wantTimer = false; // never start another for this scope
			});

			startTimer();

			$scope.login = function () {
				// catch autofill values in password field
				var value = $("#password").val();
				if (value && $scope.password !== value) {
					$scope.password = value;
				}

				authService.login($scope.username, $scope.password, function (result) {
				if (result.error) {
					silNoticeService.replace(silNoticeService.ERROR, result.error);
				} else {
					silNoticeService.replace(silNoticeService.SUCCESS, "Login Successful");

					// add session token to defaultHeaders
					authService.setSession(result.sessionToken);

					$state.go('browse'); //we're done here. Go back home
				}
			}, function (error) {
				// catch for login credential failure
				if (error.status === 404) {
					if (error.data.code !== undefined) {
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
			$scope.resetPassword = function() {
				authService.sendResetPassword($scope.username);
				silNoticeService.replace(silNoticeService.SUCCESS,
					"Reset instructions sent. The sender of this message will be 'no-reply@bloomlibrary.org'; you may need to check your spam folder. Please enter your new password after resetting.");
			};
		} ]);
} ());  // end wrap-everything function