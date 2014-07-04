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
        });

    app.controller('InstallersCtrl',

        function ($scope, Restangular) {
           // var x = Restangular.oneUrl('z','http://bloomlibrary.org.s3.amazonaws.com?prefix=installers/');
            //var y = x.ListBucketResult;

            //review: use get instead of getList and stop wrapping it in services.js?

            Restangular.all('').getList().then(function(r) {
                $scope.files = r;
                console.log(r);
            });
        });
} ());  // end wrap-everything function

