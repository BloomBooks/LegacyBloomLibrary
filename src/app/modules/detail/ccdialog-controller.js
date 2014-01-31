(function () { // to wrap use strict
	'use strict';

	angular.module('BloomLibraryApp.ccdialog', ['ui.router', "restangular"])
		.config(function config($urlRouterProvider, $stateProvider, $compileProvider) {
		})
		// we get a string like 'cc-by-nc-sa and we return a human-readable interpretation
		// Review: the current implementation will give an 'anything goes' interpretation
		// to any string it does not recognize (except ones javascript interprets as false).
		// Note that Bloom does not currently produce any CC license codes that do NOT include 'by';
		// Hence, all interpretations (except ask and custom) will include "You must attribute...".
		// "anything goes" would logically be simple "cc" (lacking by, nc, nd, and sa)
		// but actually anything unrecognized will be so interpreted.
		.filter('interpretCC', function () {
			return function (input) {
				if (!input || input == "ask")
				{
					return "You must ask the author for permission to use this work.";
				}
				if (input == "custom")
				{
					return "You may use this work only as described in any adjacent notes or after asking the author for permission.";
				}
				var result = "";
				if(input.indexOf("nc") < 0)
				{
					result+="You are free to make commercial use of this work. ";
				}
				else
				{
					result += "You may not use this work for commercial purposes. ";
				}

				if (input.indexOf("nd") < 0)
				{
					result += "You may not alter, transform, or build upon this work without permission. ";
				}
				else if (input.indexOf("sa") < 0)
				{
					result += "You may adapt or build upon this work, but you may distribute the resulting work only under the same or similar license to this one. ";
				}
				else
				{
					result += "You are free to adapt, remix, copy, distribute, and transmit this work. ";
				}
				if(input.indexOf("by") >= 0)
				{
					result += "You must attribute the work in the manner specified by the author. ";
				}
				return result;
			};
		});

	angular.module('BloomLibraryApp.ccdialog').controller('ccdialog', ['$scope', '$state', '$stateParams', 'dialog', '$dialog','bookService', '$location', 'book',

		function ($scope, $state, $stateParams, dialog, $dialog, bookService, $location, book) {

			$scope.book = book;

			$scope.close = function () {
				dialog.close();
			};

			// This is so the dialog closes when the back button in the browser is used.
			$scope.$on('$locationChangeSuccess', function (event) {
				dialog.close();
			});
		} ]);
} ());  // end wrap-everything function