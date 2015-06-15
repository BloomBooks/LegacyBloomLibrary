(function () { // to wrap use strict
	'use strict';

	//This variable allows both the onExit function of the stateProvider and the controller to access the resizeGrid function
	var resizeGrid;

	// Model declaration for the data grid view (url #/datagrid)
	angular.module('BloomLibraryApp.datagrid', ['ui.router', 'restangular', 'ui.grid', 'ui.grid.pagination', 'ui.grid.resizeColumns', 'ui.grid.edit', 'ui.grid.cellNav', 'ui.grid.autoResize', 'ngTagsInput'])//, 'BloomLibraryApp.detail'])
	.config(['$stateProvider', function config($stateProvider) {

		$stateProvider.state('datagrid', {
			url: "/datagrid",
			templateUrl: 'modules/datagrid/datagrid.tpl.html',
			controller: 'DataGridCtrl',
			title: 'Book Library',
			onExit: function() {
				window.removeEventListener("resize", resizeGrid);
			}
		});
	} ]);

	// Controller for the data grid view (url #/datagrid)
	angular.module('BloomLibraryApp.datagrid')
	.controller('DataGridCtrl', ['$scope', '$timeout', 'bookService', '$state', '$stateParams', '$location', 'uiGridConstants',
		function ($scope, $timeout, bookService, $state, $stateParams, $location, uiGridConstants) {
			resizeGrid = function() {
				var gridContainer = document.getElementsByClassName("gridStyle")[0];
				var footer = document.getElementsByClassName("site-footer")[0];

				gridContainer.style.height = (window.innerHeight - gridContainer.offsetTop - footer.offsetHeight) + "px";
			};

			window.addEventListener("resize", resizeGrid);

			$scope.getBooks = function() {
				var first = 0;
				bookService.getFilteredBooksCount('', '', '', '', true).then(function (result) {
					var count = result;

					bookService.getFilteredBookRange(first, count, '', '', '', '', '', '', true).then(function (result) {
						$scope.booksData = result.map(function (item) {
							return {
								//Hidden id
								objectId: item.objectId,
								inCirculation: item.inCirculation !== false ? 'yes' : 'no',
								title: item.title,
								createdAt: (function () {
									var dateWithTime = new Date(item.createdAt);
									return new Date(dateWithTime.getFullYear(), dateWithTime.getMonth(), dateWithTime.getDate());
								}()),
								copyright: item.copyright.match("^Copyright ") ? item.copyright.substring(10) : item.copyright,
								license: item.license,
								updatedAt: (function () {
									var dateWithTime = new Date(item.updatedAt);
									return new Date(dateWithTime.getFullYear(), dateWithTime.getMonth(), dateWithTime.getDate());
								}()),
								pageCount: item.pageCount,
								bookshelf: item.bookshelf,
								tags: item.tags ? item.tags.map(function(item) {
									var output = {};
									output.text = item;
									return output;
								}) : '',
								languages: item.langPointers ? item.langPointers.map(function (item) {
									var output = '';
									output += item.name;
									if (item.englishName && item.name != item.englishName) {
										output += ' (' + item.englishName + ')';
									}
									return output;
								}).toString() : '',
								librarianNote: item.librarianNote
							};
						});
					});
				});
			};

			$scope.updateTags = function(row) {
				var newTags = row.entity.tags.map(function(item) {
					return item.text;
				});
				bookService.modifyBookField(row.entity, "tags", newTags);
			};

			$scope.getBooks();

			var filterTags = function(searchTerm, cellValue, row, column) {
				var regex = new RegExp(searchTerm, "i");
				for(var i = 0; i < cellValue.length; i++) {
					if(regex.test(cellValue[i].text)) {
						return true;
					}
				}
				return false;
			};

			$scope.gridOptions = {
				data: 'booksData',
				paginationPageSizes: [10, 24, 50, 100, 1000],
				paginationPageSize: 100,
				enableGridMenu: true,
				enableFiltering: true,
				rowHeight: 40,
				columnDefs: [
					{ field: 'bookshelf', displayName: 'Bookshelf', width: '*', minWidth: 15, enableCellEdit: false, filter: { condition: uiGridConstants.filter.CONTAINS } },
					{ field: 'title', displayName: 'Title', cellTemplate: '<div class="ui-grid-cell-contents"><a target="_blank" ui-sref="browse.detail({bookId: row.entity.objectId})">{{row.entity.title}}</a></div>', width: '***', minWidth: 15, enableCellEdit: false, filter: { condition: uiGridConstants.filter.CONTAINS }, enableHiding: false, sort: { direction: uiGridConstants.ASC } },
					{ field: 'languages', displayName: 'Languages', width: '*', minWidth: 15, enableCellEdit: false, filter: { condition: uiGridConstants.filter.CONTAINS } },
					{ field: 'tags', displayName: 'Tags', cellTemplate: '<tags-input ng-model="row.entity.tags" replace-spaces-with-dashes="false" on-tag-added="grid.appScope.updateTags(row)" style="margin-top:-5px"></tags-input>', width: '***', minWidth: 15, enableCellEdit: false, allowCellFocus: false, cellFilter: "tagFilter", filter: { condition: filterTags } },
					{ field: 'copyright', displayName: 'Copyright', width: '*', minWidth: 15, enableCellEdit: false, filter: { condition: uiGridConstants.filter.CONTAINS } },
					{ field: 'license', displayName: 'License', width: '*', minWidth: 15, maxWidth: 90, enableCellEdit: false, filter: { condition: uiGridConstants.filter.CONTAINS } },
					{ field: 'inCirculation', displayName: 'In Circulation', width: 100, minWidth: 5, editableCellTemplate: 'ui-grid/dropdownEditor', enableCellEdit: true, enableCellEditOnFocus: true, editDropdownValueLabel: 'show', editDropdownOptionsArray: [
						{ id: 'yes', show: 'yes' },
						{ id: 'no', show: 'no' }
					] },
					{ field: 'librarianNote', displayName: 'Notes', width: '**', minWidth: 15, enableCellEdit: true, enableCellEditOnFocus: true, filter: { condition: uiGridConstants.filter.CONTAINS } },
					{ field: 'createdAt', displayName: 'Created Date', width: '*', minWidth: 15, maxWidth: 90, enableCellEdit: false, cellFilter: 'date: "MM/dd/yyyy"', type: 'date',
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
						],
						visible: false
					},
					{ field: 'updatedAt', displayName: 'Modified Date', width: '*', minWidth: 15, maxWidth: 100, enableCellEdit: false, cellFilter: 'date: "MM/dd/yyyy"', type: 'date',
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
						],
						visible: false
					},
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
						],
						visible: false
					}
				]
			};


			$scope.gridOptions.onRegisterApi = function(gridApi){
				//Initialize grid vertical sizing
				resizeGrid();

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