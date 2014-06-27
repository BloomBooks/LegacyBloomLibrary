// This module manages the In Progress dialog that comes up when the user clicks something we haven't implemented yet.
(function () { // to wrap use strict
	'use strict';

	angular.module('BloomLibraryApp.inProgress', ['ui.router'])
		.config(function config($urlRouterProvider, $stateProvider) {
		});

	angular.module('BloomLibraryApp.inProgress').controller('inProgress', ['$scope', '$modalInstance',

		function ($scope, $modalInstance) {

			$scope.close = function () {
				$modalInstance.close(false);
			};

			// This is so the dialog closes (backdrop removed, etc.) when the back button in the browser is used or a link is followed.
			$scope.$on('$locationChangeSuccess', function (event) {
				$modalInstance.close();
			});
		} ]);
} ());  // end wrap-everything function