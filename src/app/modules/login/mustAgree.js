// This module manages the Must Agree modal that comes up when the user tries to create an account without checking the terms checkbox
(function () { // to wrap use strict
	'use strict';

	angular.module('BloomLibraryApp.mustAgree', ['ui.router'])
		.config(function config($urlRouterProvider, $stateProvider) {
		});

	angular.module('BloomLibraryApp.mustAgree').controller('mustAgree', ['$scope', '$modalInstance',

		function ($scope, $modalInstance) {

			$scope.close = function () {
				$modalInstance.close(false);
			};

			// This is so the modal closes (backdrop removed, etc.) when the back button in the browser is used or a link is followed.
			$scope.$on('$locationChangeSuccess', function (event) {
				$modalInstance.close();
			});
		} ]);
} ());  // end wrap-everything function