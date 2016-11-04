(function () { // to wrap use strict
	'use strict';

	angular.module('BloomLibraryApp.reportBook', ['ui.router', "restangular"])
	.config(function config($urlRouterProvider, $stateProvider, $compileProvider) {
		
		var detailModalInstance;
		
		$stateProvider.state('browse.detail.reportbook', {
			url: "/reportbook",
			views: {
				'@': {
					templateUrl: 'modules/reportBook/reportBook.tpl.html',
					controller: 'ReportBookCtrl'
				}
			}
		});
	});

	angular.module('BloomLibraryApp.reportBook').controller('ReportBookCtrl', ['$state', '$scope', 'authService', '$stateParams', 'bookService', 'emailService', 'silNoticeService',
	function ($state, $scope, authService, $stateParams, bookService, emailService, silNoticeService) {

		$scope.userEmailAddress = authService.userName();

		// Used to display the book title
		bookService.getBookById($stateParams.bookId).then(function (book) {
			$scope.book = book;
		});

		$scope.canReportViolation = authService.isLoggedIn(); // We demand this to reduce spamming.

		$scope.report = function () {
			emailService.sendConcernEmail($scope.concerns, $stateParams.bookId).then(function() {
				silNoticeService.replace(silNoticeService.SUCCESS, "Your concerns about " + $scope.book.title + " have been submitted.");
				$state.go('^');
			});
		};

		$scope.cancel = function () {
			$state.go('^');
		};
	} ]);
} ());  // end wrap-everything function