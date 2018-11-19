(function() {
  // to wrap use strict
  "use strict";

  var installersApp = angular
    .module("BloomLibraryApp.installers", ["ui.router", "restangular"])
    .config(function config(
      $urlRouterProvider,
      $stateProvider,
      RestangularProvider
    ) {
      RestangularProvider.setBaseUrl(
        "https://s3.amazonaws.com/bloomlibrary.org?prefix=installers/"
      );

      $stateProvider.state("installers", {
        url: "/installers",
        templateUrl: "modules/installers/installers.tpl.html",
        controller: "InstallersCtrl",
        title: "Download Installers"
      });

      //TODO: this should be installers.old, but when set, it becomes unreachable, with no console errors
      $stateProvider.state("installersold", {
        url: "/installers/old",
        //didn't help parent: 'installers',
        templateUrl: "modules/installers/oldInstallers.tpl.html",
        controller: "InstallersCtrl"
      });

      $stateProvider.state("installersLinux", {
        url: "/installers/linux",
        //didn't help parent: 'installers',
        templateUrl: "modules/installers/linux.tpl.html",
        controller: "InstallersCtrl"
      });
    });

  installersApp.controller("InstallersCtrl", function(
    $scope,
    $rootScope,
    $state,
    Restangular
  ) {
    //review: use get instead of getList and stop wrapping it in services.js?
    $scope.$on("$viewContentLoaded", function(
      event,
      toState,
      toParams,
      fromState,
      fromParams
    ) {
      if ($state.current.name.indexOf("old") > -1) {
        Restangular.all("")
          .getList()
          .then(function(r) {
            $scope.files = r;
            console.log(r);
          });
      }
      // If we're in high-contrast mode, the appropriate class needs to be added to the
      // body of each iframe's document. See comment in app.js (search for high-contrast)
      // for more info.
      if ($rootScope.highContrast) {
        $('iframe').each(function(index, iframe) {
          // not sure whether both of these are needed; the idea is that if somehow the
          // document is already loaded enough to have a body, we may be too late for
          // the DOMContentLoaded event, so just do it now; if it doesn't (probably more common),
          // we can't do it now, so presumably the document isn't loaded and doing it when it is will work.
          if (iframe.contentWindow && iframe.contentWindow.document && iframe.contentWindow.document.body) {
            iframe.contentWindow.document.body.classList.add("high-contrast");
          }
          iframe.contentWindow.addEventListener("DOMContentLoaded", function() {
            iframe.contentWindow.document.body.classList.add("high-contrast");
          });
        });
      }
    });

    function getBloomReaderVersionNumber() {
      var xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
          if (this.readyState == 4 && this.status == 200) {
              $scope.bloomReaderVersion = this.responseText;
              $scope.$apply();
          }
      };
      xhttp.open("GET", 'https://bloomlibrary.org/assets/bloomReaderVersionNumber.txt', true);
      xhttp.send();
    }

    getBloomReaderVersionNumber();
  });
})(); // end wrap-everything function
