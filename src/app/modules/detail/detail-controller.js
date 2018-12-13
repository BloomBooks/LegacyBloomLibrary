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
		.filter('getCleanBookshelfName', ['bookshelfService', function(bookshelfService) {
			return function(input) {
				return bookshelfService.getCleanBookshelfName(input);
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
			$scope.canDeleteBook = authService.isLoggedIn() && (authService.userName().toLowerCase() == book.uploader.username.toLowerCase() || authService.isUserAdministrator());
			$scope.downloadSize = 0; // hidden until we set a value
			//Get related books
			bookService.getRelatedBooks($stateParams.bookId).then(function(results) {
				if(results.length > 0) {
					$scope.book.relatedBooks = results[0].books.filter(function(relBook) {
						return relBook.objectId != $stateParams.bookId;
					});
				}
			});
			// Get size
			var prefix = book.bookOrder;
			// like bloom://localhost/order?orderFile=BloomLibraryBooks-Sandbox/hattonlists%40gmail.com%2fa7c32c37-a048-441d-aa12-707221c41b70%2fTwo+Brothers%2fTwo+Brothers.BloomBookOrder
			prefix = prefix.substring(prefix.indexOf("?orderFile="), prefix.lastIndexOf("%2f"));
			// like                        ?orderFile=BloomLibraryBooks-Sandbox/hattonlists%40gmail.com%2fa7c32c37-a048-441d-aa12-707221c41b70%2fTwo+Brothers
			prefix = prefix.substring(prefix.indexOf("/") + 1);
			// like                                                             hattonlists%40gmail.com%2fa7c32c37-a048-441d-aa12-707221c41b70%2fTwo+Brothers
			prefix = prefix.replace(/\+/g, " "); // if the name really has a plus, it should be percent encoded.
			// like                                                             hattonlists%40gmail.com%2fa7c32c37-a048-441d-aa12-707221c41b70%2fTwo Brothers
			prefix = decodeURIComponent(prefix);
			// like hattonlists@gmail.com/a7c32c37-a048-441d-aa12-707221c41b70/Two Brothers
			var params = {
				Bucket: 'BloomLibraryBooks-Sandbox', /* required */
				//ContinuationToken: 'STRING_VALUE',
				//Delimiter: 'STRING_VALUE',
				FetchOwner: false,
				MaxKeys: 1000,
				Prefix: prefix
			};
			// These credentials belong to the IAM user "noPermissions", which has no permission to do anything
			// not available to the public. This user was created to get around the stupid requirement
			// this this S3 API must have valid credentials, even to access public information.
			// Because we're not depending on this identity to have any permissions, the same one works
			// equally well for both dev and production buckets.
			var s3 = new AWS.S3({credentials: {accessKeyId: 'AKIAIVBVOIFW3DBZSBPQ', secretAccessKey: "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"}});
			s3.listObjectsV2(params, function (err, data) {
				if (err) {
					console.log(err, err.stack); // an error occurred
				}
				else {
					// successful response
					var size = 0;
					for (var i = 0; i < data.Contents.length; i++) {
						size += data.Contents[i].Size;
					}
					// It should work just to set $scope.downloadSize, without the wrapping.
					// But the display does not update. I don't know why.
					$scope.$apply(function() {$scope.downloadSize = Math.ceil(size/1024/1024);});

				}
			});
		});
		
        $scope.canReportViolation = authService.isLoggedIn(); // We demand this to reduce spamming.

		$scope.showLicense = function() {
            if ($scope.book.license && $scope.book.license.indexOf('cc-') === 0) {
                var url = 'https://creativecommons.org/licenses/' + $scope.book.license.substring(3) + '/4.0';
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
	} ]);
} ());  // end wrap-everything function