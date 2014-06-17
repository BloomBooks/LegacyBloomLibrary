(function () { // to wrap use strict
	'use strict';

	var BloomLibraryApp = angular.module('BloomLibraryApp',
				['templates-app', 'templates-common', // Required for ng-boilerplate, to use templates from templates-app.js instead of copying individual files.
				'BloomLibraryApp.browse', 'BloomLibraryApp.detail', "BloomLibraryApp.login", "BloomLibraryApp.signup", "BloomLibraryApp.services", "BloomLibraryApp.datagrid",
					"BloomLibraryApp.ccdialog", "BloomLibraryApp.download", "BloomLibraryApp.staticPages",
					"BloomLibraryApp.deleteDialog", "BloomLibraryApp.inProgress", "BloomLibraryApp.pleaseLogIn", "BloomLibraryApp.mustAgree",
				"ui.bootstrap", 'ui.router', 'palaso.ui.listview', 'restangular', 'ngCookies'])

  .config(['$urlRouterProvider', '$stateProvider',
           function ($urlRouterProvider, $stateProvider) {

			//TODO when we have hosting that can do the url rewriting this requires
			//$locationProvider.html5Mode(true);
			//$locationProvider.hashPrefix('!');

			// For any unmatched url, redirect to /state1
			$urlRouterProvider.otherwise("/browse");

           } ])

.controller('HeaderCtrl', ['$scope', 'authService', '$location', '$state', 'silNoticeService', function ($scope, authService, $location, $state, silNoticeService) {
	$scope.location = $location.path();
	$scope.isLoggedIn = authService.isLoggedIn;

	$scope.logout = function () {
		authService.logout();
		silNoticeService.clear();
		$state.go('browse');
	};

	$scope.userName = authService.userName;
} ])
        .controller('FooterCtrl', ['$scope', function($scope) {
            $scope.year = new Date().getFullYear().toString();
        }])
		.controller('LeftSidebar', ['$scope', '$dialog', '$state', '$location', '$rootScope', 'bookService', 'authService',
            function ($scope, $dialog, $state, $location, $rootScope, bookService, authService) {
            $scope.currentLang = $location.$$search.lang;
            $scope.currentTag = $location.$$search.tag;
            $scope.currentShelf = $location.$$search.shelf;
            $scope.wantLeftBar = $location.$$path.substring(1, 7) == 'browse';
            $rootScope.$on('$locationChangeSuccess', function() {
                $scope.currentLang = $location.$$search.lang;
                $scope.currentTag = $location.$$search.tag;
                $scope.currentShelf = $location.$$search.shelf;
                $scope.wantLeftBar = $location.$$path.substring(1, 7) == 'browse';
            });
			$scope.showInProgress = function() {
				$dialog.dialog(
					{
						backdrop: true,
						keyboard: true, //make ESC close it
						backdropClick: true, //make clicking on the backdrop close it
						templateUrl: 'modules/inProgress/inProgress.tpl.html',
						controller: 'inProgress',
						dialogClass: 'modal ccmodal'
					}).open();
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
                $dialog.dialog(
                    {
                        backdrop: true,
                        keyboard: true, //make ESC close it
                        backdropClick: true, //make clicking on the backdrop close it
                        templateUrl: 'modules/login/pleaseLogIn.tpl.html',
                        controller: 'pleaseLogIn',
                        dialogClass: 'modal ccmodal'
                    }).open();
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
		} ]);

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
   ['$rootScope', '$state', '$stateParams',
   function ($rootScope, $state, $stateParams) {


	//lets you write ng-click="log('testing')"
	$rootScope.log = function (variable) {
		console.log(variable);
	};

	//lets you write ng-click="alert('testing')"
	$rootScope.alert = function (text) {
		alert(text);
	};
	
	//Keeps the correct nav link active
	$('.navbar li').click(function(e) {
		$('.navbar li.active').removeClass('active');
		var $this = $(this);
		if (!$this.hasClass('active')) {
			$this.addClass('active');
		}
		e.preventDefault();
	});
	
	//Load the UserVoice widget
	var uvOptions = {};
	(function() {
		var uv = document.createElement('script'); uv.type = 'text/javascript'; uv.async = true;
		uv.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'widget.uservoice.com/xoQAlIzNrOFQpMmMnRcg7w.js';
		var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(uv, s);
	})();
	
	//Start the automatic changing of carousel slides (on Home page)
       (function ($) {
            $(function(){
              $('#homeCarousel').carousel();
            });
        })(window.jQuery);

	// It's very handy to add references to $state and $stateParams to the $rootScope
	// so that you can access them from any scope within your applications.For example,
	// <li ng-class="{ active: $state.includes('contacts.list') }"> will set the <li>
	// to active whenever 'contacts.list' or one of its decendents is active.
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