(function () { // to wrap use strict
	'use strict';

	angular.module('BloomLibraryApp.confirmRelateDialog', ['ui.router', "restangular"])
		.config(function config($urlRouterProvider, $stateProvider, $compileProvider) {
		});

	angular.module('BloomLibraryApp.confirmRelateDialog').controller('confirmRelateDialog', ['$scope', '$modalInstance', 'relatedBooks',

		function ($scope, dialog, relatedBooks) {

			$scope.books = relatedBooks;

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