'use strict';

angular.module('BloomLibraryApp.login', ['ui.router', 'BloomLibraryApp.services', 'palaso.ui.notice'])//, 'BloomLibraryApp.detail'])
    .config(function config($stateProvider) {

        $stateProvider.state('login', {
            //review: I had wanted to have the main view be named, and have the name be 'main', but then nothing would show
            //it's as if the top level view cannot be named. (note that you can specify it by saying views: {'@': 
                    url: "/login",
                    templateUrl: 'modules/login/login.tpl.html',
                    controller: 'LoginCtrl'
        }); 
    })
;