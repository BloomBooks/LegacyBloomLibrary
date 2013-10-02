'use strict';

angular.module('BloomLibraryApp.browse')
	.controller('BrowseCtrl', ['$scope', '$dialog', '$timeout', 'bloomService', 
	                           function ($scope, $dialog, $timeout, bloomService) {

      bloomService.books_list().then(function (result) {
    	var allBooks = result.results;
      	console.log(result.results);
        $scope.numPerPage = 8;
        $scope.noOfPages = Math.ceil(allBooks.length / $scope.numPerPage);
        $scope.currentPage = 1;
        $scope.setPage = function () { };
        $scope.books = allBooks;
      });
      
        
      //$scope.updatePageControl = function () {
      //    $timeout(function ()   	bloomService.books_list().then(function (allBooks) {
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
  //    $scope.$watch($scope.filteredBooks, $scope.updatePageControl(), true);
      $scope.x = function () { alert('x'); }

      $scope.SearchNow = function () {
          $scope.searchText = $scope.searchTextRaw;
      }
      $scope.matchingBooks = function (book) {
          if (!$scope.searchText)
              return true;
          var titleMatch = book.Title.toLowerCase().indexOf($scope.searchText.toLowerCase()) != -1;
          var tagMatch = _.contains(book.Tags, $scope.searchText.toLowerCase());

          $timeout(function () { $scope.updatePageControl()}, 1000);
          return titleMatch | tagMatch;
      };
  }]);
