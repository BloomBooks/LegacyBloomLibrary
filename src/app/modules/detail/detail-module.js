'use strict';

angular.module('BloomLibraryApp.detail', ['ui.router', "restangular"])
    .config(function config($urlRouterProvider, $stateProvider) {
    
        $stateProvider.state('browse.detail', {
            url: "/detail/:bookId",
            onEnter: function ($dialog, $state) {

                $dialog.dialog(
                     {
                         backdrop: true,
                         keyboard: true, //make ESC close it
                         backdropClick: true, //make clicking on the backdrop close it
                         templateUrl: 'src/app/modules/detail/detail.tpl.html',
                         controller: 'DetailCtrl'
                     }).open().then(function (result) {
                         if (!result) {
                             return $state.transitionTo("browse");
                         }
                     });
            }
        });
    });
