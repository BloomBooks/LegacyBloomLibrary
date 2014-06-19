(function () { // to wrap use strict
	'use strict';

	// This module manages the warning page that comes up when a book is first downloaded.
	// its url looks like download/bookId.
	// It's Continue button will attempt to download the specified book.
	angular.module('BloomLibraryApp.download', ['ui.router', "restangular"])
		.config(function config($urlRouterProvider, $stateProvider, $compileProvider) {
			// Tell angular that urls starting with bloom: are OK. (Otherwise it marks them 'unsafe' and Chrome at
			// least won't follow them.). This is needed for the Continue button.
			$compileProvider.urlSanitizationWhitelist(/^\s*(https?|bloom|mailto):/);
			// For angular 1.2 this should be changed to
			//$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|bloom):/);
			$stateProvider.state('downloadBook', {
				url: "/downloadBook/:bookId",
				templateUrl: 'modules/download/download.tpl.html',
				controller: 'DownloadCtrl'
			});
		});

	angular.module('BloomLibraryApp.download').controller('DownloadCtrl', ['$scope', '$state', '$stateParams','bookService', '$location', '$cookies',

		// Argument names dialog and $dialog are unfortunately similar here. $dialog is the ui-bootstrap service
		// we use to launch the cc dialog, and cannot be renamed AFAIK. dialog is the detail view itself, used
		// for things like closing it. That could possibly be renamed but I don't know whether it is ours or
		// built into ui-bootstrap.
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
			// This function is not currently used. It is intended as a click action for the Download button.
			// What I would like to do would be to have this button start the download AND navigate back
			// either to the browse view or maybe the prior detail view. Nothing I have tried has worked yet.
			// To get it invoked add ng-click="continueDownload() to the Download button in place of ng-href.
			$scope.continueDownload = function () {
				// This targets an <a> element which, when manually clicked, successfully starts the download.
				// Calling click and then navigating does not. The navigation happens but the download doesn't.
				//         <a id="invokeDownload" ng-href="{{book.bookOrder}}">click me</a>
				//$("#invokeDownload").click();
				// This attempts to navigate a hidden frame to the bloom: url. Nothing happens.
				//         <iframe name="hiddenFrame" src="Javascript:''" style="display:none"></iframe>
				//window.frames['hiddenFrame'].document.location.href = $scope.book.bookOrder;
				// Another attempt at the same thing, fails the same way.
				//window.open($scope.book.bookOrder, "hiddenFrame"); // triggers download because a bloom: url
				// This almost works: the download is triggered, and then we navigate to the home page.
				// But somehow all the angularjs magic is disabled in the home page until it is manually refreshed.
				// window.location = $scope.book.bookOrder;
				$state.go('browse'); //we're done here. Go back home. Review: should we go instead to detail/bookId?
			};
		} ]);
} ());  // end wrap-everything function