'use strict';

var BloomLibraryApp = angular.module('BloomLibraryApp', 
				['BloomLibraryApp.browse', 'BloomLibraryApp.detail', "BloomLibraryApp.login", "BloomLibraryApp.signup", "BloomLibraryApp.services", "BloomLibraryApp.datagrid",
				"ui.bootstrap", 'ui.router', 'palaso.ui.listview', 'restangular' ])

  .config(['$urlRouterProvider', '$stateProvider',
           function ($urlRouterProvider, $stateProvider) {

      //TODO when we have hosting that can do the url rewriting this requires
      //$locationProvider.html5Mode(true);
      //$locationProvider.hashPrefix('!');

      // For any unmatched url, redirect to /state1
      $urlRouterProvider.otherwise("/browse");

  }])

.controller('HeaderCtrl', ['$scope', 'authService', '$location', '$state', function($scope, authService, $location, $state) {
    $scope.location = $location.path();
    $scope.isLoggedIn = authService.isLoggedIn;

    $scope.logout = function () {
        authService.logout();
        $state.go('browse');
    };

    $scope.userName = authService.userName;
}]);

//Angular provides a "limitTo" filter, this adds "startFrom" filter for use with pagination
BloomLibraryApp.filter('startFrom', function () {
    return function (input, start) {
        start = +start; //parse to int
        if (input) {
            return input.slice(start);
        } else
            return "";
    };
});

//review: adding functions here is probably not angularjs best practice (but I haven't learned what the correct way would be, just yet)
BloomLibraryApp.run(
   [ '$rootScope', '$state', '$stateParams',
   function ($rootScope, $state, $stateParams) {

      
       //lets you write ng-click="log('testing')"
       $rootScope.log = function (variable) {
           console.log(variable);
       };

       //lets you write ng-click="alert('testing')"
       $rootScope.alert = function (text) {
           alert(text);
       };
       // It's very handy to add references to $state and $stateParams to the $rootScope
       // so that you can access them from any scope within your applications.For example,
       // <li ng-class="{ active: $state.includes('contacts.list') }"> will set the <li>
       // to active whenever 'contacts.list' or one of its decendents is active.
       $rootScope.$state = $state;
       $rootScope.$stateParams = $stateParams;
   }]);


BloomLibraryApp.directive('pdfoverlay', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            $(element).fancybox({
                'overlayShow': true,
                'type': 'iframe'
            });
        }
    };
});

