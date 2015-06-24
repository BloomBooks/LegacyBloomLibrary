(function () { // to wrap use strict
    'use strict';

    // This module manages the warning page that comes up when a book is first downloaded.
    // its url looks like downloadBook/bookId.
    angular.module('BloomLibraryApp.download', ['ui.router'])
    // Its Continue button will attempt to download the specified book.
        .config(function config($urlRouterProvider, $stateProvider) {

            // We have an abstract parent state
            // and then a child for 'preflighting' new users
            // and another for telling them it is coming.
            $stateProvider.state('browse.detail.downloadBook', {
                url: "/downloadBook",
                abstract: true,
                views: {
                    '@': {
                        template: '<ui-view/>'
                    }
                }
            });
            // Give the user a few last words about what they need for a successful download.
            $stateProvider.state('browse.detail.downloadBook.preflight', {
                url: "/preflight",
                templateUrl: 'modules/download/preflight.tpl.html',
                controller: 'PreflightCtrl'
            });
            // Downloading happens in this state
            $stateProvider.state('browse.detail.downloadBook.hereItComes', {
                url: "/hereItComes",
                templateUrl: 'modules/download/hereItComes.tpl.html',
                controller: 'DownloadCtrl'
            });
        });

    angular.module('BloomLibraryApp.download')
        .controller('PreflightCtrl', ['$scope', '$state', '$stateParams', 'bookService', '$location', 'localStorageService',

        function ($scope, $state, $stateParams, bookService, $location, localStorageService) {
            // Used to display the book title
            bookService.getBookById($stateParams.bookId).then(function (book) {
                $scope.book = book;
            });
        
            //when the user clicks this checkbox, store their preference
            $scope.$watch('skipDownloadPreflight', function() {
                localStorageService.set('skipDownloadPreflight',$scope.skipDownloadPreflight);
            });

            $scope.skipDownloadPreflight = localStorageService.get('skipDownloadPreflight');

            $scope.cancel = function () {
                $state.go('^.^'); //we're done here. Go back to the detail.
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
                        $state.go("browse.detail.downloadBook.hereItComes");
                    }
                });
        } ])
        .controller('DownloadCtrl', ['$stateParams', 'bookService', '$timeout', '$analytics', 'downloadHistoryService', function($stateParams, bookService, $timeout, $analytics, downloadHistoryService) {
            //get the book for which we're going to show the details asynchronously, then start the download
            bookService.getBookById($stateParams.bookId).then(function (book) {
                // Without $timeout, setting the href will cancel the analytics request
                $timeout(function() {
                    $analytics.eventTrack('Download Book', {book: book.objectId, href: book.bookOrder, bookTitle:book.title});

                    downloadHistoryService.logDownload(book.objectId);
                });
                window.location.href = book.bookOrder + '&title=' + encodeURIComponent(book.title);
            });
        }]);
} ());  // end wrap-everything function