(function () { // to wrap use strict
	'use strict';

	angular.module('BloomLibraryApp.deleteDialog', ['ui.router', "restangular"])
		.config(function config($urlRouterProvider, $stateProvider, $compileProvider) {
		});

	angular.module('BloomLibraryApp.deleteDialog').controller('deleteDialog', ['$scope', '$modalInstance', 'book',

		function ($scope, dialog, book) {

			$scope.book = book;

			$scope.close = function () {
				dialog.close(false);
			};

			$scope.deleteBook = function () {
				dialog.close(true);
			};

			// This is so the dialog closes when the back button in the browser is used.
			$scope.$on('$locationChangeSuccess', function (event) {
				dialog.close();
			});
		} ]);
} ());  // end wrap-everything function