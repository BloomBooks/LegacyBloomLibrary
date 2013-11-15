'use strict';

angular.module('BloomLibraryApp.browse')
	.controller('BrowseCtrl', ['$scope', '$dialog', '$timeout', 'bookService', 
	                           function ($scope, $dialog, $timeout, bookService) {

	 bookService.getAllBooksCount().then(function (count) {
        $scope.currentPage = 1;
		$scope.bookCount = count;
        $scope.setPage = function () { };
      });

	  // browse.tpl.html listview div configures this to be called as pageItemsFunction when user chooses a page.
	  // Todo: should get Filtered book range.
	  $scope.getBookRange = function (first, count) {
		  bookService.getBookRange(first, count).then(function(result) {
			  $scope.visibleBooks = result;
		  })
	  };

	  $scope.getFiteredBookCount = function(searchString)
	  {
		  bookService.getFiteredBookCount(searchString).then(function(result) {
			  $scope.filteredBookCount = result;
		  })
	  }

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
		  $scope.getFiteredBookCount($scope.searchText);
      }
		// This may be a helpful starting point for setting up filtering
//      $scope.matchingBooks = function (book) {
//          if (!$scope.searchText)
//              return true;
//          var s = $scope.searchText.toLowerCase();
//          var titleMatch = book.volumeInfo.title.toLowerCase().indexOf(s) != -1;
//          var tagMatch = _.contains(book.Tags, s);
//          var x = book.volumeInfo.authors.join().toLowerCase();
//          var authorMatch = book.volumeInfo.authors.join().toLowerCase().indexOf(s) > -1;
//          //$timeout(function () { $scope.updatePageControl()}, 1000);
//          return titleMatch | tagMatch | authorMatch;
//      };
  }]);

