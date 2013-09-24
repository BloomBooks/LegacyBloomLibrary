'use strict';

angular.module('BloomLibraryApp.browse', ['ui.router', 'restangular'])//, 'BloomLibraryApp.detail'])
    .config(function config($stateProvider) {

        $stateProvider.state('browse', {
            //review: I had wanted to have the main view be named, and have the name be 'main', but then nothing would show
            //it's as if the top level view cannot be named. (note that you can specify it by saying views: {'@': 
                    url: "/browse",
                    templateUrl: 'modules/browse/browse.tpl.html',
                    controller: 'BrowseCtrl'
        }); 
    })

