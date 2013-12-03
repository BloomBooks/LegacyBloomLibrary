// The ng-boilerplate build process seems to require at least one passing test.
// This dummy test is minimally modified from the original boilerplate to satisfy this requirement.
// Todo: one day we should have some real tests!
describe('HeaderCtrl', function () {
  describe( 'isCurrentUrl', function() {
    var AppCtrl, $location, $scope;

    beforeEach(module('BloomLibraryApp'));

    beforeEach( inject( function( $controller, _$location_, $rootScope ) {
      $location = _$location_;
      $scope = $rootScope.$new();
      AppCtrl = $controller('HeaderCtrl', { $location: $location, $scope: $scope });
    }));

    it( 'should pass a dummy test', inject( function() {
      expect( AppCtrl ).toBeTruthy();
    }));
  });
});
