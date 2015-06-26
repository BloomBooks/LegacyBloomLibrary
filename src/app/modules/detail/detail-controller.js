(function () { // to wrap use strict
	'use strict';

	angular.module('BloomLibraryApp.detail', ['ui.router', "restangular"])
	.config(function config($urlRouterProvider, $stateProvider, $compileProvider) {
		// Tell angular that urls starting with bloom: and mailto: (and http{s}: of course) are OK. (Otherwise it marks them 'unsafe' and Chrome at
		// least won't follow them.). This is needed for the Open in Bloom button, mailto links. adding bloom is the unusual thing.
		// This seems to be global...any additions might need to go in other instances as well to make them work.
		$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|bloom|mailto):/);
        
        var detailModalInstance;
        
		$stateProvider.state('browse.detail', {
			url: "/detail/:bookId",
            views: {
                '@': {
                    templateUrl: 'modules/detail/detail.tpl.html',
                    controller: 'DetailCtrl'
                }
            }
		});
	})
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
		//we get a date string and return it more nicely formatted
		.filter('cleanDate', function () {
			return function (input) {
				return input == null ? "" : new Date(input).toLocaleDateString();
			};
		})
		//we get an email string and shorten it to make it give less away.
		.filter('obfuscate', function () {
			return function (input) {
				if(!input) {
					return "";
				}
				var index = input.lastIndexOf("@");
				if (index < 0 || index + 1 >= input.length){
					return input;
				}
				return input.substring(0, index + 1) + "...";
			};
		})
		// We get a book and return a string describing the languages it contains and
		// possibly explaining that the preview doesn't show them all.
		// The string may not contain HTML markup (must be valid for an attribute).
		// It may contain | for line breaks and [] to mark bold text (as interpreted by
		// the afterLoad function in the pdfoverlay directive).
		// If the book has no known languages or only one we return an empty string
		// (which triggers suppressing the info message altogether).
		.filter('previewLangInfo', function() {
			return function(book) {
				if (!book) {
					return "";
				}
				if (book.langPointers.length <= 1) {
					return "";
				}
				var langList = book.langPointers[0].name;
				for (var i = 1; i < book.langPointers.length; i++) {
					langList += ", " + book.langPointers[i].name;
				}
				return "This book contains the following source languages: [" + langList + "].|However the following preview provides a sample using just one of these languages.|Once you load this book in Bloom, you will see the text in the other language(s).";
			};
		})
		// we get a URL for the contents of the book and return the one for the Preview.
		// input url is .../BookName/
		// output is .../BookName/BookName.pdf.
		// (Except that both are url encoded, so the slashes appear as %2f.)
		.filter('makePreviewUrl', function () {
			return function (baseUrl) {
				if (baseUrl == null)
				{
					return null;
				}
//				var suffix =  "%2fthumbnail.png";
//				if (input.indexOf(suffix, input.length - suffix.length) < 0) // !endsWith(suffix)
//				{
//					return null;
//				}
//				var leadin = input.substring(0, input.length - suffix.length);
                var lastSlashIndex = baseUrl.lastIndexOf("%2f");
                var leadin = baseUrl.substring(0,lastSlashIndex);
                var slashBeforeBookName = leadin.lastIndexOf("%2f");
				if (slashBeforeBookName < 0)
				{
					return null;
				}
				var name = leadin.substring(slashBeforeBookName+3); // includes leading slash (%2f)
				return baseUrl + name + ".pdf";
			};
		});

	angular.module('BloomLibraryApp.detail').controller('DetailCtrl', ['$scope', 'authService', '$stateParams', 'bookService', 'bookCountService', 'tagService', '$modal', '$window',
	function ($scope, authService, $stateParams, bookService, bookCountService, tagService, $modal, $window) {
		$scope.canDeleteBook = false; // until we get the book and may make it true
		$scope.location = window.location.href; // make available to embed in mailto: links
		//get the book for which we're going to show the details
		bookService.getBookById($stateParams.bookId).then(function (book) {
			tagService.hideSystemTags(book);
			$scope.book = book;
			$scope.canDeleteBook = authService.isLoggedIn() && (authService.userName().toLowerCase() == book.uploader.email.toLowerCase() || authService.isUserAdministrator());
			//Get related books
			bookService.getRelatedBooks($stateParams.bookId).then(function(results) {
				if(results.length > 0) {
					$scope.book.relatedBooks = results[0].books.filter(function(relBook) {
						return relBook.objectId != $stateParams.bookId;
					});
				}
			});
		});
        $scope.canReportViolation = authService.isLoggedIn(); // We demand this to reduce spamming.
        $scope.canSetBookshelf = authService.isLoggedIn() && authService.bookShelves().length > 0;
        if ($scope.canSetBookshelf) {
            // Todo: this is a temporary way to show whether the book is in the shelf, based on the fact that
            // we currently have only one shelf. Hence the name, isBookFeatured.
            bookService.isBookInShelf($stateParams.bookId, authService.bookShelves()[0]).then(function(result) {
                $scope.isBookFeatured = result;
            });
        }

		$scope.showLicense = function() {
            if ($scope.book.license && $scope.book.license.indexOf('cc-') === 0) {
                var url = 'http://creativecommons.org/licenses/' + $scope.book.license.substring(3) + '/4.0';
                $window.open(url);
            } else {
                $modal.open({
                    templateUrl: 'modules/detail/ccdialog.tpl.html',
                    controller: 'ccdialog',
                    windowClass: 'ccmodal',
                    size: 'sm',
                    // this defines the value of 'book' as something that is injected into the BloomLibraryApp.ccdialog's
                    // controller, thus giving it access to the book whose license we want details about.
                    resolve: {book: function() {return $scope.book;}}
                });
            }
		};
		$scope.showPleaseLogIn = function() {
			$modal.open({
				templateUrl: 'modules/login/pleaseLogIn.tpl.html',
				controller: 'pleaseLogIn',
				windowClass: 'ccmodal'
			});
		};

		$scope.showDeleteDialog = function () {
			var deleteModalInstance = $modal.open({
				templateUrl: 'modules/detail/deleteDialog.tpl.html',
				controller: 'deleteDialog',
				windowClass: 'ccmodal deleteConfirm',
				// this defines the value of 'book' as something that is injected into the BloomLibraryApp.deleteDialog's
				// controller, thus giving it access to the book whose license we want details about.
				resolve: {book: function() {return $scope.book;}}
			});
			
			deleteModalInstance.result.then(function(result) {
				if (result) {
					bookService.deleteBook($scope.book.objectId).then(function() {
						var counts = bookCountService.getCount();
						counts.bookCount--;
						$window.history.back(); // object was deleted, back to browse.
					},
					function(error) {
						alert(error);
					});
				}
			});
		};
		
        $scope.chooseBookshelves = function() {
            // Todo: show a popup menu with all bookShelves and ones this book is in checked.
            // Failing that there should at least be some visual indication whether the book is in the shelf.
            var shelf = authService.bookShelves()[0];
            bookService.ToggleBookInShelf($scope.book, shelf);
            $scope.isBookFeatured = !$scope.isBookFeatured;
        };
	} ]);
} ());  // end wrap-everything function