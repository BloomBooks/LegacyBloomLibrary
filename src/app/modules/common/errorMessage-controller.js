(function () { // to wrap use strict
    'use strict';

    angular.module('BloomLibraryApp.errorMessage', ['ui.router'])
    .config(function config($urlRouterProvider, $stateProvider, $compileProvider) {
    })

    .controller('errorMessage', ['$scope', '$modalInstance', function ($scope, $modalInstance) {
        $scope.close = function () {
            $modalInstance.close(false);
        };

        // This is so the modal closes (backdrop removed, etc.) when the back button in the browser is used
        // or the user follows a link in the modal.
        $scope.$on('$locationChangeSuccess', function (event) {
            $modalInstance.close();
        });
    } ]);
} ());  // end wrap-everything function