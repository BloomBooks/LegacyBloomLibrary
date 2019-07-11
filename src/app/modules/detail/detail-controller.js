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
        }
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

  function isHarvested(book) {
    return book && book.harvestState === "Done";
  }

  // we get a URL for the contents of the book and return the one for the PDF preview.
  // input url is .../BookName/
  // output is .../BookName/BookName.pdf.
  // (Except that both are url encoded, so the slashes appear as %2f.)
  function getPdfPreviewUrl(book) {
    if (!book) {
      return null;
    }
    var baseUrl = book.baseUrl;
    if (!baseUrl) {
      return null;
    }

    var bookName = getBookNameFromUrl(baseUrl);
    return baseUrl + bookName + ".pdf";
  }

  function getPdfDownloadUrl(book) {
    // Once the harvester can be relied on to have created a pdf in the correct place,
    // we want this instead:
    //return getDownloadUrl(book, "pdf");

    return getPdfPreviewUrl(book);
  }

  function getEpubUrl(book) {
    return getDownloadUrl(book, "epub");
  }

  function getDigitalDownloadUrl(book) {
    return getDownloadUrl(book, "bloomd");
  }

  function getBookNameFromUrl(baseUrl) {
    var lastSlashIndex = baseUrl.lastIndexOf("%2f");
    var leadin = baseUrl.substring(0, lastSlashIndex);
    var slashBeforeBookName = leadin.lastIndexOf("%2f");
    if (slashBeforeBookName < 0) {
      return null;
    }
    return leadin.substring(slashBeforeBookName + 3); // includes leading slash (%2f)
  }

  function getDownloadUrl(book, fileType) {
    var harvesterBaseUrl = getHarvesterBaseUrl(book);
    if (!harvesterBaseUrl) {
      return null;
    }

    var bookName = getBookNameFromUrl(book.baseUrl);

    if (bookName) {
      if (fileType === "bloomd") {
        return harvesterBaseUrl + bookName + "." + fileType;
      }
      return harvesterBaseUrl + fileType + "/" + bookName + "." + fileType;
    }
    return null;
  }

  function getReadUrl(book) {
    var harvesterBaseUrl = getHarvesterBaseUrl(book);
    if (!harvesterBaseUrl) {
      return null;
    }

    return (
      "https://bloomlibrary.org/bloom-player/bloomplayer.htm?url=" +
      harvesterBaseUrl +
      "bloomdigital%2findex.htm"
    );
  }

  function getHarvesterBaseUrl(book) {
    if (!book) {
      return null;
    }
    var baseUrl = book.baseUrl;
    if (baseUrl == null) {
      return null;
    }
    if (!isHarvested(book)) {
      return null;
    }

    // typical input url:
    // https://s3.amazonaws.com/BloomLibraryBooks-Sandbox/ken%40example.com%2faa647178-ed4d-4316-b8bf-0dc94536347d%2fsign+language+test%2f
    // want:
    // https://s3.amazonaws.com/bloomharvest-sandbox/ken%40example.com%2faa647178-ed4d-4316-b8bf-0dc94536347d/
    // We come up with that URL by
    //  (a) changing BloomLibraryBooks{-Sandbox} to bloomharvest{-sandbox}
    //  (b) strip off everything after the next-to-final slash
    var folderWithoutLastSlash = baseUrl;
    if (baseUrl.endsWith("%2f")) {
      folderWithoutLastSlash = baseUrl.substring(0, baseUrl.length - 3);
    }
    var index = folderWithoutLastSlash.lastIndexOf("%2f");
    var pathWithoutBookName = folderWithoutLastSlash.substring(0, index);
    return (
      pathWithoutBookName
        .replace("BloomLibraryBooks-Sandbox", "bloomharvest-sandbox")
        .replace("BloomLibraryBooks", "bloomharvest") + "/"
    );
    // Using slash rather than %2f at the end helps us download as the filename we want.
    // Otherwise, the filename can be something like ken@example.com_007b3c03-52b7-4689-80bd-06fd4b6f9f28_Fox+and+Frog.bloomd
  }

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
              }
              else {
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
      $modal,
      $window
    ) {
      $scope.canDeleteBook = false; // until we get the book and may make it true
      $scope.location = window.location.href; // make available to embed in mailto: links
      //get the book for which we're going to show the details
      bookService.getBookById($stateParams.bookId).then(function(book) {
        tagService.hideSystemTags(book);
        $scope.book = book;

        $scope.pdfPreviewUrl = getPdfPreviewUrl(book);
        $scope.pdfDownloadUrl = getPdfDownloadUrl(book);
        $scope.epubUrl = getEpubUrl(book);
        $scope.digitalDownloadUrl = getDigitalDownloadUrl(book);

        $scope.isHarvested = isHarvested(book);
        if ($scope.isHarvested) {
          $scope.readUrl = getReadUrl(book);
        }

        $scope.canDeleteBook =
          authService.isLoggedIn() &&
          (authService.userName().toLowerCase() ==
            book.uploader.username.toLowerCase() ||
            authService.isUserAdministrator());
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
