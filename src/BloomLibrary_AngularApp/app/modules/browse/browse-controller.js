'use strict';

angular.module('BloomLibraryApp.browse')
	.controller('BrowseCtrl', ['$scope', '$dialog', '$timeout', 'bookService', 
	                           function ($scope, $dialog, $timeout, bookService) {

	 bookService.getAllBooks().then(function (allBooks) {
	    $scope.numPerPage = 8;
        $scope.noOfPages = Math.ceil(allBooks.length / $scope.numPerPage);
        $scope.currentPage = 1;
        $scope.setPage = function () { };
        $scope.books = allBooks;
      });

      $scope.visibleBooks = [];
      $scope.queryBooks = function() {
          bookService.getAllBooks().then(function (result) {
              $scope.books = result.results;
          });
      }; // TODO: Think about combination of filters with listview pages: 10 items per page, but filtered?

	  $scope.foo = function(paramOne, paramTwo) {
		  return paramOne + paramTwo;
	  }
      
        
      //$scope.updatePageControl = function () {
      //    $timeout(function ()   	bloomService.getAllBooks().then(function (allBooks) {
      $scope.numPerPage = 8;
//      $scope.noOfPages = Math.ceil(allBooks.length / $scope.numPerPage);
      //wait for 'filteredBooks' to be changed
      //        $scope.noOfPages = Math.ceil($scope.filteredBooks.length / $scope.numPerPage);
      //        $scope.currentPage = 1;
      //        $scope.setPage = function (pageNo) {
      //            $scope.currentPage = pageNo;
      //        };
      //    }, 10);
      //};
      $scope.updatePageControl = function () {
          $scope.noOfPages = Math.ceil($scope.filteredBooks.length / $scope.numPerPage);
          $scope.currentPage = 1;
          $scope.setPage = function (pageNo) {
              $scope.currentPage = pageNo;
          };

      }

      $scope.SearchNow = function () {
          $scope.searchText = $scope.searchTextRaw;
      }
      $scope.matchingBooks = function (book) {
          if (!$scope.searchText)
              return true;
          var s = $scope.searchText.toLowerCase();
          var titleMatch = book.volumeInfo.title.toLowerCase().indexOf(s) != -1;
          var tagMatch = _.contains(book.Tags, s);
          var x = book.volumeInfo.authors.join().toLowerCase();
          var authorMatch = book.volumeInfo.authors.join().toLowerCase().indexOf(s) > -1;
          //$timeout(function () { $scope.updatePageControl()}, 1000);
          return titleMatch | tagMatch | authorMatch;
      };
  }]);

