(function () { // to wrap use strict
	'use strict';

	// Model declaration for the data grid view (url #/datagrid)
	angular.module('BloomLibraryApp.datagrid', ['ui.router', 'restangular', 'ui.grid', 'ui.grid.pagination', 'ui.grid.resizeColumns', 'ui.grid.edit', 'ui.grid.cellNav'])//, 'BloomLibraryApp.detail'])
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
	.controller('DataGridCtrl', ['$scope', '$timeout', 'bookService', '$state', '$stateParams', '$location', 'uiGridConstants',
		function ($scope, $timeout, bookService, $state, $stateParams, $location, uiGridConstants) {
			$scope.getBooks = function() {
				var first = 0;
				var count = bookService.getAllBooksCount();

				bookService.getFilteredBookRange(first, count, '', '', '', '', '', '', true, true).then(function (result) {
					$scope.booksData = result.map(function (item) {
						return {
							//Hidden id
							objectId: item.objectId,
							inCirculation: item.inCirculation !== false ? 'yes' : 'no',
							title: item.title,
							createdAt: (function() {
								var dateWithTime = new Date(item.createdAt);
								return new Date(dateWithTime.getFullYear(), dateWithTime.getMonth(), dateWithTime.getDate());
							}()),
							copyright: item.copyright.match("^Copyright ") ? item.copyright.substring(10) : item.copyright,
							license: item.license,
							updatedAt: (function() {
								var dateWithTime = new Date(item.updatedAt);
								return new Date(dateWithTime.getFullYear(), dateWithTime.getMonth(), dateWithTime.getDate());
							}()),
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
				paginationPageSizes: [10, 24, 50, 100, 1000],
				paginationPageSize: 100,
				enableFiltering: true,
				columnDefs: [
					{ field: 'bookshelf', displayName: 'Bookshelf', width: '*', minWidth: 15, enableCellEdit: false, filter: { condition: uiGridConstants.filter.CONTAINS } },
					{ field: 'title', displayName: 'Title', width: '***', minWidth: 15, enableCellEdit: false, filter: { condition: uiGridConstants.filter.CONTAINS } },
					{ field: 'languages', displayName: 'Languages', width: '*', minWidth: 15/*, cellTooltip: true*/, enableCellEdit: false, filter: { condition: uiGridConstants.filter.CONTAINS } },
					{ field: 'tags', displayName: 'Tags', width: '*', minWidth: 15/*, cellTooltip: true*/, enableCellEdit: false, filter: { condition: uiGridConstants.filter.CONTAINS } },
					{ field: 'copyright', displayName: 'Copyright', width: '*', minWidth: 15, enableCellEdit: false, filter: { condition: uiGridConstants.filter.CONTAINS } },
					{ field: 'license', displayName: 'License', width: '*', minWidth: 15, maxWidth: 90, enableCellEdit: false, filter: { condition: uiGridConstants.filter.CONTAINS } },
					{ field: 'inCirculation', displayName: 'In Circulation', width: 100, minWidth: 5, editableCellTemplate: 'ui-grid/dropdownEditor', enableCellEdit: true, enableCellEditOnFocus: true, editDropdownValueLabel: 'show', editDropdownOptionsArray: [
						{ id: 'yes', show: 'yes' },
						{ id: 'no', show: 'no' }
					] },
					{ field: 'librarianNote', displayName: 'Notes', width: '**', minWidth: 15, enableCellEdit: true, enableCellEditOnFocus: true, filter: { condition: uiGridConstants.filter.CONTAINS } },
					{ field: 'createdAt', displayName: 'Created', width: '*', minWidth: 15, maxWidth: 90, enableCellEdit: false, cellFilter: 'date: "MM/dd/yyyy"', type: 'date',
						filters: [
						{
							condition: uiGridConstants.filter.GREATER_THAN_OR_EQUAL,
							flags: { date: true },
							placeholder: ' >='
						},
						{
							condition: uiGridConstants.filter.LESS_THAN_OR_EQUAL,
							flags: { date: true },
							placeholder: ' <='
						}
					] },
					{ field: 'updatedAt', displayName: 'Modified', width: '*', minWidth: 15, maxWidth: 90, enableCellEdit: false, cellFilter: 'date: "MM/dd/yyyy"', type: 'date',
						filters: [
						{
							condition: uiGridConstants.filter.GREATER_THAN_OR_EQUAL,
							flags: { date: true },
							placeholder: ' >='
						},
						{
							condition: uiGridConstants.filter.LESS_THAN_OR_EQUAL,
							flags: { date: true },
							placeholder: ' <='
						}
					] },
					{ field: 'pageCount', displayName: 'Pages', width: '*', minWidth: 15, maxWidth: 60, enableCellEdit: false,
						filters: [
						{
							condition: uiGridConstants.filter.GREATER_THAN_OR_EQUAL,
							placeholder: ' >='
						},
						{
							condition: uiGridConstants.filter.LESS_THAN_OR_EQUAL,
							placeholder: ' <='
						}
					] }]
			};


			$scope.gridOptions.onRegisterApi = function(gridApi){
				//set gridApi on scope
				$scope.gridApi = gridApi;
				gridApi.edit.on.afterCellEdit($scope,function(rowEntity, colDef, newValue, oldValue) {
					if(colDef.field == 'inCirculation') {
						var inCirculation = true;
						if(newValue == 'no') {
							inCirculation = false;
						}
						bookService.modifyBookField(rowEntity, colDef.field, inCirculation);
					} else {
						bookService.modifyBookField(rowEntity, colDef.field, newValue);
					}
				});
			};
			//gridApi.edit.on.afterCellEdit(scope,function(rowEntity, colDef){ alert("edited!");});
		}]);
} ()); // end wrap-everything function