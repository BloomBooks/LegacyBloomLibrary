(function () { // to wrap use strict
	'use strict';

	// This module manages the warning page that comes up when a book is first downloaded.
	// its url looks like download/bookId.
	// It's Continue button will attempt to download the specified book.
	angular.module('BloomLibraryApp.download', ['ui.router', "restangular"])
		.config(function config($urlRouterProvider, $stateProvider, $compileProvider) {
			// Tell angular that urls starting with bloom: are OK. (Otherwise it marks them 'unsafe' and Chrome at
			// least won't follow them.). This is needed for the Continue button.
			$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|bloom|mailto):/);
			$stateProvider.state('downloadBook', {
				url: "/downloadBook/:bookId",
				templateUrl: 'modules/download/download.tpl.html',
				controller: 'DownloadCtrl'
			});
            $stateProvider.state('downloadBookStarted', {
                url: "/downloadBookStarted/:bookId",
                templateUrl: 'modules/download/downloadBookStarted.tpl.html',
                controller: 'DownloadCtrl'
            });
        });

	angular.module('BloomLibraryApp.download').controller('DownloadCtrl', ['$scope', '$state', '$stateParams','bookService', '$location', '$cookies',

		function ($scope, $state, $stateParams, bookService, $location, $cookies) {
			//get the book for which we're going to show the details
			bookService.getBookById($stateParams.bookId).then(function (book) {
				$scope.book = book;
			});

			// Set this boolean to a value indicating whether we are running on Windows.
			// According to
			// http://stackoverflow.com/questions/19877924/what-is-the-list-of-possible-values-for-navigator-platform-as-of-today
			// all major browsers currently agree that all versions of Windows after 3.1, even 64-bit ones, are
			// platform Win32.
			$scope.isWindows = navigator.platform == "Win32";

			$scope.cancel = function () {
				if ($scope.skipDownloadPage) {
					$cookies.skipDownloadPage = "yes";
				}
				$state.go('browse'); //we're done here. Go back home. Review: should we go instead to detail/bookId?
			};
			$scope.continueDownload = function () {
                //NB: currently, we are losing the filter when we eventually return to Browse
                //but this was true when
				$state.go('downloadBookStarted/').then(function(){
                    window.location.href = $scope.book.bookOrder;
                });
			};
		} ]);
} ());  // end wrap-everything function