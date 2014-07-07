(function () { // to wrap use strict
    'use strict';

    var app = angular.module('BloomLibraryApp.installers', ['ui.router','restangular'])
        .config(function config($urlRouterProvider, $stateProvider,RestangularProvider){
            RestangularProvider.setBaseUrl('http://bloomlibrary.org.s3.amazonaws.com?prefix=installers/');

            $stateProvider.state('installers', {
                url: "/installers",
                templateUrl: 'modules/installers/installers.tpl.html',
                controller: 'InstallersCtrl'
            });

            //TODO: this should be installers.old, but when set, it becomes unreachable, with no console errors
            $stateProvider.state('installersold', {
                url: "/installers/old",
               //didn't help parent: 'installers',
                templateUrl: 'modules/installers/oldInstallers.tpl.html',
                controller: 'InstallersCtrl'
            });
        });

    app.controller('InstallersCtrl',

        function ($scope,$state, Restangular) {
           // var x = Restangular.oneUrl('z','http://bloomlibrary.org.s3.amazonaws.com?prefix=installers/');
            //var y = x.ListBucketResult;

            //review: use get instead of getList and stop wrapping it in services.js?

            $scope.$on('$viewContentLoaded',
                function(event, toState, toParams, fromState, fromParams) {
                    if ($state.current.name.indexOf('old') > -1) {
                        Restangular.all('').getList().then(function (r) {
                            $scope.files = r;
                            console.log(r);
                        });
                    }
                });
            //TODO only do this when in old-installers
//            Restangular.all('').getList().then(function(r) {
//                $scope.files = r;
//                console.log(r);
//            });
        });
} ());  // end wrap-everything function

