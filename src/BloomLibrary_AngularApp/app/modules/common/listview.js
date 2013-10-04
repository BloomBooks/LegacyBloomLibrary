
angular.module('palaso.ui.listview', ['ui.bootstrap'])
  // Typeahead
  .directive('listview', ["$timeout", "$filter", function($timeout, $filter) {
		return {
			restrict : 'EA',
			transclude : true,
			replace : true,
			template : '<div class="listview" ng-hide="hideIfEmpty && items.length == 0"><div ng-transclude></div><div class="paginationblock"><pagination boundary-links="true" num-pages="noOfPages" current-page="currentPage" previous-text="&lsaquo;" next-text="&rsaquo;" first-text="&laquo;" last-text="&raquo;"></pagination><div class="right pagination">Items per page: <select ng-model="itemsPerPage"><option value="3">3</option><option value="5" selected>5</option><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></div></div></div>',
			scope : {
				search : "&",
				select : "&",
				items: "=",
				hideIfEmpty: "@",
				visibleItems: "=",
				filterSearchString: "=",
				filter: "=",
				filterComparator: "&",
			},
			controller: ["$scope", function($scope) {
				$scope.noOfPages = 3;  // TODO: calculate this automatically
				$scope.currentPage = 1;
				$scope.maxSize = 5;
				$scope.itemsPerPage = 5;  // This should match the default value for the selector above
				$scope.items = [];
				$scope.filteredItems = [];
				
				this.activate = function(item) {
					$scope.active = item;
					$scope.select({
						item : item
					});
				};
				this.activateNextItem = function() {
					var index = $scope.items.indexOf($scope.active);
					this.activate($scope.items[(index + 1) % $scope.items.length]);
				};
				this.activatePreviousItem = function() {
					var index = $scope.items.indexOf($scope.active);
					this.activate($scope.items[index === 0 ? $scope.items.length - 1 : index - 1]);
				};
				this.isActive = function(item) {
					return $scope.active === item;
				};
				this.selectActive = function() {
					this.select($scope.active);
				};
				this.updateVisibleItems = function() {
					var sliceStart;
					var sliceEnd;
					if ($scope.currentPage) {
						sliceStart = ($scope.currentPage-1) * $scope.itemsPerPage; // currentPage is 1-based
						sliceEnd = $scope.currentPage * $scope.itemsPerPage;
					} else {
						// Default to page 1 if undefined
						sliceStart = 0;
						sliceEnd = $scope.itemsPerPage;
					}
					console.log('Selecting items from', sliceStart, 'to', sliceEnd);
					$scope.visibleItems = $scope.filteredItems.slice(sliceStart, sliceEnd);
				}
				this.filterPages = function() {
					console.log('LOOK HERE!');
					console.log('filter search string is:', $scope.filterSearchString);
					console.log(typeof($scope.filter));
					if (!$scope.filterSearchString) {
						$scope.filteredItems = $scope.items;
					} else if ($scope.hasFilter) {
						$scope.filteredItems = $filter('filter')(
							$scope.items,
							$scope.filter,
							$scope.comparatorFunc
						);
					} else {
						$scope.filteredItems = $scope.items;
					}
					console.log($scope.filteredItems.length, 'items left after filtering:');
					console.log($scope.filteredItems);
				};
				this.updatePages = function() {
					$scope.noOfPages = Math.ceil($scope.filteredItems.length / $scope.itemsPerPage);
					if ($scope.currentPage > $scope.noOfPages) {
						// This can happen if items have been deleted, for example
						$scope.currentPage = $scope.noOfPages;
					}
					if ($scope.currentPage < 1) {
						$scope.currentPage = 1;
					}
				};
				this.query = function() {
					console.log('LOOK HERE ALSO!');
					console.log(typeof($scope.filter));
					console.log($scope.filter);
					if ($scope.hasFilterComparator) {
						$scope.comparatorFunc = $scope.comparatorFunc();
						// Yes, this is different from how filter is treated.
						// The filter is a name that Angular retrieves from
						// previously-registered filters (hence why we're
						// passing the *name* in the @filter attribute), but
						// the comparator func is an actual function that
						// needs to be passed through to Angular.
					} else {
						$scope.comparatorFunc = undefined;
					}
					$scope.search();
					this.filterPages();
					this.updatePages();
//					$scope.search({
//						term : $scope.term
//					});
				};
			}],
			link : function(scope, element, attrs, controller) {
				scope.hasFilter = ('filter' in attrs);
				scope.hasFilterComparator = ('filter-comparator' in attrs);
				scope.$watch('currentPage', function() {
					controller.updateVisibleItems();
				});
				scope.$watch('itemsPerPage', function() {
					controller.updatePages();
					controller.updateVisibleItems();
				});
				scope.$watch('items', function() {
					controller.filterPages();
					controller.updatePages();
					controller.updateVisibleItems();
				}, true);
				scope.$watch('filterSearchString', function() {
					controller.filterPages();
					controller.updatePages();
					controller.updateVisibleItems();
				});
				controller.query();
			}
		};
  }])
  ;
