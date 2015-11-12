(function () { // to wrap use strict
    'use strict';

    var installersApp = angular.module('BloomLibraryApp.downloadInstallers', ['ui.router','restangular'])
        .config(function config($urlRouterProvider, $stateProvider,RestangularProvider){
            RestangularProvider.setBaseUrl('http://bloomlibrary.org.s3.amazonaws.com?prefix=installers/');

            // Do NOT change the state, or especially the url, back to just plain installers.
            // Our S3 hosting service has a redirect for downloadInstallers (to #/downloadInstallers) so that
            // refresh on the installers page will work. That redirect must NOT be changed to redirect
            // installers*, because all our actual installers are real files with that prefix.
            $stateProvider.state('downloadInstallers', {
                url: "/downloadInstallers",
                templateUrl: 'modules/installers/installers.tpl.html',
                controller: 'InstallersCtrl',
                title: 'Download Bloom Book Making Software from SIL'
            });

            //TODO: this should be downloadInstallers.old, but when set, it becomes unreachable, with no console errors
            $stateProvider.state('downloadInstallersold', {
                url: "/downloadInstallers/old",
               //didn't help parent: 'installers',
                templateUrl: 'modules/installers/oldInstallers.tpl.html',
                controller: 'InstallersCtrl'
            });

            $stateProvider.state('downloadInstallerslinux', {
                url: "/downloadInstallers/linux",
                //didn't help parent: 'installers',
                templateUrl: 'modules/installers/linux.tpl.html',
                controller: 'InstallersCtrl'
            });
        });

    installersApp.controller('InstallersCtrl',
        function ($scope,$state, Restangular) {
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
        });
} ());  // end wrap-everything function

