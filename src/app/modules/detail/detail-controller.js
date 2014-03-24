(function () { // to wrap use strict
	'use strict';

	angular.module('BloomLibraryApp.detail', ['ui.router', "restangular"])
	.config(function config($urlRouterProvider, $stateProvider, $compileProvider) {
		// Tell angular that urls starting with bloom: and mailto: (and http{s}: of course) are OK. (Otherwise it marks them 'unsafe' and Chrome at
		// least won't follow them.). This is needed for the Open in Bloom button, mailto links. adding bloom is the unusual thing.
		// This seems to be global...any additions might need to go in other instances as well to make them work.
		$compileProvider.urlSanitizationWhitelist(/^\s*(https?|bloom|mailto):/);
		// For angular 1.2 this should be changed to
		//$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|bloom|mailto):/);
		$stateProvider.state('browse.detail', {
			url: "/detail/:bookId",
			onEnter: function ($dialog, $state) {

				$dialog.dialog(
					{
						backdrop: true,
						keyboard: true, //make ESC close it
						backdropClick: true, //make clicking on the backdrop close it
						templateUrl: 'modules/detail/detail.tpl.html',
						controller: 'DetailCtrl'
					}).open().then(function (result) {
						// Return to browse view when detail closes. Adding $state.params preserves
						// any current filter parameters the browser view was using, such as the search string.
						// The result passed to the call to close() indicates whether we need to force
						// a reload of the browse view (i.e., when we have deleted a book).
						if (result) {
							// don't try to go back to deleted book.
							// What we really want to do here is to remove the bookId from params.
							// (But we need a new object.)
							// Currently, search is the only property we need to keep.
							var params = {};
							params.search = $state.params.search;
							$state.transitionTo("browse", params);
						}
					});
			}
		});
	})
		//we get a json list like ['pdc','en', 'fr'] and we return ['pdc, English, French']
		// Enhance: use some localizable mechanism
		.filter('prettyLang', function () {
			return function (input) {
				var result = [];
				if (input == null)
				{
					return result;
				}
				var len = input.length;
				for (var i = 0; i < len; i++)
				{
					switch(input[i])
					{
						case "en": result[i] = "English";
							break;
						case "fr": result[i] = "French";
							break;
						case "es": result[i] = "Spanish";
							break;
						case "de": result[i] = "German";
							break;
						case "zh": result[i] = "Chinese";
							break;
						case "ja": result[i] = "Japanese";
							break;
						case "ko": result[i] = "Korean";
							break;
						case "pt": result[i] = "Portuguese";
							break;
						case "ru": result[i] = "Russian";
							break;
						default: result[i] = input[i];
							break;
					}
				}
				return result;
			};
		})
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
				if (index < 0 || index + 3 >= input.length){
					return input;
				}
				return input.substring(0, index + 3);
			};
		})
		// we get a URL for the thumbnail and return the one for the Preview.
		// input url is .../BookName/thumbnail.png
		// output is .../BookName/BookName.pdf.
		// (Except that both are url encoded, so the slashes appear as %2f.)
		.filter('thumbToPreview', function () {
			return function (input) {
				if (input == null)
				{
					return null;
				}
				var suffix =  "%2fthumbnail.png";
				if (input.indexOf(suffix, input.length - suffix.length) < 0) // !endsWith(suffix)
				{
					return null;
				}
				var leadin = input.substring(0, input.length - suffix.length);
				var lastSlash = leadin.lastIndexOf("%2f");
				if (lastSlash < 0)
				{
					return null;
				}
				var name = leadin.substring(lastSlash); // includes leading slash (%2f)
				return leadin + name + ".pdf";
			};
		});

	angular.module('BloomLibraryApp.detail').controller('DetailCtrl', ['$scope', 'authService', '$state', '$stateParams', 'dialog', '$dialog','bookService', '$location', '$cookies', 'bookCountService',

	// Argument names dialog and $dialog are unfortunately similar here. $dialog is the ui-bootstrap service
	// we use to launch the cc dialog, and cannot be renamed AFAIK. dialog is the detail view itself, used
	// for things like closing it. That could possibly be renamed but I don't know whether it is ours or
	// built into ui-bootstrap.
	function ($scope, authService, $state, $stateParams, dialog, $dialog, bookService, $location, $cookies, bookCountService) {
		$scope.canDeleteBook = false; // until we get the book and may make it true
		$scope.location = window.location.href; // make available to embed in mailto: links
		//get the book for which we're going to show the details
		bookService.getBookById($stateParams.bookId).then(function (book) {
			$scope.book = book;
			$scope.canDeleteBook = authService.isLoggedIn() && (authService.userName() == book.uploader.email || authService.isUserAdministrator());
			$scope.canReportViolation = authService.isLoggedIn(); // We demand this to reduce spamming.
		});

		$scope.skipDownloadPage = $cookies.skipDownloadPage == 'yes';

			$scope.close = function () {
			dialog.close();
		};

		$scope.showLicense = function() {
			$dialog.dialog(
				{
					backdrop: true,
					keyboard: true, //make ESC close it (sadly the detail view too)
					backdropClick: true, //make clicking on the backdrop close it (sadly the detail view too)
					templateUrl: 'modules/detail/ccdialog.tpl.html',
					controller: 'ccdialog',
					dialogClass: 'modal ccmodal',
					// this defines the value of 'book' as something that is injected into the BloomLibraryApp.ccdialog's
					// controller, thus giving it access to the book whose license we want details about.
					resolve: {book: function() {return $scope.book;}}
				}).open();
		};
		$scope.showDeleteDialog = function () {
			$dialog.dialog({
				backdrop: true,
				keyboard: true,
				backdropClick: true,
				templateUrl: 'modules/detail/deleteDialog.tpl.html',
				controller: 'deleteDialog',
				dialogClass: 'modal ccmodal',
				resolve: {
					book: function () {
						return $scope.book;
					}
				}
			}).open().then(function(result) {
					if (result) {
						bookService.deleteBook($scope.book.objectId).then(function() {
							var counts = bookCountService.getCount();
							counts.bookCount--;
							dialog.close(true); // object was deleted.
						},
						function(error) {
							alert(error);
						});
					}
				});
		};
		// This is so the dialog closes when the back button in the browser is used.
		$scope.$on('$locationChangeSuccess', function (event) {
			dialog.close();
		});
	} ]);
} ());  // end wrap-everything function