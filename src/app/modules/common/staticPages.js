(function () { // to wrap use strict
	'use strict';

    // This module manages various static pages ('templates' with no internal behavior, just content
    // that we want inserted between our header and footer).
	angular.module('BloomLibraryApp.staticPages', ['ui.router'])
		.config(function config($urlRouterProvider, $stateProvider) {
            // This state manages the terms page that comes up when the user clicks the Terms of User link in the header.
            // its url looks like /terms.
			$stateProvider.state('terms', {
				url: "/terms",
				templateUrl: 'modules/terms/terms.tpl.html',
				controller: 'GoToTop',
        title: 'Bloom Book Making Software from SIL International'
			});
            // This state manages the privacy page that comes up when the user clicks the Privacy link in the header
            // or in the Terms page.
            // its url looks like /privacy.
            $stateProvider.state('privacy', {
                url: "/privacy",
                templateUrl: 'modules/terms/privacy.tpl.html',
                controller: 'GoToTop'
            });
            // This state similarly manages the infringement page that comes up when the user clicks the SIL Notice Policy link in the header
            // or in the Terms page.
            // its url looks like /infringement.
            $stateProvider.state('infringement', {
                url: "/infringement",
                templateUrl: 'modules/terms/infringement.tpl.html',
                controller: 'GoToTop'
            });
            // This state manages the Home page.
            // its url looks like /landing.
            $stateProvider.state('landing', {
                url: "/landing",
                templateUrl: 'modules/static/landing/landing.tpl.html',
                controller: 'GoToTop',
                title: 'Bloom Book Making Software from SIL International'
            });
            // This state manages the Features page in the menu.
            // its url looks like /features.
            //            $stateProvider.state('features', {
            //                url: "/features",
            //                templateUrl: 'modules/static/features.tpl.html',
            //                controller: 'GoToTop',
            //                title: 'Features'
            //            });
            // This state manages the Download page in the menu (for downloading the desktop application).
            // its url looks like /download.
            $stateProvider.state('download', {
                url: "/download",
                templateUrl: 'modules/static/downloadapp.tpl.html',
                controller: 'GoToTop',
                title: 'Download'
            });
            // This state manages the Support page in the menu.
            // its url looks like /support.
            $stateProvider.state('support', {
                url: "/support",
                templateUrl: 'modules/static/support.tpl.html',
                controller: 'GoToTop',
                title: 'Support'
            });
            // This state manages the Art of Reading page (accessed from Download page).
            // its url looks like /artofreading.
            $stateProvider.state('artofreading', {
                url: "/artofreading",
                templateUrl: 'modules/static/artofreading.tpl.html',
                controller: 'GoToTop',
                title: 'Art of Reading'
            });
            // This state manages the About page under More in the menu.
            // its url looks like /about.
            $stateProvider.state('about', {
                url: "/about",
                templateUrl: 'modules/static/about.tpl.html',
                controller: 'GoToTop',
                title: 'About'
            });
            // This state manages the Open Source page under More in the menu.
            // its url looks like /opensource.
            $stateProvider.state('opensource', {
                url: "/opensource",
                templateUrl: 'modules/static/opensource.tpl.html',
                controller: 'GoToTop',
                title: 'Open Source'
            });
        });

	// All the controller for static pages does is to scroll to the top when the page opens.
    // Otherwise angular apparently keeps us at whatever scroll position we happened to be in the previous document.
	angular.module('BloomLibraryApp.staticPages').controller('GoToTop', ['$scope',
		function ($scope) {
            window.scrollTo(0,0);
		} ]);

} ());  // end wrap-everything function