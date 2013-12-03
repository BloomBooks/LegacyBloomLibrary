(function () { // to wrap use strict
	'use strict';
	angular.module('BloomLibraryApp.browse', ['ui.router', 'restangular'])//, 'BloomLibraryApp.detail'])
	.config(['$stateProvider', function config($stateProvider) {

		$stateProvider.state('browse', {
			//review: I had wanted to have the main view be named, and have the name be 'main', but then nothing would show
			//it's as if the top level view cannot be named. (note that you can specify it by saying views: {'@': 
			url: "/browse?search",
			templateUrl: 'modules/browse/browse.tpl.html',
			controller: 'BrowseCtrl'
		});
	} ])

	//we get a json list like ['me','you'] and we return 'me, you'
.filter('makeCommaList', function () {
	return function (input) {
		return input.join(", ");
	};
});

	angular.module('BloomLibraryApp.browse')
	.controller('BrowseCtrl', ['$scope', '$dialog', '$timeout', 'bookService', '$state', '$stateParams', '$location',
								function ($scope, $dialog, $timeout, bookService, $state, $stateParams, $location) {

		$scope.searchText = $stateParams["search"];
		$scope.searchTextRaw = $scope.searchText;
		bookService.getFilteredBooksCount($scope.searchText).then(function (count) {
			$scope.currentPage = 1;
			$scope.bookCount = count;
			$scope.setPage = function () { };
			$scope.filteredBooksCount = count;
			$scope.initialized = true;
		});

		// browse.tpl.html listview div configures this to be called as pageItemsFunction when user chooses a page.
		// Todo: should get Filtered book range.
		$scope.getBookRange = function (first, count) {
			bookService.getFilteredBookRange(first, count, $scope.searchText).then(function (result) {
				$scope.visibleBooks = result;
			});
		};

		$scope.foo = function (paramOne, paramTwo) {
			return paramOne + paramTwo;
		};


		$scope.updatePageControl = function () {
			$scope.currentPage = 1;
			$scope.setPage = function (pageNo) {
				$scope.currentPage = pageNo;
			};

		};

		$scope.SearchNow = function () {
			// Todo: this needs to run a query on the real database and update bookCount
			// and do something to make the listview invoke getBookRange (even if the bookCount
			// does not change).
			$scope.searchText = $scope.searchTextRaw;
			$state.go('.', { search: $scope.searchText });
		};
	} ]);
} ());   // end wrap-everything function