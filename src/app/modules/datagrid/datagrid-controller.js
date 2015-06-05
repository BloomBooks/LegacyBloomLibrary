(function () { // to wrap use strict
	'use strict';

	// Model declaration for the data grid view (url #/datagrid)
	angular.module('BloomLibraryApp.datagrid', ['ui.router', 'restangular', 'ui.grid', 'ui.grid.pagination', 'ui.grid.resizeColumns', 'ui.grid.edit'])//, 'BloomLibraryApp.detail'])
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
							}).toString() : '',
							librarianNote: item.librarianNote
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
					{ field: 'title', displayName: 'Title', width: '***', minWidth: 15, enableCellEdit: false},
					{ field: 'createdAt', displayName: 'Created', width: '*', minWidth: 15, enableCellEdit: false },
					{ field: 'copyright', displayName: 'Copyright', width: '*', minWidth: 15, enableCellEdit: false },
					{ field: 'license', displayName: 'License', width: '*', minWidth: 15, enableCellEdit: false },
					{ field: 'updatedAt', displayName: 'Modified', width: '*', minWidth: 15, enableCellEdit: false },
					{ field: 'pageCount', displayName: 'Pages', width: '*', minWidth: 15, enableCellEdit: false },
					{ field: 'bookshelf', displayName: 'Bookshelf', width: '*', minWidth: 15, enableCellEdit: true },
					{ field: 'tags', displayName: 'Tags', width: '*', minWidth: 15/*, cellTooltip: true*/, enableCellEdit: false },
					{ field: 'languages', displayName: 'Languages', width: '*', minWidth: 15/*, cellTooltip: true*/, enableCellEdit: false },
					{ field: 'librarianNote', displayName: 'Notes', width: '**', minWidth: 15, enableCellEdit: true }]
			};
		}]);
} ()); // end wrap-everything function