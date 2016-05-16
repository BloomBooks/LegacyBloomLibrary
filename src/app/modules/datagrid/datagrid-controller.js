(function () { // to wrap use strict
	'use strict';

	//This variable allows both the onExit function of the stateProvider and the controller to access the resizeGrid function
	var resizeGrid;

	var tagList = {};

	// Model declaration for the data grid view (url /datagrid)
	angular.module('BloomLibraryApp.datagrid', ['ui.router', 'restangular', 'ui.grid', 'ui.grid.pagination', 'ui.grid.resizeColumns', 'ui.grid.edit', 'ui.grid.cellNav', 'ui.grid.autoResize', 'ngTagsInput'])//, 'BloomLibraryApp.detail'])
	.config(['$stateProvider', function config($stateProvider) {

		$stateProvider.state('datagrid', {
			parent: 'requireLoginResolution',
			url: "/datagrid",
			templateUrl: 'modules/datagrid/datagrid.tpl.html',
			controller: 'DataGridCtrl',
			title: 'Book Library',
			onExit: function() {
				window.removeEventListener("resize", resizeGrid);
			}
		});
	} ]);

	angular.module('BloomLibraryApp.datagrid')
	.service('autoCompleteTags', ['tagService', '$q', function(tagService, $q) {
		//Use as cache for tags if/when datagrid uses server-side paging
		//var tags = tagService.getTags();

		this.getTags = function(query) {
			var deferred = $q.defer();
			var matches = [];
			//Match beginning
			var firstRegex = new RegExp('^' + query, 'i');
			//Match word starts
			var wordRegex = new RegExp('\\W' + query, 'i');
			//Match camel case
			var capQuery = query.charAt(0).toUpperCase() + query.substr(1, query.length - 1);
			var camelRegex = new RegExp('[a-z]' + capQuery);

			//This should be replaced by the version below if/when datagrid uses server-side paging
			for(var i in tagList) {
				if(firstRegex.test(i) || wordRegex.test(i) || camelRegex.test(i)) {
					matches.push({"text": i});
				}
			}

			//This is the real version to use when datagrid uses sever-side paging
//			for(var i = 0; i < tags.length; i++) {
//				if(firstRegex.test(tags[i]) || wordRegex.test(tags[i])) {
//					matches.push({"text": tags[i]});
//				}
//			}

			deferred.resolve(matches);

			return deferred.promise;
		};
	} ]);

	// Controller for the data grid view (url /datagrid)
	angular.module('BloomLibraryApp.datagrid')
	.controller('DataGridCtrl', ['$scope', '$timeout', '$q', 'bookService', '$state', '$stateParams', '$location', 'uiGridConstants', 'autoCompleteTags', 'authService', '$modal',
		function ($scope, $timeout, $q, bookService, $state, $stateParams, $location, uiGridConstants, autoCompleteTags, authService, $modal) {
			resizeGrid = function() {
				var gridContainer = document.getElementsByClassName("gridStyle")[0];
				var footer = document.getElementsByClassName("site-footer")[0];

				gridContainer.style.height = (window.innerHeight - gridContainer.offsetTop - footer.offsetHeight) + "px";
			};

			window.addEventListener("resize", resizeGrid);

			$scope.autoCompleteBook = function(query, rowBook) {
				var deferred = $q.defer();
				var regex = new RegExp(query, 'i');
				var matches = $scope.booksData.filter(function(book) {
					for(var prop in book) {
						if(regex.test(book[prop]) && book != rowBook) {
							return true;
						}
					}
					return false;
				});
				deferred.resolve(matches);
				return deferred.promise;
			};

			$scope.onRelatedBookAdded = function(addedBook, rowBook) {
				//Since, it might be possible for the user to click a second book
				//faster than the server can process the request, I'm using an IIFE
				bookService.getRelatedBooks(addedBook.objectId).then((function() {
					var newBook = addedBook;
					var currentBook = rowBook;
					return function (results) {
						if (results.length > 0) {
							var relatedBooks = results[0].books.map(function (item) {
								return $scope.booksCache[item.objectId];//getArrayMemberByProperty($scope.reducedBooksData, 'objectId', item.objectId);
							});
							$scope.showConfirmRelateDialog(addedBook, relatedBooks, rowBook);
						}
						else {
							$scope.saveBookRowRelationship(rowBook);
						}
					};
				}()));
			};

			function addBooksRelatedTo(id, rowBook) {
				var isNewRelationship = rowBook.relBooks.length === 0;
				return bookService.getRelatedBooks(id).then(function (results) {
					if (results.length > 0) {
						var relatedBooks = results[0].books;
						for (var i = 0; i < relatedBooks.length; i++) {
							//Don't add this book
							if(id != relatedBooks[i].objectId) {
								rowBook.relBooks.push($scope.booksCache[relatedBooks[i].objectId]);
							}
						}
					}
					if(!isNewRelationship) {
						$scope.saveBookRowRelationship(rowBook);
					}
				}, function(error) { console.log("error with addBooksRelatedTo" + error); });
			}

			$scope.showConfirmRelateDialog = function (addedBook, relatedBooks, rowBook) {
				var confirmModalInstance = $modal.open({
					templateUrl: 'modules/datagrid/confirmRelateDialog.tpl.html',
					controller: 'confirmRelateDialog',
					// this defines the value of 'book' as something that is injected into the BloomLibraryApp.confirmRelateDialog's
					// controller, thus giving it access to the book whose related books we want details about.
					resolve: {book: function() { return addedBook; }, relatedBooks: function() {return relatedBooks;}}
				});

				confirmModalInstance.result.then(function(result) {
					if (result) {
						addBooksRelatedTo(addedBook.objectId, rowBook);
					}
					else {
						rowBook.relBooks.length--;
					}
				});
			};

			$scope.saveBookRowRelationship = function(rowBook) {
				bookService.relateBooksById(rowBook.relBooks.concat(rowBook).sort(function (a, b) {
					return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
				}).map(function (item) {
					return item.objectId;
				}));
			};

			$scope.getBooks = function() {
				var first = 0;
				//We want all books, but there is a limit at some point
				var count = 1000;

				bookService.getFilteredBookRange(first, count, '', '', '', '', true, '', '', true).then(function (result) {
					$scope.booksCache = {};
					// Here for each book $scope.booksCache[objectId] is set to an object that is a more user-friendly
					// representation of the book data, suitable for the grid; and $scope.booksData becomes the array
					// of these objects.
					$scope.booksData = result.map(function (item) {
						$scope.booksCache[item.objectId] = {
							//Hidden id
							objectId: item.objectId,
							inCirculation: item.inCirculation !== false ? 'yes' : 'no',
							title: item.title,
							createdAt: (function () {
								var dateWithTime = new Date(item.createdAt);
								return new Date(dateWithTime.getFullYear(), dateWithTime.getMonth(), dateWithTime.getDate());
							}()),
							copyright: item.copyright.match("^Copyright ") ? item.copyright.substring(10) : item.copyright,
							downloadCount: item.downloadCount || 0,
							imgUrl: item.baseUrl + "thumbnail-70.png",
							license: item.license,
							updatedAt: (function () {
								var dateWithTime = new Date(item.updatedAt);
								return new Date(dateWithTime.getFullYear(), dateWithTime.getMonth(), dateWithTime.getDate());
							}()),
							pageCount: item.pageCount,
							bookshelf: item.bookshelf,
							tags: item.tags ? item.tags.map(function(item) {
								//Put into tagList
								//Remove if/when datagrid is moved to server-side paging
								if(!(item in tagList)) {
									tagList[item] = true;
								}

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
							}).join(', ') : '',
							librarianNote: item.librarianNote,
							relBooks: [], // filled in later (see next then)
							uploader: item.uploader.email,
							text: item.objectId
						};

						return $scope.booksCache[item.objectId]; // output of map for current book, one item in $scope.booksData
					});

					return bookService.getAllBookRelationships(); // a promise, which when resolved fires up the next 'then'
				}).then(function(results) {
					// here results is the resolution of whatever the function passed to the first 'then' returned,
					// hence it is the results of bookService.getAllBookRelationships().
					// This function now fills in the relBooks fields for the objects created in the first 'then'.
					var currentBook;
					function doesNotEqualCurrentBook(item) {
						return item != currentBook;
					}

					function getBooksCacheBook(parseBook) {
						return $scope.booksCache[parseBook.objectId];
					}

					for(var iRel = 0; iRel < results.length; iRel++) {
						var currentRel = results[iRel].books.map(getBooksCacheBook);
						var currentRelBooks = [];
						for(var iBook = 0; iBook < currentRel.length; iBook++) {
							var currentBookId = currentRel[iBook].objectId;
							currentBook = $scope.booksCache[currentBookId];
							currentBook.relBooks = currentRel.filter(doesNotEqualCurrentBook);
						}
					}
				});

			};

			$scope.tagList = {};

			$scope.autoCompleteTags = function($query) {
				return autoCompleteTags.getTags($query);
				//var $q;
			};

			$scope.updateTags = function(row) {
				var newTags = row.entity.tags.map(function(item) {
					return item.text;
				});
				bookService.modifyBookField(row.entity, "tags", newTags, "datagrid");

				//Put brand-new tags into tagList
				for(var i = 0; i < newTags.length; i++) {
					if(!(newTags[i] in tagList)) {
						tagList[newTags[i]] = true;
					}
				}
			};

			$scope.getBooks();

			// A custom column filter which allows the user to filter by more than one tag at the same time
			// In this case, cellValue is an array of tag objects (which display the "text" property)
			var filterTags = function(searchTerm, cellValue) {
				var searchWords = searchTerm.match(/[\w]+/g);
				for(var i = 0; i < searchWords.length; i++) {
					var regex = new RegExp(searchWords[i], 'i');
					var wordMatches = false;
					for(var j = 0; j < cellValue.length; j++) {
						if(regex.test(cellValue[j].text)) {
							wordMatches = true;
						}
					}
					if(!wordMatches) {
						return false;
					}
				}
				return true;
			};

			$scope.getParentByClassName = function(element, className) {
				var currentParent = element;
				for(var iLevel = 0; iLevel < 10; iLevel++) {
					currentParent = currentParent.parentElement;
					for(var iClass = 0; iClass < currentParent.classList.length; iClass++) {
						if(currentParent.classList.item(iClass) == className) {
							return currentParent;
						}
					}
				}
			};

			$scope.popOut = function(event) {
				var container = $scope.getParentByClassName(event.target, 'ui-grid-cell');//event.target.parentElement;
				container.style.overflow = "visible";
				container.style.position = "relative";
				container.style.zIndex = "3000";
			};

			$scope.popIn = function(event) {
				var container = $scope.getParentByClassName(event.target, 'ui-grid-cell');//event.target.parentElement;
				container.style.overflow = "hidden";
				container.style.position = "static";
				container.style.zIndex = "auto";
			};

			$scope.toggleReadOnlyPopOut = function(event) {
				var target = $scope.getParentByClassName(event.target, 'grid-list');
				if (target.style.backgroundColor == "lightyellow") {
					target.style.backgroundColor = "";
					$scope.popIn(event);
				}
				else {
					target.style.backgroundColor = "lightyellow";
					$scope.popOut(event);
				}
			};

			$scope.isUserAdministrator = authService.isUserAdministrator();

			// Choose the appropriate way of displaying the tags and related books lists.
			// If the user is an administrator we use a tags-input directive which supports editing by type-ahead.
			// (The related books one is defined in a script in datagrid.tpl.html.)
			// If not, we just display a list of the items.
			if ($scope.isUserAdministrator) {
				$scope.tagsTemplate = '<tags-input ng-model="row.entity.tags" ng-focus="grid.appScope.popOut($event)" ng-blur="grid.appScope.popIn($event)" class="tagsField" replace-spaces-with-dashes="false" on-tag-added="grid.appScope.updateTags(row)" on-tag-removed="grid.appScope.updateTags(row)" style="margin-top:-5px"><auto-complete source="grid.appScope.autoCompleteTags($query)" min-length="1" max-results-to-show="100" select-first-match="false"></auto-complete></tags-input>';
				$scope.relatedBooksTemplate = 'related-books-template';
			}
			else {
				$scope.tagsTemplate = '<div class = "grid-list" ng-click="grid.appScope.toggleReadOnlyPopOut($event)"><span class="grid-list-item" ng-repeat="tag in row.entity.tags">{{tag.text}} </span></div>';
				$scope.relatedBooksTemplate = '<div class = "grid-list" ng-click="grid.appScope.toggleReadOnlyPopOut($event)"><span tooltip-html="true" tooltip-placement="bottom" tooltip-html-unsafe="Uploader: {{book.uploader}}<br>Languages: {{book.languages}}<br>{{book.copyright}}" class="grid-list-item" ng-repeat="book in row.entity.relBooks">{{book.title}} </span></div>';
			}

			$scope.gridOptions = {
				data: 'booksData',
				paginationPageSizes: [10, 24, 50, 100, 1000],
				paginationPageSize: 100,
				enableGridMenu: true,
				gridMenuCustomItems: [
					{
						title: 'Filter to Incoming',
						action: function ($event) {
							this.grid.clearAllFilters();
							var colDef = this.grid.getColDef('tags');
							colDef.filter.term = "system:Incoming";
						},
						order: 1
					}
				],
				enableFiltering: true,
				// a bit more than one row of buttons in tags and related books, so the user can see when there are more.
				// The package we are using for grids does not support variable-height rows, so we have made those
				// cells expand when clicked in.
				rowHeight: 50,
				columnDefs: [
					{ field: 'bookshelf', displayName: 'Bookshelf', width: '*', minWidth: 15, enableCellEdit: false, filter: { condition: uiGridConstants.filter.CONTAINS } },
					{ field: 'title', displayName: 'Title', cellTemplate: '<div class="ui-grid-cell-contents"><a target="_blank" ui-sref="browse.detail({bookId: row.entity.objectId})">{{row.entity.title}}</a></div>', width: '***', minWidth: 15, enableCellEdit: false, filter: { condition: uiGridConstants.filter.CONTAINS }, enableHiding: false, sort: { direction: uiGridConstants.ASC } },
					{ field: 'languages', displayName: 'Languages', width: '*', minWidth: 15, enableCellEdit: false, filter: { condition: uiGridConstants.filter.CONTAINS } },
					{ field: 'tags', displayName: 'Tags', cellTemplate: $scope.tagsTemplate, width: '***', minWidth: 15, enableCellEdit: false, allowCellFocus: false, enableSorting: false, cellFilter: "tagFilter", filter: { condition: filterTags } },
					{ field: 'copyright', displayName: 'Copyright', width: '*', minWidth: 15, enableCellEdit: false, filter: { condition: uiGridConstants.filter.CONTAINS } },
					{ field: 'license', displayName: 'License', width: '*', minWidth: 15, maxWidth: 90, enableCellEdit: false, filter: { condition: uiGridConstants.filter.CONTAINS } },
					{ field: 'inCirculation', displayName: 'In Circulation', width: 100, minWidth: 5, editableCellTemplate: 'ui-grid/dropdownEditor', enableCellEdit: $scope.isUserAdministrator, enableCellEditOnFocus: true, editDropdownValueLabel: 'show', editDropdownOptionsArray: [
						{ id: 'yes', show: 'yes' },
						{ id: 'no', show: 'no' }
					] },
					{ field: 'librarianNote', displayName: 'Notes', width: '**', minWidth: 15, enableCellEdit: $scope.isUserAdministrator, enableCellEditOnFocus: $scope.isUserAdministrator, filter: { condition: uiGridConstants.filter.CONTAINS } },
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
					},
					{ field: 'downloadCount', displayName: 'Downloads', width: '*', minWidth: 15, maxWidth: 60, enableCellEdit: false,
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
					},
					{ field: 'relateBooks', displayName: 'Related Books', cellTemplate: $scope.relatedBooksTemplate, width: '***', minWidth: 300, maxWidth: 700, enableCellEdit: false, allowCellFocus: false }
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
						bookService.modifyBookField(rowEntity, colDef.field, inCirculation, "datagrid");
					} else {
						bookService.modifyBookField(rowEntity, colDef.field, newValue, "datagrid");
					}
				});
			};
			//gridApi.edit.on.afterCellEdit(scope,function(rowEntity, colDef){ alert("edited!");});
		}]);
} ()); // end wrap-everything function