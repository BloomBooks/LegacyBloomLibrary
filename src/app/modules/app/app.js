(function () { // to wrap use strict
	'use strict';

	var BloomLibraryApp = angular.module('BloomLibraryApp',
				['templates-app', 'templates-common', // Required for ng-boilerplate, to use templates from templates-app.js instead of copying individual files.
				'BloomLibraryApp.browse', 'BloomLibraryApp.detail', "BloomLibraryApp.login", "BloomLibraryApp.signup", "BloomLibraryApp.services", "BloomLibraryApp.datagrid",
					"BloomLibraryApp.ccdialog", "BloomLibraryApp.download", "BloomLibraryApp.staticPages", "BloomLibraryApp.suggestions",
					"BloomLibraryApp.deleteDialog", "BloomLibraryApp.inProgress", "BloomLibraryApp.pleaseLogIn", "BloomLibraryApp.mustAgree",
                    "BloomLibraryApp.installers", "BloomLibraryApp.errorMessage", "BloomLibraryApp.prefs",
                    "ui.bootstrap", "ui.bootstrap.modal", 'ui.router', 'palaso.ui.listview', 'restangular', 'ngCookies', 'LocalStorageModule',
                    "angulartics", "angulartics.segment.io"])

  .config(['$urlRouterProvider', '$stateProvider',
           function ($urlRouterProvider, $stateProvider) {

               $stateProvider.state('requireLoginResolution', {
                   'abstract': true,
                   resolve: {
                       login:
                           ['authService',
                               function (authService) {
                                   if (!authService.isLoggedIn()) {
                                       return authService.tryLogin();
                                   }
                                   return;
                               }
                           ]
                   },
                   template: '<ui-view/>'
               });

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
			$urlRouterProvider.otherwise("/landing");
           } ])

.controller('HeaderCtrl', ['$scope', 'authService', '$location', '$state', 'silNoticeService', function ($scope, authService, $location, $state, silNoticeService) {
	$scope.location = $location.path();
	$scope.isLoggedIn = authService.isLoggedIn;

	$scope.logout = function () {
		authService.logout();
		silNoticeService.clear();
        // Collapse navbar if in collapsible state.  Needed because logout isn't present when event handler below is attached.
        $('.navbar-collapse.in').collapse('hide');
		$state.go('browse');
	};

            // Used to determine the active menu item
            $scope.isActive = function (viewLocation) {
                return viewLocation === $location.path();
            };

            $scope.isBookLibrary = function () {
                return $.inArray($location.path(), ['/landing','/features','/installers','/installers/old','/installers/linux','/artofreading','/support','/about','/opensource','/suggestions','/terms','/privacy','/infringement']) === -1;
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
		.controller('LeftSidebar', ['$scope', '$state', '$location', '$rootScope', 'bookService', 'languageService', 'tagService', 'authService', '$modal',
            function ($scope, $state, $location, $rootScope, bookService, languageService, tagService, authService, $modal) {
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
                bookService.resetCurrentPage();
                $state.go('browse', {lang:language}); // keep other params unchanged.
            };
            $scope.filterTag = function(tagName) {
                bookService.resetCurrentPage();
                $state.go('browse', {tag:tagName}); // keep other params unchanged.
            };
            $scope.filterShelf = function(shelfName) {
                bookService.resetCurrentPage();
                if (shelfName === '') {
                    // User selected "All Books"
                    $state.go('browse', {search:'', shelf:shelfName, lang:'', tag:''});
                } else {
                    $state.go('browse', {search:'', shelf:shelfName}); // keep other params unchanged.
                }
            };
            $scope.filterMyUploads = function() {
                bookService.resetCurrentPage();
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

            languageService.getLanguages().then(function(languages) {
                //This is the number of displayed languages on the browse sidebar before (n more...)
                var numberOfTopLanguages = 4;

                function compareLang(a, b) {
                    return a.name < b.name ? -1 : 1;
                }

                //If all languages can be held in the top list, just fill the top list
                if(languages.length <= numberOfTopLanguages) {
                    $scope.topLanguages = languages.sort(compareLang);
                    $scope.otherLanguages = [];
                }
                else {
                    //Split the list of languages into top and other, and sort the lists alphabetically
                    $scope.topLanguages = languages.slice(0, numberOfTopLanguages).sort(compareLang);
                    $scope.otherLanguages = languages.slice(numberOfTopLanguages, languages.length).sort(compareLang);
                }

                //Search through otherLanguages
                for(var i = 0; i < $scope.otherLanguages.length; i++) {
                    //If the currentLang is in the other list, add it to the top (visible) list
                    if($scope.otherLanguages[i].isoCode == $scope.currentLang) {
                        $scope.topLanguages.unshift($scope.otherLanguages.splice(i, 1)[0]);
                        $scope.topLanguages.sort(compareLang);
                        break;
                    }
                }
            });

                //This is the global list of all categories of tags
                //The tags are separated out by these categories on the sidebar of the browse view
                //id is the usage in the tag (e.g. "region.MyRegion") and displayName is the header
                $scope.tagCategories = [
                    {id: 'topic', displayName: 'Topics'},
                    {id: 'region', displayName: 'Regions'},
                    {id: 'level', displayName: 'Reading Levels'}
                ];

                //This is the object which will hold all of the tag names
                $scope.tags = {topic: {top: [], other: []}};

                tagService.getTags().then(function(tags) {
                    //This is the number of tags that will be shown in each category of tag before the (n more...)
                    //Currently this is set at 100 to prevent "other" list from showing
                    var numberOfTopTags = 100;

                    //Get the names out of the tags; we don't care about the other properties
                    var tagNames = tags.map(function(item) {
                        return item.name;
                    });

                    var iTag, iCat, cat;
                    var categoryRegex = {};

                    //Set up objects and regexes to save processing time
                    for(iCat = 0; iCat < $scope.tagCategories.length; iCat++) {
                        cat = $scope.tagCategories[iCat].id;
                        $scope.tags[cat] = {top: [], other: []};
                        categoryRegex[cat] = new RegExp('^' + cat + ':');
                    }

                    //Loop through tags
                    for(iTag = 0; iTag < tagNames.length; iTag++) {
                        //Check if tag belongs to a category
                        for(iCat = 0; iCat < $scope.tagCategories.length; iCat++) {
                            cat = $scope.tagCategories[iCat].id;
                            if(categoryRegex[cat].test(tagNames[iTag])) {
                                break;
                            }
                        }
                        //If we didn't find a category tag belongs to
                        if(iCat >= $scope.tagCategories.length) {
                            //Default is the first-listed category
                            cat = $scope.tagCategories[0].id;
                        }

                        //Only add tag to list if not a system tag
                        if(!tagService.isSystemTag(tagNames[iTag])) {
                            //If we have more room in the top list, add to top list; otherwise, add to other list
                            if ($scope.tags[cat].top.length < numberOfTopTags) {
                                $scope.tags[cat].top.push(tagNames[iTag]);
                            }
                            else {
                                $scope.tags[cat].other.push(tagNames[iTag]);
                            }
                        }
                    }

                    //Sort all tag lists alphabetically (previously sorted by usage counts)
                    for(cat in $scope.tags) {
                        for(var list in $scope.tags[cat]) {
                            $scope.tags[cat][list].sort();
                        }
                    }
                });

            // Toggle sidebar
            $('[data-toggle="offcanvas"]').click(function () {
                $('.row-offcanvas').toggleClass('active');
            });

            // When the sidebar is open on a small device, collapse it when user navigates
            $(document).on('click','.row-offcanvas',function(e) {
                if( $(e.target).is('a') ) {
                    $('.row-offcanvas').removeClass('active');
                }
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
        }])
        // Add this directive to a form element we want to focus on page load.
        // The code will watch for it, focus it, then stop watching.
        .directive('focusOnLoad', function($timeout) {
            return {
                link: function(scope, element) {
                    var clearWatch = scope.$watch(
                        function() { return element; },
                        function() {
                            if (element[0]) {
                                element[0].focus();
                                clearWatch();
                            }
                        }
                    );
                }
            };
        });

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
   ['$rootScope', '$state', '$stateParams', 'sharedService', 'localStorageService', '$location',
   function ($rootScope, $state, $stateParams, sharedService, localStorageService, $location) {
	//lets you write ng-click="log('testing')"
	$rootScope.log = function (variable) {
		console.log(variable);
	};

	//lets you write ng-click="alert('testing')"
	$rootScope.alert = function (text) {
		alert(text);
	};

    $rootScope.$on('$locationChangeStart', function (event, newUrl, oldUrl) {
        // For more info, see comment on pdfoverlay directive (below)
        if ($.fancybox.isActive && oldUrl.indexOf('preview=true') > 0) {
            // On history navigation, close Preview and stay on detail page
            $.fancybox.close();
        }
    });

	$rootScope.$on('$stateChangeSuccess', function (event, current, previous) {
		if (current.title) {
			$rootScope.pageTitle = "Bloom - " + current.title;
		} else {
			$rootScope.pageTitle = "Bloom";
		}
    });

    // Set up segment.io analytics
    // The first line is boilerplate stuff from segment.io.  It is only modified to adhere to strict mode.
    // I don't know everything it does, but one thing is it stores up any calls made before the analytics object is fully initialized.
    // Once the object is initialized, it runs through the queue.  This prevents script errors during load.
    window.analytics=window.analytics||[],window.analytics.methods=["identify","group","track","page","pageview","alias","ready","on","once","off","trackLink","trackForm","trackClick","trackSubmit"],window.analytics.factory=function(t){return function(){var a=Array.prototype.slice.call(arguments);return (a.unshift(t),window.analytics.push(a),window.analytics);};};for(var i=0;i<window.analytics.methods.length;i++){var key=window.analytics.methods[i];window.analytics[key]=window.analytics.factory(key);}window.analytics.load=function(t){if(!document.getElementById("analytics-js")){var a=document.createElement("script");a.type="text/javascript",a.id="analytics-js",a.async=!0,a.src=("https:"===document.location.protocol?"https://":"http://")+"cdn.segment.io/analytics.js/v1/"+t+"/analytics.min.js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(a,n);}},window.analytics.SNIPPET_VERSION="2.0.9",
    // Development: vidljptawu, Production: a6nswpue7x
    window.analytics.load(!sharedService.isPublicSite || localStorageService.get('trackLiveAnalytics') === "false" ? "vidljptawu" : "a6nswpue7x");

	// It's very handy to add references to $state and $stateParams to the $rootScope
	// so that you can access them from any scope within your applications.For example,
	// <li ng-class="{ active: $state.includes('contacts.list') }"> will set the <li>
	// to active whenever 'contacts.list' or one of its descendants is active.
	$rootScope.$state = $state;
	$rootScope.$stateParams = $stateParams;
   } ]);


    // The main problem being solved with onClick, afterClose, and $locationChangeStart (above) is ensuring that
    // whether the user closes the preview or hits the back button, we end up on the detail page with the preview closed.
    // Clicking preview adds preview=true to the url effectively adding another item to the history stack.
    // When the user closes the preview, we call history.back to ensure url is the detail page.
    // If the user clicks back when the preview is open, the $locationChangeStart event (above) is used to close the preview.
    // preview=true is required to ensure we don't try to perform a duplicate action (closing preview or going back).
	BloomLibraryApp.directive('pdfoverlay', ['$location', function ($location) {
		return {
			restrict: 'A',
			link: function (scope, element, attrs) {
				$(element).fancybox({
					'overlayShow': true,
                    'helpers':{title: { type:'inside', position:'top'}},
                    // The title comes from an overlayTitle attribute in the element with the pdfoverlay directive, e.g.,
                    // in detail.tpl.html for the Preview button. So it can't contain HTML. We insert markup here
                    // to put an Info icon in front, interpret [] as requesting bold, and interpret | as line
                    // breaks.
                    afterLoad: function() {
                        var title = '';
                        try {
                            title = this.element.context.attributes['overlayTitle'].value;
                        }
                        catch(_) {}
                        if(!title) {
                            return;  // if it's empty don't insert the icon etc.
                        }
                        var temp=title.replace('[', '<b>').replace(']', '</b>').split('|');
                        var result = '<table><tbody><tr><td><i class="icon-info-sign" style="font-size:5em;margin-right:12px;position:relative;top:-4px"></i></td><td>';
                        for(var i = 0; i < temp.length; i++){
                            var after = '';
                            if (i === temp.length - 1) {
                                after = ' style="margin-bottom:10px"';
                            }
                            result += '<div' + after +  '>' + temp[i] + '</div>';
                        }
                        result += '</td></tr></tbody></table>';
                        this.title = result;
                    },
					'type': 'iframe',
					iframe: {
						preload: false
					},
                    afterClose: function() {
                        if ($location.search().preview) {
                            history.back();
                        }
                    }
				});
                $(element).on('click', function(e) {
                    $location.search('preview', 'true');
                });
			}
		};
	}]);
} ());  // end wrap-everything function