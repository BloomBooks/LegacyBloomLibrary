(function () { // to wrap use strict
	'use strict';

	// This module manages the terms page that comes up when the user clicks the Terms of User link in the header.
	// its url looks like #/terms.
	angular.module('BloomLibraryApp.terms', ['ui.router'])
		.config(function config($urlRouterProvider, $stateProvider) {
			$stateProvider.state('terms', {
				url: "/terms",
				templateUrl: 'modules/terms/terms.tpl.html',
				controller: 'TermsCtrl'
			});
		});

	// Not sure if we need this...there's currently nothing for the controller to do.
	angular.module('BloomLibraryApp.terms').controller('TermsCtrl', ['$scope',
		function ($scope) {
            window.scrollTo(0,0);
		} ]);


	// This module manages the privacy page that comes up when the user clicks the Privacy link in the header
	// or in the Terms page.
	// its url looks like #/privacy.
	angular.module('BloomLibraryApp.privacy', ['ui.router'])
		.config(function config($urlRouterProvider, $stateProvider) {
			$stateProvider.state('privacy', {
				url: "/privacy",
				templateUrl: 'modules/terms/privacy.tpl.html',
				controller: 'PrivacyCtrl'
			});
		});

	// Not sure if we need this...there's currently nothing for the controller to do.
	angular.module('BloomLibraryApp.privacy').controller('PrivacyCtrl', ['$scope',
		function ($scope) {
            window.scrollTo(0,0);
        } ]);

    // This module similarly manages the infringement page that comes up when the user clicks the SIL Notice Policy link in the header
    // or in the Terms page.
    // its url looks like #/privacy.
    angular.module('BloomLibraryApp.infringement', ['ui.router'])
        .config(function config($urlRouterProvider, $stateProvider) {
            $stateProvider.state('infringement', {
                url: "/infringement",
                templateUrl: 'modules/terms/infringement.tpl.html',
                controller: 'InfringementCtrl'
            });
        });

    // Not sure if we need this...there's currently nothing for the controller to do.
    angular.module('BloomLibraryApp.privacy').controller('InfringementCtrl', ['$scope',
        function ($scope) {
            window.scrollTo(0,0);
        } ]);
} ());  // end wrap-everything function