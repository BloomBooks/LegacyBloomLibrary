
angular.module('palaso.ui.listview', ['ui.bootstrap'])
  // Typeahead
  .directive('listview', ["$timeout", function($timeout) {
		return {
			restrict : 'EA',
			transclude : true,
			replace : true,
			template : '<div>' // template must have one top-level element.
				+ '<div ng-transclude></div>' // pulls in the body of what we are wrapping the list function around, from the caller
				+ '<div class="pagination" ng-hide="noOfPages==1"><ul>' // The page index is a list inside a div (entirely hidden if only one page)
				+ '<li class="previous" ng-class="{disabled: currentPage == 1}"><a href ng-click="prevPage()">Prev</a></li>' // the previous page button
				+ '<li ng-repeat="n in pageButtons" ng-class="{active: n == currentPage}"	ng-click="setPage()">' // repeat this for all page buttons
				+ 	'<span ng-hide="n!= 0">...</span>' // ellipsis is shown for 0 in pageButtons array, inserted where there is a gap
				+	'<a href ng-hide="n==0" ng-bind="n">1</a>' // regular buttons appear when n is not zero. I don't know how the '1' becomes 'n'.
				+ '</li>' // end of the repeating li for items in pageButtons
				+ '<li class="next" ng-class="{disabled: currentPage == noOfPages}"><a href ng-click="nextPage()">Next</a></li>' // Next page button
				+ '</ul></div>' // ends page index list and div
				+ '<div class="pagination">Items per page: <select ng-model="itemsPerPage">' // items-per-page control
				+	'<option value="3">3</option><option value="5" selected>5</option><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option>' // the options
				+ '</select></div></div>', // wrap it up
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

				$scope.prevPage = function () {
					if ($scope.currentPage > 1) {
						$scope.currentPage--;
					}
				};

				$scope.nextPage = function () {
					if ($scope.currentPage < $scope.noOfPages) {
						$scope.currentPage++;
					}
				};

				$scope.setPage = function () {
					$scope.currentPage = this.n;
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

					// Update the pages index, which depends on currentPage.
					// Enhance: a separate function would be nicer, but it's tricky to call one
					// of these function objects from another.
					// pageButtons is an array, basically of the page numbers we will show.
					// Where there is a gap, we insert a zero, which activates the "..." in the html.
					$scope.pageButtons = new Array();
					$scope.pageButtons[0] = 1; // always show page 0.
					var j = 1;
					for (i = $scope.currentPage - 5; i <= $scope.currentPage + 5; i++) {
						if (i < 2 || i > $scope.noOfPages - 1) {
							continue; //nonexistent, or the first/last pages added elsewhere.
						}
						if ($scope.pageButtons[j - 1] != i - 1) {
							$scope.pageButtons[j] = 0; // gap in sequence, 0 produces ellipsis
							j++;
						}
						$scope.pageButtons[j] = i; // produces button for i.
						j++;
					}
					if ($scope.pageButtons[j - 1] < $scope.noOfPages) { // don't insert 1 twice if only one page
						if ($scope.pageButtons[j - 1] < $scope.noOfPages - 1) {
							$scope.pageButtons[j] = 0; // makes ellipsis if needed
							j++;
						}
						$scope.pageButtons[j] = $scope.noOfPages; // last page button
					}
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
