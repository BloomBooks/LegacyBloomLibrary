(function () { // to wrap use strict
	'use strict';

	angular.module('BloomLibraryApp.detail', ['ui.router', "restangular"])
	.config(function config($urlRouterProvider, $stateProvider, $compileProvider) {
		// Tell angular that urls starting with bloom: are OK. (Otherwise it marks them 'unsafe' and Chrome at
		// least won't follow them.). This is needed for the Open in Bloom button.
		$compileProvider.urlSanitizationWhitelist(/^\s*(https?|bloom):/);
		// For angular 1.2 this should be changed to
		//$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|bloom):/);
		$stateProvider.state('browse.detail', {
			url: "/detail/:bookId",
			onEnter: function ($dialog, $state) {

				$dialog.dialog(
					{
						backdrop: true,
						keyboard: true, //make ESC close it
						backdropClick: true, //make clicking on the backdrop close it
						templateUrl: 'modules/detail/detail.tpl.html',
						controller: 'DetailCtrl'
					}).open().then(function (result) {
						if (!result) {
							return $state.transitionTo("browse");
						}
					});
			}
		});
	})
		// we get a string like 'by-nc-sa and we return a human-readable interpretation
		// Review: the current implementation will give an 'anything goes' interpretation
		// to any string it does not recognize (except ones javascript interprets as false).
		// Note that Bloom does not currently produce any CC license codes that do NOT start 'by';
		// Hence, all interpretations (except ask and custom) will include "You must attribute...".
		// Since "anything goes" would logically be an empty string (lacking by, nc, nd, and sa)
		// there is currently no standard way to encode this, though "any" would work.
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
		})
		//we get a json list like ['pdc','en', 'fr'] and we return ['pdc, English, French']
		// Enhance: use some localizable mechanism
		.filter('prettyLang', function () {
			return function (input) {
				var result = [];
				if (input == null)
				{
					return result;
				}
				var len = input.length;
				for (var i = 0; i < len; i++)
				{
					switch(input[i])
					{
						case "en": result[i] = "English";
							break;
						case "fr": result[i] = "French";
							break;
						case "es": result[i] = "Spanish";
							break;
						case "de": result[i] = "German";
							break;
						case "zh": result[i] = "Chinese";
							break;
						case "ja": result[i] = "Japanese";
							break;
						case "ko": result[i] = "Korean";
							break;
						case "pt": result[i] = "Portuguese";
							break;
						case "ru": result[i] = "Russian";
							break;
						default: result[i] = input[i];
							break;
					}
				}
				return result;
			};
		})
		//we get a json list like ['me','you'] and we return 'me, you'
		.filter('makeCommaList', function () {
			return function (input) {
				return input == null ? "" : input.join(", ");
			};
		})
		//we get a date string and return it more nicely formatted
		.filter('cleanDate', function () {
			return function (input) {
				return input == null ? "" : new Date(input).toLocaleDateString();
			};
		});

	angular.module('BloomLibraryApp.detail').controller('DetailCtrl', ['$scope', '$state', '$stateParams', 'dialog', 'bookService', '$location',

	function ($scope, $state, $stateParams, dialog, bookService, $location) {
		//get the book for which we're going to show the details
		bookService.getBookById($stateParams.bookId).then(function (book) {
			$scope.book = book;
		});

		$scope.close = function () {
			dialog.close();
		};

		// This is so the dialog closes when the back button in the browser is used.
		$scope.$on('$locationChangeSuccess', function (event) {
			dialog.close();
		});
	} ]);
} ());  // end wrap-everything function