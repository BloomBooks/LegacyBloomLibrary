'use strict';

angular.module('BloomLibraryApp.detail').controller('DetailCtrl', ['$scope', '$state', '$stateParams', 'dialog', 'bookService',

    function ($scope, $state, $stateParams, dialog, bookService) {
        //get the book for which we're going to show the details
        bookService.getBookById($stateParams.bookId).then( function(book){
            $scope.book = book;
        });

      $scope.close = function () {
          dialog.close();
      };

      $scope.dowloand = function () {
          alert('download');
      }
  }]);
