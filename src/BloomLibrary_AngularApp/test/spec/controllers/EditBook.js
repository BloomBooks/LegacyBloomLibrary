'use strict';

describe('Controller: EditBookCtrl', function () {

  // load the controller's module
  beforeEach(module('SampleApp'));

  var EditBookCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    EditBookCtrl = $controller('EditBookCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
