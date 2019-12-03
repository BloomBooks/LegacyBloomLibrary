(function() {
  // to wrap use strict
  "use strict";

  angular
    .module("BloomLibraryApp.detail", ["ui.router", "restangular"])
    .config(function config($stateProvider, $compileProvider) {
      // Tell angular that urls starting with bloom: and mailto: (and http{s}: of course) are OK. (Otherwise it marks them 'unsafe' and Chrome at
      // least won't follow them.). This is needed for the Open in Bloom button, mailto links. adding bloom is the unusual thing.
      // This seems to be global...any additions might need to go in other instances as well to make them work.
      $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|bloom|mailto):/);

      $stateProvider.state("browse.detail", {
        url: "/detail/:bookId",
        views: {
          "@": {
            templateUrl: "modules/detail/detail.tpl.html",
            controller: "DetailCtrl"
          }
        },
        title: "Details about a book"
      });
    })
    .filter("getDisplayName", [
      "tagService",
      function(tagService) {
        return function(input) {
          return tagService.getDisplayName(input);
        };
      }
    ])
    .filter("getCleanBookshelfName", [
      "bookshelfService",
      function(bookshelfService) {
        return function(input) {
          return bookshelfService.getCleanBookshelfName(input);
        };
      }
    ])
    //we get a json list like ['me','you'] and we return 'me, you'
    .filter("makeCommaList", function() {
      return function(input) {
        return input == null ? "" : input.join(", ");
      };
    })
    //we get a date string and return it more nicely formatted
    .filter("cleanDate", function() {
      return function(input) {
        return input == null ? "" : new Date(input).toLocaleDateString();
      };
    })
    //we get an email string and shorten it to make it give less away.
    .filter("obfuscate", function() {
      return function(input) {
        if (!input) {
          return "";
        }
        var index = input.lastIndexOf("@");
        if (index < 0 || index + 1 >= input.length) {
          return input;
        }
        return input.substring(0, index + 1) + "...";
      };
    })
    .filter("addMbLabel", function() {
      return function(input) {
        if (!input) {
          return "";
        }
        return _localize("{sizeInMb} MB", { sizeInMb: input });
      };
    });

  // In theory, we'll be wanting to make this more generic.
  // There are other potential events to limit (like downloadEpub),
  // other potential geo parameters (like region/city),
  // and even potential reverse logic (like notDownloadShell: {countryCode: CN}).
  // But at this point, that all seems YAGNI, so I'm not going to overcomplicate.
  var canDownloadShell = function(book) {
    return new Promise(function(resolve, reject) {
      if (!book) {
        resolve([false, ""]);
      }
      if (
        !book.internetLimits ||
        !book.internetLimits.downloadShell ||
        !book.internetLimits.downloadShell.countryCode
      ) {
        resolve([true, ""]);
      }
      var countryCode = book.internetLimits.downloadShell.countryCode;
      var xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
          if (this.status == 200) {
            var geoInfo = JSON.parse(this.responseText);
            if (geoInfo && geoInfo.country) {
              if (geoInfo.country === countryCode) {
                resolve([true, ""]);
              } else {
                console.log(geoInfo.country);
              }
            }
          }
          var msgToUser;
          // Hardcoding for PG because we currently don't know if we'll ever have another one of these.
          if (countryCode === "PG") {
            msgToUser =
              "Sorry, the uploader of this book has restricted shellbook download to Papua New Guinea only.";
          } else {
            msgToUser =
              "Sorry, the uploader of this book has restricted shellbook download to country " +
              countryCode +
              " only.";
          }
          resolve([false, msgToUser]);
        }
      };
      // AWS API Gateway which is a passthrough to ipinfo.io
      xhttp.open(
        "GET",
        "https://58nig3vzci.execute-api.us-east-2.amazonaws.com/Production",
        true
      );
      xhttp.send(null);
    });
  };

  angular.module("BloomLibraryApp.detail").controller("DetailCtrl", [
    "$scope",
    "authService",
    "$state",
    "$stateParams",
    "bookService",
    "bookCountService",
    "bookSizeService",
    "tagService",
    "pageService",
    "$modal",
    "$window",
    function(
      $scope,
      authService,
      $state,
      $stateParams,
      bookService,
      bookCountService,
      bookSizeService,
      tagService,
      pageService,
      $modal,
      $window
    ) {

      $scope.isCurrentUserBookUploader = function(book, authService) {
        return authService.isLoggedIn() &&
        (authService.userName().toLowerCase() == book.uploader.username.toLowerCase());
      };

      // A fairly crude way of testing for IOS, where a click on a button that has a tooltip just
      // shows the tooltip, to the dismay of anyone expecting the button to work.
      $scope.showTooltips =
        !navigator.platform || !/iPad|iPhone|iPod/.test(navigator.platform);
      $scope.canModifyBook = false; // until we get the book and may make it true
      $scope.location = window.location.href; // make available to embed in mailto: links
      //get the book for which we're going to show the details
      bookService.getBookById($stateParams.bookId).then(function(book) {
        tagService.hideSystemTags(book);
        $scope.book = book;
        pageService.setTitle(
          _localize("{bookTitle} - Details", { bookTitle: book.title })
        );

        for (var i = 0; i < $scope.book.langPointers.length; i++) {
          var l = $scope.book.langPointers[i];
          // cut off any script identifiers after the iso6393 code
          var dashLocation = l.ethnologueCode.indexOf("-");
          if (dashLocation === -1) {
            dashLocation = 100;
          }
          var isoCode = l.ethnologueCode.substring(0, dashLocation);
          if (isoCode.length === 2) {
            // Ethnologue.com can only be directly accessed if we have a 3 letter code.
            // But this other SIL site will point you to the right language:
            l.href = "https://iso639-3.sil.org/search/content/" + isoCode;
          } else {
            l.href = "https://www.ethnologue.com/language/" + isoCode;
          }
        }

        $scope.pdfPreviewUrl = bookService.getPdfPreviewUrl(book);
        $scope.pdfDownloadUrl = bookService.getPdfDownloadUrl(book);
        $scope.epubUrl = bookService.getEpubUrl(book);
        $scope.digitalDownloadUrl = bookService.getDigitalDownloadUrl(book);
        $scope.showEpub = bookService.showEpub(book);
        $scope.showBloomReader = bookService.showBloomReader(book);
        $scope.showRead = bookService.showRead(book);
        $scope.showHarvestedPdf = bookService.showHarvestedPdf(book);

        var isCurrentUserBookUploader = $scope.isCurrentUserBookUploader(book, authService);
        $scope.canModifyBook =  isCurrentUserBookUploader || authService.isUserAdministrator();

        if ($scope.canModifyBook) {
          setupHarvestPanel(
            {
              bookId: $stateParams.bookId,
              currentSession: authService.getSession(),
              currentUserIsUploader: isCurrentUserBookUploader,
              currentUserIsAdmin: authService.isUserAdministrator(),
              onChange: function() {
                // When the user updates which artifacts should be displayed,
                // we need to update the actual artifact download buttons in the
                // main (upper) part of the book detail page.
                // Unfortunately, the only way I know of to update them
                // from this context is to refresh the whole page.
                $state.reload();
              }
            }
          );
        }

        $scope.downloadSize = 0; // hidden until we set a value
        //Get related books
        bookService
          .getRelatedBooks($stateParams.bookId)
          .then(function(results) {
            if (results.length > 0) {
              $scope.book.relatedBooks = results[0].books.filter(function(
                relBook
              ) {
                return relBook.objectId != $stateParams.bookId;
              });
            }
          });
        // Get the book size
        bookSizeService.getBookSize(book.bookOrder, function(err, data) {
          if (err) {
            console.log(err, err.stack); // an error occurred
          } else {
            // successful response
            var size = 0;
            for (var i = 0; i < data.Contents.length; i++) {
              size += data.Contents[i].Size;
            }
            // It should work just to set $scope.downloadSize, without the wrapping.
            // But the display does not update. I don't know why.
            $scope.$apply(function() {
              $scope.downloadSize = Math.ceil(size / 1024 / 1024);
            });
          }
        });
      });

      $scope.canReportViolation = authService.isLoggedIn(); // We demand this to reduce spamming.

      $scope.showLicense = function() {
        if ($scope.book.license && $scope.book.license.indexOf("cc-") === 0) {
          var url =
            "https://creativecommons.org/licenses/" +
            $scope.book.license.substring(3) +
            "/4.0";
          $window.open(url);
        } else {
          $modal.open({
            templateUrl: "modules/detail/ccdialog.tpl.html",
            controller: "ccdialog",
            windowClass: "ccmodal",
            size: "sm",
            // this defines the value of 'book' as something that is injected into the BloomLibraryApp.ccdialog's
            // controller, thus giving it access to the book whose license we want details about.
            resolve: {
              book: function() {
                return $scope.book;
              }
            }
          });
        }
      };
      $scope.showPleaseLogIn = function() {
        $modal.open({
          templateUrl: "modules/login/pleaseLogIn.tpl.html",
          controller: "pleaseLogIn",
          windowClass: "ccmodal"
        });
      };

      $scope.showDeleteDialog = function() {
        var deleteModalInstance = $modal.open({
          templateUrl: "modules/detail/deleteDialog.tpl.html",
          controller: "deleteDialog",
          windowClass: "ccmodal deleteConfirm",
          // this defines the value of 'book' as something that is injected into the BloomLibraryApp.deleteDialog's
          // controller, thus giving it access to the book whose license we want details about.
          resolve: {
            book: function() {
              return $scope.book;
            }
          }
        });

        deleteModalInstance.result.then(function(result) {
          if (result) {
            bookService.deleteBook($scope.book.objectId).then(
              function() {
                var counts = bookCountService.getCount();
                counts.bookCount--;
                $window.history.back(); // object was deleted, back to browse.
              },
              function(error) {
                alert(error);
              }
            );
          }
        });
      };

      $scope.onDownloadShell = function(book) {
        canDownloadShell(book).then(function(result) {
          var canDownload = result[0];
          var msgToUser = result[1];
          if (canDownload) {
            $state.go("browse.detail.downloadBook.preflight");
          } else {
            if (msgToUser) {
              alert(msgToUser);
            }
          }
        });
      };
    }
  ]);
})(); // end wrap-everything function

function setupHarvestPanel(props) {
  document.getElementById("harvestPanelWrapper").classList.remove("hidden");
  window.NextBloomLibrary.connectHarvestArtifactUserControl(
    document.getElementById("harvestPanel"),
    props
  );
}
