// This module manages the In Progress dialog that comes up when the user clicks something we haven't implemented yet.
(function () { // to wrap use strict
	'use strict';

	angular.module('BloomLibraryApp.mustAgree', ['ui.router'])
		.config(function config($urlRouterProvider, $stateProvider) {
		});

	angular.module('BloomLibraryApp.mustAgree').controller('mustAgree', ['$scope', 'dialog',

		function ($scope, dialog) {

			$scope.close = function () {
				dialog.close(false);
			};

			// This is so the dialog closes (backdrop removed, etc.) when the back button in the browser is used or a link is followed.
			$scope.$on('$locationChangeSuccess', function (event) {
				dialog.close();
			});
		} ]);
} ());  // end wrap-everything function