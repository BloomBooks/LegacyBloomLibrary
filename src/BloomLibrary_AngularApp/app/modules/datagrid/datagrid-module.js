'use strict';

// Model declaration for the data grid view (url #/datagrid)
angular.module('BloomLibraryApp.datagrid', ['ui.router', 'restangular', 'ngGrid'])//, 'BloomLibraryApp.detail'])
    .config(['$stateProvider', function config($stateProvider) {

        $stateProvider.state('datagrid', {
             url: "/datagrid",
            templateUrl: 'modules/datagrid/datagrid.tpl.html',
            controller: 'DataGridCtrl'
        });
    }]);


