(function () { // to wrap use strict
	'use strict';

	// Model declaration for the data grid view (url #/datagrid)
	angular.module('BloomLibraryApp.datagrid', ['ui.router', 'restangular', 'ui.grid', 'ui.grid.pagination'])//, 'BloomLibraryApp.detail'])
	.config(['$stateProvider', function config($stateProvider) {

		$stateProvider.state('datagrid', {
			url: "/datagrid",
			templateUrl: 'modules/datagrid/datagrid.tpl.html',
			controller: 'DataGridCtrl',
			title: 'Book Library'
		});
	} ]);

	// Controller for the data grid view (url #/datagrid)
	// Todo: Trello card says Columns of interest: Title, Date, Copyright Holder, License, Modified Date, Workflow Status: {Draft, Edited, Private Published, Web Published}
	// Most of these are not currently available (or at least not in the sample data).
	// The setting scope.visibleData needs to be modified to make the actual fields we want,
	// and the columnDefs spec should be changed to match, and eventually we need to implement a sortBy for each column.
	angular.module('BloomLibraryApp.datagrid')
	.controller('DataGridCtrl', ['$scope', '$timeout', 'bookService', '$state', '$stateParams', '$location',
		function ($scope, $timeout, bookService, $state, $stateParams, $location) {
			$scope.getBooks = function() {
				var first = 0;
				var count = bookService.getAllBooksCount();

				bookService.getFilteredBookRange(first, count, '', '', '', '', '', '', true).then(function (result) {
					$scope.booksData = result.map(function (item) {
						return {
							title: item.title,
							createdAt: new Date(item.createdAt).toLocaleDateString(),
							copyright: item.copyright.match("^Copyright ") ? item.copyright.substring(10) : item.copyright,
							license: item.license,
							updatedAt: new Date(item.updatedAt).toLocaleDateString(),
							pageCount: item.pageCount,
							//Todo: Get bookshelf
							tags: item.tags ? item.tags.toString() : '',
							languages: item.langPointers ? item.langPointers.map(function(item) {
								var output = '';
								output += item.name;
								if(item.englishName && item.name != item.englishName)
								{
									output += ' (' + item.englishName + ')';
								}
								return output;
							}).toString() : ''
						};
					});
				});
			};

			$scope.getBooks();
			$scope.gridOptions = {
				data: 'booksData',
				paginationPageSizes: [10, 24, 50, 100],
				paginationPageSize: 10,
				enableFiltering: true,
				columnDefs: [
					{ field: 'title', displayName: 'Title', width: '***' },
					{ field: 'createdAt', displayName: 'Created', width: '*' },
					{ field: 'copyright', displayName: 'Copyright', width: '*' },
					{ field: 'license', displayName: 'License', width: '*' },
					{ field: 'updatedAt', displayName: 'Modified', width: '*' },
					{ field: 'pageCount', displayName: 'Pages', width: '*' },
					{ field: 'bookshelf', displayName: 'Bookshelf', width: '*' },
					{ field: 'tags', displayName: 'Tags', width: '*'/*, cellTooltip: true*/ },
					{ field: 'languages', displayName: 'Languages', width: '*'/*, cellTooltip: true*/ }]
			};
		}]);
} ()); // end wrap-everything function