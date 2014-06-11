(function () { // to wrap use strict
	'use strict';

    // This module manages various static pages ('templates' with no internal behavior, just content
    // that we want inserted between our header and footer).
	angular.module('BloomLibraryApp.staticPages', ['ui.router'])
		.config(function config($urlRouterProvider, $stateProvider) {
            // This state manages the terms page that comes up when the user clicks the Terms of User link in the header.
            // its url looks like #/terms.
			$stateProvider.state('terms', {
				url: "/terms",
				templateUrl: 'modules/terms/terms.tpl.html',
				controller: 'GoToTop'
			});
            // This state manages the privacy page that comes up when the user clicks the Privacy link in the header
            // or in the Terms page.
            // its url looks like #/privacy.
            $stateProvider.state('privacy', {
                url: "/privacy",
                templateUrl: 'modules/terms/privacy.tpl.html',
                controller: 'GoToTop'
            });
            // This state similarly manages the infringement page that comes up when the user clicks the SIL Notice Policy link in the header
            // or in the Terms page.
            // its url looks like #/infringement.
            $stateProvider.state('infringement', {
                url: "/infringement",
                templateUrl: 'modules/terms/infringement.tpl.html',
                controller: 'GoToTop'
            });
        });

	// All the controller for static pages does is to scroll to the top when the page opens.
    // Otherwise angular apparently keeps us at whatever scroll position we happened to be in the previous document.
	angular.module('BloomLibraryApp.staticPages').controller('GoToTop', ['$scope',
		function ($scope) {
            window.scrollTo(0,0);
		} ]);

} ());  // end wrap-everything function