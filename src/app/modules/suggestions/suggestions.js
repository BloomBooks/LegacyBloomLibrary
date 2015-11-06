(function () { // to wrap use strict
    'use strict';

    // This module manages the suggestions page which contains the UserVoice widget.
    angular.module('BloomLibraryApp.suggestions', ['ui.router'])
        .config(function config($urlRouterProvider, $stateProvider) {
            // This state manages the Suggestions page under More in the menu.
            // its url looks like /suggestions.
            $stateProvider.state('suggestions', {
                url: "/suggestions",
                templateUrl: 'modules/suggestions/suggestions.tpl.html',
                controller: 'IncludeUserVoice',
                title: 'Suggestions'
            });
        })
        .controller('IncludeUserVoice', ['$scope',
            function ($scope) {
                // Include the UserVoice external script.  This is needed to load the embedded widget.
                // To make sure we don't have multiple copies (which would happen if the user leaves and returns to the page),
                // remove the script if it has already been added.  We have to re-add it or the widget will not be displayed.
                // xoQAlIzNrOFQpMmMnRcg7w is the unique identifier for our Bloom feedback system on UserVoice (bloombooks.uservoice.com)
                var uvReferenceKey = 'xoQAlIzNrOFQpMmMnRcg7w';
                var s = document.getElementById('userVoiceScript');
                if (s) {
                    s.parentNode.removeChild(s);
                }
                
                // The remaining code is provided as is by UserVoice (other than adding an id and making uvReferenceKey a variable.
                var uvOptions = {};
                (function() {
                    var uv = document.createElement('script');
                    uv.id = 'userVoiceScript';
                    uv.type = 'text/javascript'; 
                    uv.async = true;
                    uv.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'widget.uservoice.com/' + uvReferenceKey + '.js';
                    var s = document.getElementsByTagName('script')[0];
                    s.parentNode.insertBefore(uv, s);
                })();
            }
        ]);

} ());  // end wrap-everything function