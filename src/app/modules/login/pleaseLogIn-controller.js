(function () { // to wrap use strict
	'use strict';

	angular.module('BloomLibraryApp.pleaseLogIn', ['ui.router', "restangular"])
		.config(function config($urlRouterProvider, $stateProvider, $compileProvider) {
		});

	angular.module('BloomLibraryApp.pleaseLogIn').controller('pleaseLogIn', ['$scope', '$modalInstance',

		function ($scope, $modalInstance) {

			$scope.close = function () {
                $modalInstance.close(false);
			};

			// This is so the dialog closes (backdrop removed, etc.) when the back button in the browser is used
			// or the user follows a link in the dialog.
			$scope.$on('$locationChangeSuccess', function (event) {
                $modalInstance.close();
			});
		} ]);
} ());  // end wrap-everything function