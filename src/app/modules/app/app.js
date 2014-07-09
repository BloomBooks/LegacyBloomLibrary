(function () { // to wrap use strict
	'use strict';

	var BloomLibraryApp = angular.module('BloomLibraryApp',
				['templates-app', 'templates-common', // Required for ng-boilerplate, to use templates from templates-app.js instead of copying individual files.
				'BloomLibraryApp.browse', 'BloomLibraryApp.detail', "BloomLibraryApp.login", "BloomLibraryApp.signup", "BloomLibraryApp.services", "BloomLibraryApp.datagrid",
					"BloomLibraryApp.ccdialog", "BloomLibraryApp.download", "BloomLibraryApp.staticPages", "BloomLibraryApp.suggestions",
					"BloomLibraryApp.deleteDialog", "BloomLibraryApp.inProgress", "BloomLibraryApp.pleaseLogIn", "BloomLibraryApp.mustAgree",
                    "BloomLibraryApp.installers",
                    "ui.bootstrap", "ui.bootstrap.modal", 'ui.router', 'palaso.ui.listview', 'restangular', 'ngCookies', 'LocalStorageModule'])

  .config(['$urlRouterProvider', '$stateProvider',
           function ($urlRouterProvider, $stateProvider) {

            //review/experiment: note that I was talking to locationProvider here, even though
            // we are using the alternative system, ui-router.
            // this may be relevant: http://stackoverflow.com/questions/24087188/ui-routers-urlrouterprovider-otherwise-with-html5-mode
            // For now, I've commented this out

            //  .config(['$urlRouterProvider', '$stateProvider', '$locationProvider',
            //       function ($urlRouterProvider, $stateProvider, $locationProvider) {

            //on amazon s3, we've done the redirection like that described here: http://stackoverflow.com/a/16877231/723299
//			$locationProvider.html5Mode(true);
//			$locationProvider.hashPrefix('!');

//			// For any unmatched url, redirect to /state1
			$urlRouterProvider.otherwise("/home");
           } ])

.controller('HeaderCtrl', ['$scope', 'authService', '$location', '$state', 'silNoticeService', function ($scope, authService, $location, $state, silNoticeService) {
	$scope.location = $location.path();
	$scope.isLoggedIn = authService.isLoggedIn;

	$scope.logout = function () {
		authService.logout();
		silNoticeService.clear();
		$state.go('browse');
	};
            
            // Used to determine the active menu item
            $scope.isActive = function (viewLocation) { 
                return viewLocation === $location.path();
            };

            // When the navbar is open on a small device (i.e. shown vertically),
            // collapse it when user navigates
            $(document).on('click','.navbar-collapse.in',function(e) {
                if( $(e.target).is('a') && !$(e.target).hasClass('dropdown-toggle') ) {
                    $(this).collapse('hide');
                }
            });

	$scope.userName = authService.userName;
} ])
        .controller('FooterCtrl', ['$scope', '$location', function($scope, $location) {
            $scope.year = new Date().getFullYear().toString();

            // Used to determine the active link
            $scope.isActive = function (viewLocation) { 
                return viewLocation === $location.path();
            };
        }])
		.controller('LeftSidebar', ['$scope', '$state', '$location', '$rootScope', 'bookService', 'authService', '$modal',
            function ($scope, $state, $location, $rootScope, bookService, authService, $modal) {
            $scope.currentLang = $location.$$search.lang;
            $scope.currentTag = $location.$$search.tag;
            $scope.currentShelf = $location.$$search.shelf;
            $scope.wantLeftBar = $location.$$path.substring(1, 7) == 'browse';
            $scope.isLoggedIn = authService.isLoggedIn();
            $rootScope.$on('$locationChangeSuccess', function() {
                $scope.currentLang = $location.$$search.lang;
                $scope.currentTag = $location.$$search.tag;
                $scope.currentShelf = $location.$$search.shelf;
                $scope.wantLeftBar = $location.$$path.substring(1, 7) == 'browse';
            });
            $scope.showInProgress = function() {
                $modal.open({
                    templateUrl: 'modules/inProgress/inProgress.tpl.html',
                    controller: 'inProgress',
                    windowClass: 'ccmodal'
                });
            };
            $scope.filterLanguage = function(language) {
                $state.go('browse', {lang:language}); // keep other params unchanged.
            };
            $scope.filterTag = function(tagName) {
                $state.go('browse', {tag:tagName}); // keep other params unchanged.
            };
            $scope.filterShelf = function(shelfName) {
                $state.go('browse', {search: '', shelf:shelfName}); // keep other params unchanged.
            };
            $scope.filterMyUploads = function() {
                if (authService.isLoggedIn()) {
                    $state.go('browse', {search: '', shelf: '$myUploads'}); // keep other params unchanged.
                } else {
                    $scope.showPleaseLogIn();
                }
            };

            // Sadly duplicated in detail controller
            $scope.showPleaseLogIn = function() {
                $modal.open({
                    templateUrl: 'modules/login/pleaseLogIn.tpl.html',
                    controller: 'pleaseLogIn',
                    windowsClass: 'ccmodal'
                });
            };

                // At some point, we may manually control topLanguages, and have a 'more' link to show them all.
//            $scope.topLanguages = [
//                {isoCode: 'en', name:'English'},
//                {isoCode: 'tpi', name:'Tok Pisin'},
//                {isoCode: 'th', name:'Thai'},
//                {isoCode: 'id', name:'Bahasia Indonesia'},
//                {isoCode: 'fr', name:'French'}
//            ];
                bookService.getLanguages().then(function(languages) {
                    $scope.topLanguages = languages;
                });
                // Replicated from Bloom.Book.RuntimeInformationInjector.AddUISettingsToDom().
                // Eventually this will be user-extensible and retrieved using a query on some new table.
                $scope.topTags = [
                    "Agriculture", "Animal Stories", "Business", "Culture", "Community Living", "Dictionary", "Environment", "Fiction", "Health", "How To", "Math", "Non Fiction", "Spiritual", "Personal Development", "Primer", "Science", "Traditional Story"
                ];

            // Toggle sidebar
            $('[data-toggle="offcanvas"]').click(function () {
                $('.row-offcanvas').toggleClass('active');
            });
        }])
        .controller('CarouselCtrl', ['$scope', 
            function ($scope) {
                $scope.myInterval = 10000;
                var slides = $scope.slides = [];
                slides.push({
                    image: 'assets/class.jpg',
                    text: 'Learning to read takes books. Learning to read well, and developing a love of reading, takes lots of books.  Books at all different skill levels. But how are low-literacy language communities ever to get all those books in their language?  They can do it with Bloom.'
                });
                slides.push({
                    image: 'assets/shellbook.png',
                    text: 'Bloom keeps things simple and efficient by offering a library of shell books. You just translate from a source language, and print.'
                });
        }]);

	//Angular provides a "limitTo" filter, this adds "startFrom" filter for use with pagination
	BloomLibraryApp.filter('startFrom', function () {
		return function (input, start) {
			start = +start; //parse to int
			if (input) {
				return input.slice(start);
			} else {
				return "";
			}
		};
	});

	//review: adding functions here is probably not angularjs best practice (but I haven't learned what the correct way would be, just yet)
	BloomLibraryApp.run(
   ['$rootScope', '$state', '$stateParams','$cookies',
   function ($rootScope, $state, $stateParams, $cookies) {
	//lets you write ng-click="log('testing')"
	$rootScope.log = function (variable) {
		console.log(variable);
	};

	//lets you write ng-click="alert('testing')"
	$rootScope.alert = function (text) {
		alert(text);
	};
	
	$rootScope.$on('$stateChangeSuccess', function (event, current, previous) {
		if (current.title) {
			$rootScope.pageTitle = "Bloom - " + current.title;
		} else {
			$rootScope.pageTitle = "Bloom";
		}
    });

	// It's very handy to add references to $state and $stateParams to the $rootScope
	// so that you can access them from any scope within your applications.For example,
	// <li ng-class="{ active: $state.includes('contacts.list') }"> will set the <li>
	// to active whenever 'contacts.list' or one of its descendants is active.
	$rootScope.$state = $state;
	$rootScope.$stateParams = $stateParams;
   } ]);


	BloomLibraryApp.directive('pdfoverlay', function () {
		return {
			restrict: 'A',
			link: function (scope, element, attrs) {
				$(element).fancybox({
					'overlayShow': true,
					'type': 'iframe',
					iframe: {
						preload: false
					}
				});
			}
		};
	});
} ());  // end wrap-everything function