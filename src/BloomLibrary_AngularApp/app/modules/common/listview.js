
angular.module('palaso.ui.listview', ['ui.bootstrap'])
  // Typeahead
  .directive('listview', ["$timeout", function($timeout) {
		return {
			restrict : 'EA',
			transclude : true,
			replace : true,
			template : '<div class="listview" ng-hide="hideIfEmpty && itemCount == 0"><div ng-transclude></div><div class="paginationblock"><pagination boundary-links="true" num-pages="noOfPages" current-page="currentPage" previous-text="&lsaquo;" next-text="&rsaquo;" first-text="&laquo;" last-text="&raquo;"></pagination><div class="right pagination">Items per page: <select ng-model="itemsPerPage"><option value="3">3</option><option value="5" selected>5</option><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></div></div></div>',
			scope : {
				select : "&",
				hideIfEmpty: "@",
				itemCount: "=",
				pageItemsFunction: "&" // e.g. html has pageItemsFunction="getBookRange(first, itemsPerPage)"; sets list to show in view.
			},
			controller: ["$scope", function($scope) {
				$scope.noOfPages = 3;  // TODO: calculate this automatically
				$scope.currentPage = 1;
				$scope.maxSize = 5;
				$scope.itemsPerPage = 5;  // This should match the default value for the selector above
				
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
					} else {
						// Default to page 1 if undefined
						sliceStart = 0;
					}
					$scope.pageItemsFunction({first:sliceStart, itemsPerPage:$scope.itemsPerPage});
				}
				this.updatePages = function() {
					$scope.noOfPages = Math.ceil($scope.itemCount / $scope.itemsPerPage);
					if ($scope.currentPage > $scope.noOfPages) {
						// This can happen if items have been deleted, for example
						$scope.currentPage = $scope.noOfPages;
					}
					if ($scope.currentPage < 1) {
						$scope.currentPage = 1;
					}
				};
				this.query = function() {
					this.updateVisibleItems();
//					$scope.search({
//						term : $scope.term
//					});
				};
			}],
			link : function(scope, element, attrs, controller) {
				scope.$watch('currentPage', function() {
					controller.updateVisibleItems();
				});
				scope.$watch('itemsPerPage', function() {
					controller.updatePages();
					controller.updateVisibleItems();
				});
				scope.$watch('itemCount', function() {
					controller.updatePages();
					controller.updateVisibleItems();
				}, true);
				controller.query();
			}
		};
  }])
  ;
