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