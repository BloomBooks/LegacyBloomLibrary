'use strict';

angular.module('BloomLibraryApp.detail').controller('DetailCtrl', ['$scope', '$state', '$stateParams', 'dialog', 'bookService', '$location',

	function ($scope, $state, $stateParams, dialog, bookService, $location) {
        //get the book for which we're going to show the details
        bookService.getBookById($stateParams.bookId).then( function(book){
            $scope.book = book;
        });

      $scope.close = function () {
          dialog.close();
      };

	  // This is so the dialog closes when the back button in the browser is used.
	  $scope.$on('$locationChangeSuccess', function(event) {
		  dialog.close();
	  });

      $scope.dowloand = function () {
          alert('download');
      }
  }]);
