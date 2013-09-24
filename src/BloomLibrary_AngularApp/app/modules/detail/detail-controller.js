'use strict';

angular.module('BloomLibraryApp.detail').controller('DetailCtrl', ['$scope', '$state', '$stateParams', 'Restangular', 'dialog', function ($scope, $state, $stateParams, Restangular, dialog) {

      /* REVIEW I had wanted to just grab the current book from $scope, but... didn't work. So now I look up the book. Probably better for random access to a book from a URL, anyhow */

      Restangular.one('Books').getList()
        .then(function (books) {
            $scope.book = books[$stateParams.bookId];
        })

      $scope.close = function () {
          dialog.close();
      };

      $scope.preview = function ()
      {
          $state.go('.preview');
      }

      $scope.dowloand = function () {
          alert('download');
      }
  }]);
