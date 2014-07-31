(function () { // to wrap use strict
	'use strict';

	angular.module('BloomLibraryApp.login', ['ui.router', 'BloomLibraryApp.services', 'palaso.ui.notice'])//, 'BloomLibraryApp.detail'])
	.config(function config($stateProvider) {

		$stateProvider.state('login', {
			//review: I had wanted to have the main view be named, and have the name be 'main', but then nothing would show
			//it's as if the top level view cannot be named. (note that you can specify it by saying views: {'@': 
			url: "/login",
			templateUrl: 'modules/login/login.tpl.html',
			controller: 'LoginCtrl',
			title: 'Log In'
		});
	})
;

	angular.module('BloomLibraryApp.login')
	.controller('LoginCtrl', ['$scope', '$timeout', 'silNoticeService', 'authService', '$state', 'userService',
		function ($scope, $timeout, silNoticeService, authService, $state, userService) {

			// Handle a bug in angular: it does not see when the browser auto-fills the user name
			// and so does not update the model.
			// See https://github.com/angular/angular.js/issues/1460#issuecomment-18572604.
			// This code is modelled on a suggestion there by chrisirhc
			var timer = null;
			var wantTimer = true;
			$scope.showPassword = false;
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
				// catch autofill values in password (or 'shown password') field
				var value = $("[name~='password']").val();
				if (value && $scope.password !== value) {
					$scope.password = value;
				}

				authService.login($scope.username, $scope.password, function (result) {
					silNoticeService.clear();
					$state.go('browse'); //we're done here. Go back home
                }, function (error) {
                    // catch for login credential failure
                    if (error.status === 404) {
                        if (error.data.code !== undefined) {
                            if (error.data.code === 101) {
                                silNoticeService.replace(silNoticeService.ERROR, "Login Unsuccessful. Check your username and password and try again. Also check the Caps Lock key.");
                            } else {
                                //silNoticeService.replace(silNoticeService.ERROR, error);
                            }
                        } else {
                            //silNoticeService.replace(silNoticeService.ERROR, error);
                        }
                    } else {
                        //silNoticeService.replace(silNoticeService.ERROR, error);
                    }

                });
            };
			$scope.resetPassword = function() {
				//we're using the email for the account name
				userService.readByUserName($scope.username, function (result) {
					if (result.length === 0) {
						silNoticeService.replace(silNoticeService.ERROR,
							"We don't have an account with this address. Check the spelling and try again. Or you may just need to sign up for a new account.");
					} else {
						authService.sendResetPassword($scope.username);
						silNoticeService.replace(silNoticeService.SUCCESS,
							"An email with instructions for resetting your password has been sent to " + $scope.username + ". If you don't see it in a few minutes, check your spam/junk mail folder.");
					}
					// todo: check for error state
				});
			};
		} ]);
} ());  // end wrap-everything function