(function () { // to wrap use strict
	'use strict';

	// Model declaration for the data grid view (url #/datagrid)
	angular.module('BloomLibraryApp.datagrid', ['ui.router', 'restangular', 'ngGrid'])//, 'BloomLibraryApp.detail'])
	.config(['$stateProvider', function config($stateProvider) {

		$stateProvider.state('datagrid', {
			url: "/datagrid",
			templateUrl: 'modules/datagrid/datagrid.tpl.html',
			controller: 'DataGridCtrl'
		});
	} ]);

	// Controller for the data grid view (url #/datagrid)
	// Todo: Trello card says Columns of interest: Title, Date, Copyright Holder, License, Modified Date, Workflow Status: {Draft, Edited, Private Published, Web Published}
	// Most of these are not currently available (or at least not in the sample data).
	// The setting scope.visibleData needs to be modified to make the actual fields we want,
	// and the columnDefs spec should be changed to match, and eventually we need to implement a sortBy for each column.
	angular.module('BloomLibraryApp.datagrid')
	.controller('DataGridCtrl', ['$scope', '$dialog', '$timeout', 'bookService', '$state', '$stateParams', '$location',
		function ($scope, $dialog, $timeout, bookService, $state, $stateParams, $location) {

			$scope.filterOptions = {
				filterText: "", // gets updated by user action in ngGrid
				useExternalFilter: true
			};
			$scope.totalServerItems = 0;
			$scope.pagingOptions = {
				pageSizes: [20, 50, 100],
				pageSize: 20, // Gets updated by user action in ngGrid
				currentPage: 1 // Gets updated by user action in ngGrid
			};
			$scope.sortInfo = {
				fields: [], directions: [], columns: []
			};
			$scope.getBookRange = function (count, currentPage, searchText) {
				var first = (currentPage - 1) * count;
				var sortField = $scope.sortInfo.fields[0];
				var sortBy = null;
				// Todo: setting sortBy to a complex field like this does not work...no sorting happens.
				// It appears we will need to put a redundant top-level data field in the record for
				// anything we want to sort by. This is especially annoying in that it may not actually
				// be useful to sort by all the fields...but ng-grid allows the user to do so.
				// Possibly we could disallow some fields with a message and switch to some other sort.
				// Another reason a redundant field is probably necessary is that parse.com's built-in sorting
				// is case-sensitive, and their only suggestion for overcoming this is a redundant
				// all-lower-case field. Similarly any other sort-key field must somehow be in a form
				// where a plain binary sort will give the right results.
				if (sortField == 'title') {
					sortBy = 'volumeInfo.title';
				}
				bookService.getFilteredBookRange(first, count, searchText, sortBy).then(function (result) {
					$scope.visibleBooks = result;
					$scope.visibleData = $scope.visibleBooks.map(function (item) {
						return {
							title: item.volumeInfo.title,
							published: item.volumeInfo.publishedDate,
							publisher: item.volumeInfo.publisher,
							pages: item.volumeInfo.pageCount,
							authors: (item.volumeInfo.authors ? item.volumeInfo.authors.join(", ") : "")
						};
					});
				});
			};
			$scope.getBookCount = function (searchText) {
				bookService.getFilteredBooksCount(searchText).then(function (count) {
					$scope.bookCount = count;
				});
			};
			$scope.getBookCount($scope.filterOptions.filterText); // initialize count
			$scope.getBookRange($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage, $scope.filterOptions.filterText); // init
			$scope.$watch('pagingOptions', function (newVal, oldVal) {
				if (newVal !== oldVal && newVal.currentPage !== oldVal.currentPage) {
					$scope.getBookRange($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage, $scope.filterOptions.filterText);
				}
			}, true);
			$scope.$watch('filterOptions', function (newVal, oldVal) {
				if (newVal !== oldVal) {
					$scope.getBookCount($scope.filterOptions.filterText);
					$scope.getBookRange($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage, $scope.filterOptions.filterText);
				}
			}, true);
			$scope.$watch('sortInfo', function (newVal, oldVal) {
				if (newVal !== oldVal) {
					$scope.getBookRange($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage, $scope.filterOptions.filterText);
				}
			}, true);
			$scope.gridOptions = { data: 'visibleData',
				enableColumnResize: true,
				//showColumnMenu:true,
				//showFilter:true,
				enablePaging: true,
				showFooter: true,
				totalServerItems: 'bookCount',
				pagingOptions: $scope.pagingOptions,
				useExternalSorting: true,
				showColumnMenu: true,
				filterOptions: $scope.filterOptions,
				sortInfo: $scope.sortInfo,
				columnDefs: [{ field: 'title', displayName: 'Title', width: '***' },
			{ field: 'published', displayName: 'Date', width: 80 },
			{ field: 'publisher', displayName: 'Copyright', width: '**' },
			{ field: 'pages', displayName: 'Pages', width: 50 },
			{ field: 'authors', displayName: 'Authors', width: '***' }
		]
			};
			//	$scope.searchText = $stateParams["search"];
			//	$scope.searchTextRaw = $scope.searchText;

			//
			//	// browse.tpl.html listview div configures this to be called as pageItemsFunction when user chooses a page.
			//	// Todo: should get Filtered book range.

			//
			//	$scope.foo = function(paramOne, paramTwo) {
			//		return paramOne + paramTwo;
			//	}
			//
			//
			//	$scope.updatePageControl = function () {
			//		$scope.currentPage = 1;
			//		$scope.setPage = function (pageNo) {
			//			$scope.currentPage = pageNo;
			//		};
			//
			//	}
			//
			//	$scope.SearchNow = function () {
			//		// Todo: this needs to run a query on the real database and update bookCount
			//		// and do something to make the listview invoke getBookRange (even if the bookCount
			//		// does not change).
			//		$scope.searchText = $scope.searchTextRaw;
			//		$state.go('.', {search: $scope.searchText});
			//	}
		}]);
} ()); // end wrap-everything function