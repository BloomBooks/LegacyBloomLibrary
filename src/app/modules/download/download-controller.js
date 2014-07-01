(function () { // to wrap use strict
    'use strict';

    // This module manages the warning page that comes up when a book is first downloaded.
    // its url looks like download/bookId.
    // It's Continue button will attempt to download the specified book.
    angular.module('BloomLibraryApp.download', ['ui.router'])//, "restangular"])
        .config(function config($urlRouterProvider, $stateProvider){//}, $compileProvider) {

            // REVIEW: is this needed anymore, as we aren't making direct links to the download url?

            // Tell angular that urls starting with bloom: are OK. (Otherwise it marks them 'unsafe' and Chrome at
            // least won't follow them.). This is needed for the Continue button.
           // $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|bloom|mailto):/);

            //we have an abstract parent state that just holds the book id,
            // and then a child for 'preflighting' new users, and another for
            // telling them it is coming.
            $stateProvider.state('downloadBook', {
                url: "/downloadBook/:bookId",
                abstract: true,
                template: '<ui-view/>',
                controller: 'DownloadCtrl'
            });
            // Give the user a few last words about what they need for a successful download.
            $stateProvider.state('downloadBook.preflight', {
                url: "/preflight",
                templateUrl: 'modules/download/preflight.tpl.html',
                controller: 'DownloadCtrl'
            });
            // Downloading happens in this state
            $stateProvider.state('downloadBook.hereItComes', {
                url: "/hereItComes",
                templateUrl: 'modules/download/hereItComes.tpl.html',
                controller: 'DownloadCtrl'
            });
        });

    angular.module('BloomLibraryApp.download').controller('DownloadCtrl', ['$scope', '$state', '$stateParams','bookService', '$location', 'localStorageService','$rootScope',

        function ($scope, $state, $stateParams, bookService, $location, localStorageService, $rootScope) {
            //when the user clicks this checkbox, store their preference
            $scope.$watch('skipDownloadPreflight', function() {
                localStorageService.set('skipDownloadPreflight',$scope.skipDownloadPreflight);
            });

            $scope.skipDownloadPreflight = localStorageService.get('skipDownloadPreflight');

            // Set this boolean to a value indicating whether we are running on Windows.
            // According to
            // http://stackoverflow.com/questions/19877924/what-is-the-list-of-possible-values-for-navigator-platform-as-of-today
            // all major browsers currently agree that all versions of Windows after 3.1, even 64-bit ones, are
            // platform Win32.
            $scope.isWindows = navigator.platform == "Win32";

            $scope.cancel = function () {
                $state.go('browse'); //we're done here. Go back home. Review: should we go instead to detail/bookId?
            };

            // Our state hierarchy has "download", with two children: preflight and hereItComes.
            // Preflight is used only until users know what they're doing, then they click on a checkbox
            // that makes it so we don't show that anymore. There must be a more elegant way, with ui-router,
            // to skip the preflight if we need to. But this it the way I've gotten it to work thusfar:
            // we intercept the state change to preflight, and if we don't want to go there, then we
            // instead go straight to the 'hereItComes' screen.
            $scope.$on('$viewContentLoaded',
                function(event, toState, toParams, fromState, fromParams){
                    if($state.current.name.indexOf('preflight') > -1 &&
                        localStorageService.get('skipDownloadPreflight')==='true') {
                        event.preventDefault();
                        $state.go("downloadBook.hereItComes");
                    }
                    if($state.current.name.indexOf('hereItComes') > -1){
                        //get the book for which we're going to show the details asynchronously,
                        //then start the download
                        bookService.getBookById($stateParams.bookId).then(function (book) {
                            window.location.href = book.bookOrder;
                        });
                    }
                });
        } ]);
} ());  // end wrap-everything function