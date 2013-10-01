'use strict';

angular.module('BloomLibraryApp.browse').controller('BrowseCtrl', function ($scope, Restangular, $dialog, $timeout
       //,$stateProvider //review
       ) {

     
      Restangular.all('classes/Books').getList().then(function (allBooks) {
        $scope.numPerPage = 8;
        $scope.noOfPages = Math.ceil(allBooks.length / $scope.numPerPage);
        $scope.currentPage = 1;
        $scope.setPage = function () { };
        $scope.books = allBooks;
      });
      
      $scope.updateFilter = function () {
          $timeout(function () { //wait for 'filteredBooks' to be changed
              $scope.noOfPages = Math.ceil($scope.filteredBooks.length / $scope.numPerPage);
              $scope.currentPage = 1;
              $scope.setPage = function (pageNo) {
                  $scope.currentPage = pageNo;
              };
          }, 10);
      };

      $scope.matchingBooks = function (book) {
          if (!$scope.searchText)
              return true;
          var titleMatch = book.Title.toLowerCase().indexOf($scope.searchText.toLowerCase()) != -1;
          var tagMatch = _.contains(book.Tags, $scope.searchText.toLowerCase());
          return titleMatch | tagMatch;
      };

    /*  $scope.viewBook = function (book) {
           
          //var dialogOptions  = angular.extend(staticDialogOptions, {
          //resolve: members that will be resolved and passed to the controller as locals
          //resolve: {
          //    book: function() {
          //        //make a copy in case they hit cancel
          //        return angular.copy(book);
          //    }
          //}
          //});

          var d = $dialog.dialog(
              {
                  //backdrop: true,
                  //keyboard: true,
                  //backdropClick: true,
                  templateUrl:  'modules/browse/detailDialog.html',
                  //resolve: {
                  //    book: function () {
                  //        //make a copy in case they hit cancel
                  //        return angular.copy(book);
                  //    }
                  //}
              });
          d.open().then(function(result) {
                  //the dialog returns the edited item if the user clicks OK
                  //if(result) {
                  //    angular.copy(result, book);
                  //    book.$update();//book.$save();
                  // }
              })
        }*/
  });


/* For later. This example shows getting at the current list item and cancelling changes:      http://plnkr.co/edit/MsXGuM?p=preview

$dialog.dialog(angular.extend(dialogOptions, {
 resolve: {item: function() {return angular.copy(itemToEdit);}}
 }))
 .open()
 .then(function(result) {
 if(result) {
 angular.copy(result, itemToEdit);
 }
 itemToEdit = undefined;
 });
 };*/