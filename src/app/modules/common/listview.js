
angular.module('palaso.ui.listview', ['ui.bootstrap'])
// Typeahead
	.directive('listview', ["$timeout", "$cookies", function ($timeout, $cookies) {
		return {
			restrict: 'EA',
			transclude: true,
			replace: true,
			templateUrl: 'modules/common/pagecontrol.tpl.html',
			scope: {
				select: "&",
				hideIfEmpty: "@",
				itemCount: "=",
				pageItemsFunction: "&" // e.g. html has pageItemsFunction="getBookRange(first, itemsPerPage)"; sets list to show in view.
			},
			controller: ["$scope", function ($scope) {
				$scope.noOfPages = 3;  // TODO: calculate this automatically
				$scope.currentPage = 1;
				$scope.maxSize = 5;
				$scope.itemsPerPage = 10;  // This should match the default value for the selector above
                var savedIpp = $cookies[$scope.pageCountTag];
                if (savedIpp && !isNaN(savedIpp)) {
                    $scope.itemsPerPage = Number(savedIpp);
                }

				this.activate = function (item) {
					$scope.active = item;
					$scope.select({
						item: item
					});
				};
				this.activateNextItem = function () {
					var index = $scope.items.indexOf($scope.active);
					this.activate($scope.items[(index + 1) % $scope.items.length]);
				};
				this.activatePreviousItem = function () {
					var index = $scope.items.indexOf($scope.active);
					this.activate($scope.items[index === 0 ? $scope.items.length - 1 : index - 1]);
				};
				this.isActive = function (item) {
					return $scope.active === item;
				};
				this.selectActive = function () {
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
				this.updateVisibleItems = function () {
					var sliceStart;
					var sliceEnd;
					if ($scope.currentPage) {
						sliceStart = ($scope.currentPage - 1) * $scope.itemsPerPage; // currentPage is 1-based
					} else {
						// Default to page 1 if undefined
						sliceStart = 0;
					}
					$scope.pageItemsFunction({ first: sliceStart, itemsPerPage: $scope.itemsPerPage });

					// Update the pages index, which depends on currentPage.
					// Enhance: a separate function would be nicer, but it's tricky to call one
					// of these function objects from another.
					// pageButtons is an array, basically of the page numbers we will show.
					// Where there is a gap, we insert a zero, which activates the "..." in the html.
					$scope.pageButtons = [];
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
				};
                this.updateItemsPerPage = function(ipp) {
                    $cookies[$scope.pageCountTag] = $scope.itemsPerPage;
                };
				this.updatePages = function () {
					$scope.noOfPages = Math.ceil($scope.itemCount / $scope.itemsPerPage);
					if ($scope.currentPage > $scope.noOfPages) {
						// This can happen if items have been deleted, for example
						$scope.currentPage = $scope.noOfPages;
					}
					if ($scope.currentPage < 1) {
						$scope.currentPage = 1;
					}
				};
				this.query = function () {
					this.updateVisibleItems();
					//					$scope.search({
					//						term : $scope.term
					//					});
				};
			} ],
			link: function (scope, element, attrs, controller) {
				scope.$watch('currentPage', function () {
					controller.updateVisibleItems();
				});
				scope.$watch('itemsPerPage', function () {
                    controller.updateItemsPerPage();
					controller.updatePages();
					controller.updateVisibleItems();
				});
				scope.$watch('itemCount', function () {
					controller.updatePages();
					controller.updateVisibleItems();
				}, true);
				controller.query();
			}
		};
	} ]);
