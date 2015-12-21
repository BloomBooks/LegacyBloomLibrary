(function () { // to wrap use strict
	'use strict';
	angular.module('BloomLibraryApp.browse', ['ui.router', 'restangular'])//, 'BloomLibraryApp.detail'])
	.config(['$stateProvider', function config($stateProvider) {

		$stateProvider.state('browse', {
			parent: 'requireLoginResolution',
			//review: I had wanted to have the main view be named, and have the name be 'main', but then nothing would show
			//it's as if the top level view cannot be named. (note that you can specify it by saying views: {'@':
			url: "/browse?search&shelf&lang&langname&tag&allLicenses",
			templateUrl: 'modules/browse/browse.tpl.html',
			controller: 'BrowseCtrl',
			title: 'Book Library of Free Shell Books'
		});
	} ])
    .filter('getDisplayName', ['tagService', function(tagService) {
        return function(input) {
            return tagService.getDisplayName(input);
        };
    }])

	//we get a json list like ['me','you'] and we return 'me, you'
	.filter('makeCommaList', function () {
		return function (input) {
			return input == null ? "" : input.join(", ");
		};
	})

	.filter('makeThumbnailUrl', function () {
		return function (baseUrl) {
			if (!baseUrl) {
				return "";
			}
			return baseUrl + "thumbnail-70.png";
		};
	})
	.filter('makeDetailSizedThumbnailUrl', function () {
		return function (baseUrl) {
			if (!baseUrl) {
				return "";
			}
			return baseUrl + "thumbnail-256.png";
		};
	});

	angular.module('BloomLibraryApp.browse')
	.controller('BrowseCtrl', ['$scope', '$timeout', 'bookService', 'languageService', 'tagService', '$state', '$stateParams', 'bookCountService',
		function ($scope, $timeout, bookService, languageService, tagService, $state, $stateParams, bookCountService) {

		$scope.searchText = $stateParams["search"];
        $scope.shelfName = $stateParams["shelf"];
        $scope.lang = $stateParams["lang"];
        $scope.langName = $stateParams["langname"];
        $scope.tag = $stateParams["tag"];
        $scope.allLicenses = $stateParams["allLicenses"] === "true";
        $scope.numHiddenBooks = 0;
        $scope.otherLanguagesHidden = true;
        $scope.otherTopicsHidden = true;
        $scope.searchTextRaw = $scope.searchText;
		// if the service book count changes (e.g., because detailView deletes a book),
		// update our scope's bookCount so the list view which is watching it will reload its page.
		$scope.bookCountObject = bookCountService.getCount();
        if (!$scope.initialized) {
            // This helps prevent a count (e.g., from a previous search) continuing to take effect
            // before we have figured out our new count.
            $scope.bookCountObject.bookCount = 0;
        }
		$scope.$watch('bookCountObject.bookCount', function() {
			$scope.bookCount = $scope.bookCountObject.bookCount;
		});

        $scope.toggleVisibilityOfOtherLanguages = function(event) {
            var list = event.currentTarget.nextElementSibling;

            $(list).slideToggle();
            $scope.otherLanguagesHidden = !$scope.otherLanguagesHidden;
        };

        $scope.toggleVisibilityOfOtherTopics = function(event) {
            var list = event.currentTarget.nextElementSibling;

            $(list).slideToggle();
            $scope.otherTopicsHidden = !$scope.otherTopicsHidden;
        };

        $scope.localizeMore = function(count,hidden) {
            if (hidden) {
                return _localize("{count} more...", {count:count});
            } else {
                return _localize("{count} more:", {count:count});
            }
        };

        function getBookMessage(count) {
            var message = "";
            var shelfLabel = $scope.shelfName;
            if ($scope.shelfName === 'Featured') {
                shelfLabel = 'Featured';
            } else if ($scope.shelfName === '$recent') {
                shelfLabel = 'New Arrival';
            } else if ($scope.shelfName === '$myUploads') {
                shelfLabel = '\"My Upload\"';
            } else {
                shelfLabel = '';
            }
            shelfLabel = _localize(shelfLabel);
            var booksTranslation = _localize("books");
            var params = {
                count: count,
                shelf: shelfLabel,
                language: $scope.langName ? $scope.langName : languageService.getDisplayName($scope.lang),
                bookOrBooks: booksTranslation,
                tag: tagService.getDisplayName($scope.tag),
                searchText: $scope.searchText
            };
            if (count === 1) {
                params.bookOrBooks = _localize('book');
            }

            if (count === 0) {
                message = 'There are no books that match your search for ';
            } else {
                message = 'Found {count} ';
            }
            if (params.shelf !== '') {
                message += '{shelf} ';
            }
            if (params.language !== '') {
                message += '{language} ';
            }
            if (count === 0) {
                message += 'books';
            } else {
                message += '{bookOrBooks}';
            }
            if ($scope.tag) {
                message = message + ' with the {tag} tag';
            }
            if ($scope.searchText) {
                message = message + ' containing "{searchText}"';
            }
            return _localize(message, params);
        }
        function setHiddenBooksMessages() {
            if ($scope.allLicenses) {
                // None of the books are hidden, so we don't have a count to display.
                $scope.hiddenBooksMessage = _localize("Some of these books may have a restricted/unknown license.");
                $scope.hiddenBooksToggleMessage = _localize("Hide them.");
            } else {
                var hiddenCount = $scope.numHiddenBooks;
                var params = {
                    count: hiddenCount
                };
                if (hiddenCount === 1) {
                    $scope.hiddenBooksMessage = _localize("Hiding 1 other book because it has a restricted/unknown license.");
                    $scope.hiddenBooksToggleMessage = _localize("Show it.");
                } else {
                    $scope.hiddenBooksMessage = _localize("Hiding {count} other books because they have restricted/unknown licenses.", params);
                    $scope.hiddenBooksToggleMessage = _localize("Show them.");
                }
            }
        }
        function afterCount(count) {
            $scope.bookCount = $scope.bookCountObject.bookCount = count;
            $scope.bookMessage = getBookMessage(count);
            setHiddenBooksMessages();
            $scope.setPage = function () {};
            $scope.initialized = true;
        }
        $scope.getFilteredBookCount = function() {
            $scope.numHiddenBooks = 0;
            var promise = bookService.getFilteredBooksCount($scope.searchText, $scope.shelf, $scope.lang, $scope.tag, false, true);
            if ($scope.allLicenses) {
                promise.then(function (count) {
                    afterCount(count);
                });
            } else {
                promise.then(function (fullCount) {
                    bookService.getFilteredBooksCount($scope.searchText, $scope.shelf, $scope.lang, $scope.tag, false, false).then(function (ccCount) {
                        $scope.numHiddenBooks = fullCount - ccCount;
                        afterCount(ccCount);
                    });
                });
            }
        };
        // Every path in this 'if' should eventually call getFilteredBookCount(). We can't just move outside
        // because in at least one path we have to wait to call it after a promise is fulfilled.
        if ($scope.shelfName) {
            if ($scope.shelfName.substring(0,1) =='$')
            {
                // Not a real shelf, triggers a special query
                $scope.shelf = {name: $scope.shelfName};
                $scope.getFilteredBookCount();
            }
            else {
                // We need to retrieve the shelf object, and we can't run the query to get the count
                // until we get the result.
                bookService.getBookshelf($scope.shelfName).then(function (shelf) {
                    $scope.shelf = shelf;
                    $scope.getFilteredBookCount();
                });
                // Todo: what if no such shelf??
            }
        }
        else {
            $scope.getFilteredBookCount();
        }

		// browse.tpl.html listview div configures this to be called as pageItemsFunction when user chooses a page.
		$scope.getBookRange = function (first, count) {
            if (!$scope.initialized) {
                return; // can't do useful query.
            }
            // In the case of new arrivals, it's possible that an unmodified request would find more books
            // than are supposed to be in the list (e.g., with number of results set to 24, not an even divisor
            // of 50)
            if (first + count > $scope.bookCount) {count = $scope.bookCount - first;}
			bookService.getFilteredBookRange(first, count, $scope.searchText, $scope.shelf, $scope.lang, $scope.tag, $scope.allLicenses, "title", true).then(function (result) {
				//Remove system tags
				for(var iBook = 0; iBook < result.length; iBook++) {
					var book = result[iBook];
					tagService.hideSystemTags(book);
				}
				$scope.visibleBooks = result;
			});
		};

		$scope.SearchNow = function () {
			// Todo: this needs to run a query on the real database and update bookCount
			// and do something to make the listview invoke getBookRange (even if the bookCount
			// does not change).
            bookService.resetCurrentPage();
			$scope.searchText = $scope.searchTextRaw;
			$state.go('.', { search: $scope.searchText, shelf: "" });
		};

        $scope.toggleAllLicenses = function() {
            $scope.allLicenses = !$scope.allLicenses;
            $state.go($state.current, { allLicenses: $scope.allLicenses } );
        };
	} ]);
} ());   // end wrap-everything function