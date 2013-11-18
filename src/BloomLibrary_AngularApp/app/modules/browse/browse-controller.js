'use strict';

angular.module('BloomLibraryApp.browse')
	.controller('BrowseCtrl', ['$scope', '$dialog', '$timeout', 'bookService', '$state', '$stateParams', '$location',
	                           function ($scope, $dialog, $timeout, bookService, $state, $stateParams, $location) {

	   $scope.searchText = $stateParams["search"];
	   $scope.searchTextRaw = $scope.searchText;
	   bookService.getFilteredBooksCount($scope.searchText).then(function (count) {
		   $scope.currentPage = 1;
		   $scope.bookCount = count;
		   $scope.setPage = function () { };
		   $scope.filteredBooksCount = count;
		   $scope.initialized = true;
	   });

	  // browse.tpl.html listview div configures this to be called as pageItemsFunction when user chooses a page.
	  // Todo: should get Filtered book range.
	  $scope.getBookRange = function (first, count) {
		  bookService.getFilteredBookRange(first, count, $scope.searchText).then(function(result) {
			  $scope.visibleBooks = result;
		  })
	  };

	  $scope.foo = function(paramOne, paramTwo) {
		  return paramOne + paramTwo;
	  }
      

      $scope.updatePageControl = function () {
          $scope.currentPage = 1;
          $scope.setPage = function (pageNo) {
              $scope.currentPage = pageNo;
          };

      }

      $scope.SearchNow = function () {
		  // Todo: this needs to run a query on the real database and update bookCount
		  // and do something to make the listview invoke getBookRange (even if the bookCount
		  // does not change).
          $scope.searchText = $scope.searchTextRaw;
		  $state.go('.', {search: $scope.searchText});
      }
  }]);

