'use strict';

angular.module('BloomLibraryApp.browse', ['ui.router', 'restangular'])//, 'BloomLibraryApp.detail'])
    .config(['$stateProvider', function config($stateProvider) {

        $stateProvider.state('browse', {
            //review: I had wanted to have the main view be named, and have the name be 'main', but then nothing would show
            //it's as if the top level view cannot be named. (note that you can specify it by saying views: {'@': 
            url: "/browse?search",
            templateUrl: 'modules/browse/browse.tpl.html',
            controller: 'BrowseCtrl'
        });
    }])

//we get a json list like ['me','you'] and we return 'me, you'
.filter('makeCommaList', function () {
    return function (input) {
        return input.join(", ");
    }
});


