(function () { // to wrap use strict
	'use strict';

	angular.module('BloomLibraryApp.prefs', ['ui.router', "restangular"])
		.config(function config($urlRouterProvider, $stateProvider, $compileProvider) {
            // This state manages the Preferences page which is only accessed directly by url.
            // its url looks like /prefs.
            $stateProvider.state('prefs', {
                url: "/prefs",
                templateUrl: 'modules/prefs/prefs.tpl.html',
                controller: 'PrefsCtrl',
                title: 'Preferences'
            });
		});

	angular.module('BloomLibraryApp.prefs').controller('PrefsCtrl', ['$scope', 'localStorageService',
		function ($scope, localStorageService) {
            $scope.isTrackLiveAnalytics = localStorageService.get('trackLiveAnalytics') !== "false";

            $scope.savePrefs = function (record) {
                if (!record) { // Shouldn't be, but just in case
                    return true;
                }
                $scope.submitting = true;
                var trackLiveAnalyticsLs = localStorageService.get('trackLiveAnalytics') || "true";
                localStorageService.set('trackLiveAnalytics', record.trackLiveAnalytics);
                if ((trackLiveAnalyticsLs === "true") !== record.trackLiveAnalytics) {
                    alert('You have successfully saved a change to analytics tracking.  However, the change will not take effect until you refresh.');
                }
                $scope.submitting = false;
            };
		} ]);
} ());  // end wrap-everything function