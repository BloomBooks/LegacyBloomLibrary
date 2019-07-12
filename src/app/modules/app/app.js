(function() {
  // to wrap use strict
  "use strict";

  var BloomLibraryApp = angular
    .module("BloomLibraryApp", [
      "templates-app",
      "templates-common", // Required for ng-boilerplate, to use templates from templates-app.js instead of copying individual files.
      "BloomLibraryApp.browse",
      "BloomLibraryApp.detail",
      "BloomLibraryApp.login",
      "BloomLibraryApp.signup",
      "BloomLibraryApp.services",
      "BloomLibraryApp.datagrid",
      "BloomLibraryApp.confirmRelateDialog",
      "BloomLibraryApp.ccdialog",
      "BloomLibraryApp.download",
      "BloomLibraryApp.staticPages",
      "BloomLibraryApp.deleteDialog",
      "BloomLibraryApp.inProgress",
      "BloomLibraryApp.pleaseLogIn",
      "BloomLibraryApp.mustAgree",
      "BloomLibraryApp.installers",
      "BloomLibraryApp.errorMessage",
      "BloomLibraryApp.prefs",
      "BloomLibraryApp.reportBook",
      "ui.bootstrap",
      "ui.bootstrap.modal",
      "ui.router",
      "palaso.ui.listview",
      "restangular",
      "ngCookies",
      "LocalStorageModule",
      "angulartics",
      "angulartics.segment.io"
    ])

    .config([
      "$urlRouterProvider",
      "$stateProvider",
      "$locationProvider",
      function($urlRouterProvider, $stateProvider, $locationProvider) {
        $stateProvider.state("requireLoginResolution", {
          abstract: true,
          resolve: {
            login: [
              "authService",
              function(authService) {
                if (!authService.isLoggedIn()) {
                  return authService.tryLogin();
                }
                return;
              }
            ]
          },
          template: "<ui-view/>"
        });

        //review/experiment: note that I was talking to locationProvider here, even though
        // we are using the alternative system, ui-router.
        // this may be relevant: http://stackoverflow.com/questions/24087188/ui-routers-urlrouterprovider-otherwise-with-html5-mode
        // For now, I've commented this out

        //  .config(['$urlRouterProvider', '$stateProvider', '$locationProvider',
        //       function ($urlRouterProvider, $stateProvider, $locationProvider) {

        //on amazon s3, we've done the redirection like that described here: http://stackoverflow.com/a/16877231/723299
        $locationProvider.html5Mode(true);
        //			$locationProvider.hashPrefix('!');

        //			// For any unmatched url, redirect to /state1
        $urlRouterProvider.otherwise("/landing");
      }
    ])

    .controller("HeaderCtrl", [
      "$scope",
      "authService",
      "$location",
      "$state",
      "silNoticeService",
      "$rootScope",
      "$cookies",
      function(
        $scope,
        authService,
        $location,
        $state,
        silNoticeService,
        $rootScope,
        $cookies
      ) {
        $scope.location = $location.path();
        $scope.isLoggedIn = authService.isLoggedIn;

        $scope.logout = function() {
          authService.logout();
          silNoticeService.clear();
          // Collapse navbar if in collapsible state.  Needed because logout isn't present when event handler below is attached.
          $(".navbar-collapse.in").collapse("hide");
          $state.go("browse");
        };

        // Used to determine the active menu item
        $scope.isActive = function(viewLocation) {
          return viewLocation === $location.path();
        };
        // We store this in rootScope so it is accessible to some code that needs it in installers-controller.js
        $rootScope.highContrast = $cookies["highContrast"]; // correctly false if not recorded
        $scope.$watch("$viewContentLoaded", function() {
          if ($rootScope.highContrast) {
            document.body.classList.add("high-contrast"); // make use of cookie
          }
        });
        $scope.toggleHighContrast = function() {
          $rootScope.highContrast = !$rootScope.highContrast;
          $cookies["highContrast"] = $rootScope.highContrast;
          if ($rootScope.highContrast) {
            document.body.classList.add("high-contrast");
            // The installers page has some iframes that hold generated documents with links for
            // installing the latest version of Bloom in various channels.
            // Because they are in an iframe, they ignore the high-contrast class on the root body.
            // So we need to put the class on their own body.
            // Unfortunately, we may not be currently in the downloads page, so these iframes
            // may not be present; therefore, we have to do something similar in the code that
            // runs when that page is activated.
            // Even more unfortunately, this code simply fails when debugging local builds;
            // it is considered a security violation for code running in a localhost: scope
            // to try to manipulate the DOM of a page whose source is on bloomlibrary.org.
            // ("cross-domain scripting"). If you really need to test this out on a local build,
            // or work on it, the only way I found is to make local copies of the documents
            // that are the contents of the iframes, and temporarily change the links to use them.
            $("iframe").each(function(index, iframe) {
              if (iframe.contentWindow && iframe.contentWindow.document) {
                iframe.contentWindow.document.body.classList.add(
                  "high-contrast"
                );
              }
            });
          } else {
            document.body.classList.remove("high-contrast");
            $("iframe").each(function(index, iframe) {
              if (iframe.contentWindow && iframe.contentWindow.document) {
                iframe.contentWindow.document.body.classList.remove(
                  "high-contrast"
                );
              }
            });
          }
        };
        $scope.showingHighContrast = function() {
          return $rootScope.highContrast;
        };

        $scope.isBookLibrary = function() {
          return (
            $.inArray($location.path(), [
              "/landing",
              "/features",
              "/installers",
              "/installers/old",
              "/installers/linux",
              "/artofreading",
              "/support",
              "/about",
              "/opensource",
              "/terms",
              "/privacy",
              "/infringement"
            ]) === -1
          );
        };

        // When the navbar is open on a small device (i.e. shown vertically),
        // collapse it when user navigates
        $(document).on("click", ".navbar-collapse.in", function(e) {
          if ($(e.target).is("a") && !$(e.target).hasClass("dropdown-toggle")) {
            $(this).collapse("hide");
          }
        });

        $scope.userName = authService.userName;
      }
    ])
    .controller("FooterCtrl", [
      "$scope",
      "$location",
      function($scope, $location) {
        $scope.year = new Date().getFullYear().toString();

        // Used to determine the active link
        $scope.isActive = function(viewLocation) {
          return viewLocation === $location.path();
        };
      }
    ])
    .controller("LeftSidebar", [
      "$scope",
      "$state",
      "$location",
      "$rootScope",
      "bookService",
      "languageService",
      "tagService",
      "authService",
      "$modal",
      function(
        $scope,
        $state,
        $location,
        $rootScope,
        bookService,
        languageService,
        tagService,
        authService,
        $modal
      ) {
        $scope.currentLang = $location.$$search.lang;
        $scope.currentLangName = $location.$$search.langname;
        $scope.currentTag = $location.$$search.tag;
        $scope.currentShelfKey = $location.$$search.shelf;
        $scope.wantLeftBar = $location.$$path.substring(1, 7) == "browse";
        $scope.isLoggedIn = authService.isLoggedIn();
        $rootScope.$on("$locationChangeSuccess", function() {
          $scope.currentLang = $location.$$search.lang;
          $scope.currentLangName = $location.$$search.langname;
          $scope.currentTag = $location.$$search.tag;
          $scope.currentShelfKey = $location.$$search.shelf;
          $scope.wantLeftBar = $location.$$path.substring(1, 7) == "browse";
        });
        $scope.showInProgress = function() {
          $modal.open({
            templateUrl: "modules/inProgress/inProgress.tpl.html",
            controller: "inProgress",
            windowClass: "ccmodal"
          });
        };
        $scope.filterLanguage = function(language, languageName) {
          bookService.resetCurrentPage();
          $state.go("browse", { lang: language, langname: languageName }); // keep other params unchanged.
        };
        $scope.filterTag = function(tagName) {
          bookService.resetCurrentPage();
          $state.go("browse", { tag: tagName }); // keep other params unchanged.
        };
        $scope.filterShelf = function(shelfName) {
          bookService.resetCurrentPage();
          if (shelfName === "") {
            // User selected "All Books"
            $state.go("browse", {
              search: "",
              shelf: shelfName,
              lang: "",
              langname: "",
              tag: "",
              features: ""
            });
          } else {
            $state.go("browse", { search: "", shelf: shelfName }); // keep other params unchanged.
          }
        };
        $scope.filterMyUploads = function() {
          bookService.resetCurrentPage();
          if (authService.isLoggedIn()) {
            $state.go("browse", { search: "", shelf: "$myUploads" }); // keep other params unchanged.
          } else {
            $scope.showPleaseLogIn();
          }
        };

        // Sadly duplicated in detail controller
        $scope.showPleaseLogIn = function() {
          $modal.open({
            templateUrl: "modules/login/pleaseLogIn.tpl.html",
            controller: "pleaseLogIn",
            windowsClass: "ccmodal"
          });
        };

        languageService.getLanguages().then(function(languages) {
          //Go ahead and localize languages so that they sort properly
          languages = languages.map(function(lang) {
            lang.name = _localize(lang.name);
            return lang;
          });

          //This is the number of displayed languages on the browse sidebar before (n more...)
          var numberOfTopLanguages = 4;

          function compareLang(a, b) {
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
          }

          //If all languages can be held in the top list, just fill the top list
          if (languages.length <= numberOfTopLanguages) {
            $scope.topLanguages = languages.sort(compareLang);
            $scope.otherLanguages = [];
          } else {
            //Split the list of languages into top and other, and sort the lists alphabetically
            $scope.topLanguages = languages
              .slice(0, numberOfTopLanguages)
              .sort(compareLang);
            $scope.otherLanguages = languages
              .slice(numberOfTopLanguages, languages.length)
              .sort(compareLang);
          }

          //Search through otherLanguages
          for (var i = 0; i < $scope.otherLanguages.length; i++) {
            //If the currentLang is in the other list, add it to the top (visible) list
            if (
              $scope.otherLanguages[i].isoCode == $scope.currentLang &&
              (!$scope.currentLangName ||
                $scope.otherLanguages[i].name == $scope.currentLangName)
            ) {
              $scope.topLanguages.unshift(
                $scope.otherLanguages.splice(i, 1)[0]
              );
              $scope.topLanguages.sort(compareLang);
              break;
            }
          }
        });

        bookService.getBookshelves().then(function() {
          // The call to getBookshelves() populates $rootScope.cachedAndLocalizedBookshelves
          var bookshelves = $rootScope.cachedAndLocalizedBookshelves;

          $scope.visibleBookshelves = bookshelves.filter(function(bookshelf) {
            return bookshelf.normallyVisible;
          });
          $scope.otherBookshelves = bookshelves.filter(function(bookshelf) {
            return !bookshelf.normallyVisible;
          });

          // Make sure there is a shelf with the category name
          function insertParentShelf(shelfList, indexOfChildShelf, prefix) {
            var i = indexOfChildShelf - 1;
            for (; i >= 0; i--) {
              if (!shelfList[i].isChild) {
                if (shelfList[i].displayName === prefix) {
                  // already have suitable parent, make sure it's key
                  // will trigger including children (assuming keys are
                  // assigned in a sensible and consistent way)
                  if (shelfList[i].key[shelfList[i].key.length - 1] != "/") {
                    shelfList[i].key = shelfList[i].key + "/";
                  }
                  return false;
                }
                break;
              }
            }
            // need a new shelf at index i+1 with displayName prefix
            // use the child as a model
            var newShelf = jQuery.extend({}, shelfList[indexOfChildShelf]);
            newShelf.displayName = newShelf.englishName = prefix;
            newShelf.isChild = false;
            // Make the parent shelf have a key that is the first part of the child key,
            // up to and INCLUDING the slash. The slash triggers behavior in services.js
            // MakeQuery() to retrive all books belonging to shelves which start with this key.
            var index = newShelf.key.indexOf("/");
            if (index > 0) {
              newShelf.key = newShelf.key.substring(0, index + 1);
            }
            shelfList.splice(i + 1, 0, newShelf);
            return true;
          }

          // Give every shelf a displayName and set isChild true or false
          // Any shelf in the list whose name contains a slash should be adjusted:
          // - displayName is shortened to the part after the slash
          // - isChild is set to true
          // - we make sure it has an appropriate parent whose displayName is the
          // part of the name before the slash.
          function handleIndent(shelfList) {
            for (var i = 0; i < shelfList.length; i++) {
              var shelf = shelfList[i];
              shelf.displayName = shelf.englishName;
              shelf.isChild = false;
              var index = shelf.englishName.indexOf("/");
              if (index >= 0) {
                var prefix = shelf.displayName.substring(0, index);
                shelf.isChild = true;
                shelf.displayName = shelf.displayName.substring(index + 1);
                setOrganizationNameIfAvailable(shelf);
                if (insertParentShelf(shelfList, i, prefix)) {
                  i++;
                }
              }
            }
          }

          function setOrganizationNameIfAvailable(shelf) {
            var entireName = shelf.displayName;
            var index = entireName.indexOf("_");
            if (index < 0 || entireName.length < index + 2) {
              return;
            }
            var org = entireName.substring(index + 1);
            var mainName = entireName.substring(0, index);
            shelf.orgName = org;
            shelf.displayName = mainName;
          }

          handleIndent($scope.visibleBookshelves);
          handleIndent($scope.otherBookshelves);

          // If the current selection is in otherBookshelves make sure they are not collapsed.
          for (var i = 0; i < $scope.otherBookshelves.length; i++) {
            if ($scope.otherBookshelves[i].key == $scope.currentShelfKey) {
              $scope.otherLanguagesHidden = false;
              $("#otherBookshelves").show();
              break;
            }
          }
        });

        //This is the global list of all categories of tags.
        //The tags are separated out by these categories on the sidebar of the browse view.
        //id is the usage in the tag (e.g. "region" in "region:MyRegion") and displayName is the header.
        var topicId = "topic";
        $scope.tagCategories = [
          { id: topicId, displayName: "Topics" },
          { id: "region", displayName: "Regions" },
          { id: "level", displayName: "Reading Levels" }
        ];

        //This is the object which will hold all of the tag names
        $scope.tags = { topic: { top: [], other: [] } };

        tagService.getTags().then(function(tags) {
          //This is the number of tags that will be shown in each category of tag before the (n more...)
          //Currently this is set at 100 to prevent "other" list from showing
          var numberOfTopTags = 100;

          //Convert tag to object with database name and localized name
          function makeTagObject(tagName) {
            return {
              id: tagName,
              displayName: _localize(tagService.getDisplayName(tagName))
            };
          }

          //Get the names out of the tags; we don't care about the other properties
          var tagNames = tags.map(function(item) {
            return item.name;
          });

          var iTag, iCat, cat;
          var categoryRegex = {};

          //Set up objects and regexes to save processing time
          for (iCat = 0; iCat < $scope.tagCategories.length; iCat++) {
            cat = $scope.tagCategories[iCat].id;
            $scope.tags[cat] = { top: [], other: [] };
            categoryRegex[cat] = new RegExp("^" + cat + ":");
          }

          //Loop through tags
          for (iTag = 0; iTag < tagNames.length; iTag++) {
            //Check if tag belongs to a category
            for (iCat = 0; iCat < $scope.tagCategories.length; iCat++) {
              cat = $scope.tagCategories[iCat].id;
              if (categoryRegex[cat].test(tagNames[iTag])) {
                break;
              }
            }

            //If we didn't find a category tag belongs to
            if (iCat >= $scope.tagCategories.length) {
              if (tagService.isTopicTag(tagNames[iTag])) {
                // Legacy topics didn't have a prefix, thus we need this special check.
                // At some point in the future when all topic tags in the database have
                // the prefix, this check can be removed.
                cat = topicId;
              } else {
                // Don't include it
                continue;
              }
            }

            //Only add tag to list if not a system tag
            if (!tagService.isSystemTag(tagNames[iTag])) {
              //If we have more room in the top list, add to top list; otherwise, add to other list
              if ($scope.tags[cat].top.length < numberOfTopTags) {
                $scope.tags[cat].top.push(makeTagObject(tagNames[iTag]));
              } else {
                $scope.tags[cat].other.push(makeTagObject(tagNames[iTag]));
              }
            }
          }

          function compareTagObjects(a, b) {
            return a.displayName
              .toLowerCase()
              .localeCompare(b.displayName.toLowerCase());
          }

          //Sort all tag lists alphabetically (previously sorted by usage counts)
          for (cat in $scope.tags) {
            for (var list in $scope.tags[cat]) {
              $scope.tags[cat][list].sort(compareTagObjects);
            }
          }
        });

        // Toggle sidebar
        $('[data-toggle="offcanvas"]').click(function() {
          $(".row-offcanvas").toggleClass("active");
        });

        // When the sidebar is open on a small device, collapse it when user navigates
        $(document).on("click", ".row-offcanvas", function(e) {
          if ($(e.target).is("a")) {
            $(".row-offcanvas").removeClass("active");
          }
        });
      }
    ])
    .controller("CarouselCtrl", [
      "$scope",
      function($scope) {
        $scope.myInterval = 10000;
        var slides = ($scope.slides = []);
        slides.push({
          image: "assets/class.jpg",
          text:
            "Learning to read takes books. Learning to read well, and developing a love of reading, takes lots of books.  Books at all different skill levels. But how are low-literacy language communities ever to get all those books in their language?  They can do it with Bloom."
        });
        slides.push({
          image: "assets/shellbook.png",
          text:
            "Bloom keeps things simple and efficient by offering a library of shell books. You just translate from a source language, and print."
        });
      }
    ])
    // Add this directive to a form element we want to focus on page load.
    // The code will watch for it, focus it, then stop watching.
    .directive("focusOnLoad", function($timeout) {
      return {
        link: function(scope, element) {
          var clearWatch = scope.$watch(
            function() {
              return element;
            },
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
  BloomLibraryApp.filter("startFrom", function() {
    return function(input, start) {
      start = +start; //parse to int
      if (input) {
        return input.slice(start);
      } else {
        return "";
      }
    };
  });

  //review: adding functions here is probably not angularjs best practice (but I haven't learned what the correct way would be, just yet)
  BloomLibraryApp.run([
    "$rootScope",
    "$state",
    "$stateParams",
    "sharedService",
    "localStorageService",
    "$location",
    "$transitions",
    function(
      $rootScope,
      $state,
      $stateParams,
      sharedService,
      localStorageService,
      $location,
      $transitions
    ) {
      //lets you write ng-click="log('testing')"
      $rootScope.log = function(variable) {
        console.log(variable);
      };

      //lets you write ng-click="alert('testing')"
      $rootScope.alert = function(text) {
        alert(text);
      };

      $rootScope.$on("$locationChangeStart", function(event, newUrl, oldUrl) {
        // For more info, see comment on viewoverlay directive (below)
        if ($.fancybox.isActive && oldUrl.indexOf("overlay=true") > 0) {
          // On history navigation, close view overlay and stay on detail page
          $.fancybox.close();
        }
      });

      $transitions.onSuccess({}, function(transition) {
        var title = transition.to().title;
        if (title) {
          $rootScope.pageTitle = "Bloom - " + title;
        } else {
          $rootScope.pageTitle = "Home";
        }
      });

      // Set up segment.io analytics
      // The first line is boilerplate stuff from segment.io.  It is only modified to adhere to strict mode.
      // I don't know everything it does, but one thing is it stores up any calls made before the analytics object is fully initialized.
      // Once the object is initialized, it runs through the queue.  This prevents script errors during load.
      //prettier-ignore
      window.analytics=window.analytics||[],window.analytics.methods=["identify","group","track","page","pageview","alias","ready","on","once","off","trackLink","trackForm","trackClick","trackSubmit"],window.analytics.factory=function(t){return function(){var a=Array.prototype.slice.call(arguments);return (a.unshift(t),window.analytics.push(a),window.analytics);};};
      for (var i = 0; i < window.analytics.methods.length; i++) {
        var key = window.analytics.methods[i];
        window.analytics[key] = window.analytics.factory(key);
      }
      /* jshint -W014 */
      (window.analytics.load = function(t) {
        if (!document.getElementById("analytics-js")) {
          var a = document.createElement("script");
          (a.type = "text/javascript"),
            (a.id = "analytics-js"),
            (a.async = !0),
            (a.src =
              ("https:" === document.location.protocol
                ? "https://"
                : "http://") +
              "cdn.segment.io/analytics.js/v1/" +
              t +
              "/analytics.min.js");
          var n = document.getElementsByTagName("script")[0];
          n.parentNode.insertBefore(a, n);
        }
      }),
        (window.analytics.SNIPPET_VERSION = "2.0.9"),
        // Development: vidljptawu, Production: a6nswpue7x
        //prettier-ignore
        window.analytics.load(!sharedService.isProductionSite || localStorageService.get('trackLiveAnalytics') === "false" ? "vidljptawu" : "a6nswpue7x");

      // It's very handy to add references to $state and $stateParams to the $rootScope
      // so that you can access them from any scope within your applications.For example,
      // <li ng-class="{ active: $state.includes('contacts.list') }"> will set the <li>
      // to active whenever 'contacts.list' or one of its descendants is active.
      $rootScope.$state = $state;
      $rootScope.$stateParams = $stateParams;
    }
  ]);

  // The main problem being solved with onClick, afterClose, and $locationChangeStart (above) is ensuring that
  // whether the user closes the overlay or hits the back button, we end up on the detail page with the overlay closed.
  // Clicking Read (or PDF when not harvested) adds overlay=true to the url effectively adding another item to the history stack.
  // When the user closes the overlay, we call history.back to ensure url is the detail page.
  // If the user clicks back when the overlay is open, the $locationChangeStart event (above) is used to close the overlay.
  // overlay=true is required to ensure we don't try to perform a duplicate action (closing overlay or going back).
  BloomLibraryApp.directive("viewoverlay", [
    "$location",
    function($location) {
      return {
        restrict: "A",
        link: function(scope, element, attrs) {
          // A window message listener function possibly added in afterLoad and removed in
          // afterClose. It listens for messages from bloom-player and handles them.
          var listener = function(data) {
            var message = JSON.parse(data.data);
            var messageType = message.messageType;
            // Upon request, tell the player we can handle a request to go back (so it should
            // show the back button).
            if (messageType === "requestCapabilities") {
              var iframe = document.getElementsByClassName(
                "fancybox-iframe"
              )[0];
              iframe.contentWindow.postMessage(
                JSON.stringify({
                  messageType: "capabilities",
                  canGoBack: true
                }),
                "*"
              );
            } else if (messageType === "backButtonClicked") {
              $.fancybox.close();
            }
          };
          $(element).fancybox({
            padding: 0,
            overlayShow: true,
            helpers: {
              title: { type: "inside", position: "top" },
              overlay: { closeClick: false } // prevents closing when clicking OUTSIDE fancybox
            },
            afterLoad: function() {
              var book = scope.book;
              // Directives "normalize" the attribute names, so data-view-type became viewType
              var viewType = attrs.viewType ? attrs.viewType : "";
              if (
                book &&
                book.langPointers &&
                book.langPointers.length > 1 &&
                viewType !== "read"
              ) {
                var languageList = _localize(book.langPointers[0].name);
                for (var i = 1; i < book.langPointers.length; i++) {
                  languageList += ", " + _localize(book.langPointers[i].name);
                }
                var titleHtml =
                  '<table id="previewTitle"><tbody><tr><td><i class="icon-info-sign"></i></td><td>';
                titleHtml +=
                  // Without the 'notranslate' class, Transifex Live picks up the string with the language list added
                  // and asks us to add it to the list of strings which need translation. Calling _localize
                  // ensures we can still translate the string with the placeholder.
                  "<div class='notranslate'>" +
                  _localize(
                    "This book contains the following source languages: <b>{languageList}</b>.",
                    { languageList: languageList }
                  ) +
                  "</div>";
                titleHtml +=
                  "<div>However the following preview provides a sample using just one of these languages.</div>";
                titleHtml +=
                  "<div>Once you load this book in Bloom, you will see the text in the other language(s).</div>";
                titleHtml += "</td></tr></tbody></table>";
                this.title = titleHtml;
              }
              if (viewType === "read") {
                // Listen for messages from the player
                window.addEventListener("message", listener);
              }
            },
            type: "iframe",
            iframe: {
              preload: false
            },
            afterClose: function() {
              if ($location.search().overlay) {
                history.back();
              }
              window.removeEventListener("message", listener);
            }
          });
          $(element).on("click", function(e) {
            $location.search("overlay", "true");
          });
        }
      };
    }
  ]);
})(); // end wrap-everything function
