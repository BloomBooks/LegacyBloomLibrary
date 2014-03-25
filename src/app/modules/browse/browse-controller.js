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
		//we get a json list like ['pdc','en', 'fr'] and we return ['pdc, English, French']
		// Enhance: use some localizable mechanism
		// Currently duplicated in detail-controller.js. Keep in sync.
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
						case "tpi": result[i] = "Tok Pisin";
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

	angular.module('BloomLibraryApp.browse')
	.controller('BrowseCtrl', ['$scope', '$dialog', '$timeout', 'bookService', '$state', '$stateParams', 'bookCountService',
								function ($scope, $dialog, $timeout, bookService, $state, $stateParams, bookCountService) {

		$scope.searchText = $stateParams["search"];
		$scope.searchTextRaw = $scope.searchText;
		// if the service book count changes (e.g., because detailView deletes a book),
		// update our scope's bookCount so the list view which is watching it will reload its page.
		$scope.bookCountObject = bookCountService.getCount();
		$scope.$watch('bookCountObject.bookCount', function() {
			$scope.bookCount = $scope.bookCountObject.bookCount;
		});
		bookService.getFilteredBooksCount($scope.searchText).then(function (count) {
			$scope.currentPage = 1;
			$scope.bookCount = $scope.bookCountObject.bookCount = count;
			$scope.setPage = function () { };
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