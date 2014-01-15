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