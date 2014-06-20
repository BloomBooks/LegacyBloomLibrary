(function () { // to wrap use strict
    'use strict';

    // This module manages the suggestions page which contains the UserVoice widget.
    angular.module('BloomLibraryApp.suggestions', ['ui.router'])
        .config(function config($urlRouterProvider, $stateProvider) {
            // This state manages the Suggestions page under More in the menu.
            // its url looks like #/suggestions.
            $stateProvider.state('suggestions', {
                url: "/suggestions",
                templateUrl: 'modules/static/suggestions.tpl.html',
                controller: 'IncludeUserVoice'
            });
        })
        .controller('IncludeUserVoice', ['$scope',
            function ($scope) {
                var uvOptions = {};
                (function() {
                    var uv = document.createElement('script'); uv.type = 'text/javascript'; uv.async = true;
                    uv.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'widget.uservoice.com/xoQAlIzNrOFQpMmMnRcg7w.js';
                    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(uv, s);
                })();
            }
        ]);

} ());  // end wrap-everything function