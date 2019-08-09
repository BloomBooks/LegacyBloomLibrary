(function() {
  // to wrap use strict
  "use strict";

  angular
    .module("BloomLibraryApp.readBook", ["ui.router", "restangular"])
    .config(function config($stateProvider, $compileProvider) {
      // Tell angular that urls starting with bloom: and mailto: (and http{s}: of course) are OK. (Otherwise it marks them 'unsafe' and Chrome at
      // least won't follow them.). This is needed for the Open in Bloom button, mailto links. adding bloom is the unusual thing.
      // This seems to be global...any additions might need to go in other instances as well to make them work.
      $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|bloom|mailto):/);

      $stateProvider.state("readBook", {
        url: "/readBook/:bookId",
        views: {
          "@": {
            templateUrl: "modules/readBook/readBook.tpl.html",
            controller: "ReadBookCtrl"
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
    ]);

  function isHarvested(book) {
    return book && book.harvestState === "Done";
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

  angular.module("BloomLibraryApp.readBook").controller("ReadBookCtrl", [
    "$scope",
    "$stateParams",
    "bookService",
    "sharedService",
    "tagService",
    "$sce",
    function(
      $scope,
      $stateParams,
      bookService,
      sharedService,
      tagService,
      $sce
    ) {
      // A fairly crude way of testing for IOS, where a click on a button that has a tooltip just
      // shows the tooltip, to the dismay of anyone expecting the button to work.
      $scope.showTooltips =
        !navigator.platform || !/iPad|iPhone|iPod/.test(navigator.platform);
      $scope.canDeleteBook = false; // until we get the book and may make it true
      $scope.location = window.location.href; // make available to embed in mailto: links
      //get the book for which we're going to show the details
      bookService.getBookById($stateParams.bookId).then(function(book) {
        tagService.hideSystemTags(book);
        $scope.book = book;
        $scope.isHarvested = isHarvested(book);
        if ($scope.isHarvested) {
            var url = getReadUrl(book);
            $scope.readUrl = $sce.trustAsResourceUrl(url);
        }
      });

      function getReadUrl(book) {
        var harvesterBaseUrl = getHarvesterBaseUrl(book);
        if (!harvesterBaseUrl) {
          return null;
        }
        var bloomPlayerUrl = sharedService.isProductionSite
          ? "https://bloomlibrary.org/bloom-player/bloomplayer.htm"
          : "https://dev.bloomlibrary.org/bloom-player/bloomplayer.htm";

        // use this if you are are working on bloom-player and are using the bloom-player npm script tobloomlibrary
        // bloomPlayerUrl = "http://localhost:3000/bloom-player/bloomplayer.htm";
        return (
          bloomPlayerUrl +
          "?url=" +
          harvesterBaseUrl +
          "bloomdigital%2findex.htm"
        );
      }
    }
  ]);
})(); // end wrap-everything function
