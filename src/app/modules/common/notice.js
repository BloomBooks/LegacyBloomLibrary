angular.module('palaso.ui.notice', ['ui.bootstrap'])
.factory('silNoticeService', ['$log', '$timeout', function ($log, $timeout) {
	var notices = [];
	return {
		push: function(type, message) {
			notices.push({type: type(), message: message});
		},
		
        //When we upgrade to angularjs 1.2, we'll use animate to fade the other guys out
		replace: function (type, message) {
			this.push(type, message);
			var callme = this;
			$timeout(function () {
				callme.clear();
				callme.push(type, message);
			}, 1000);
		},
		remove: function(index) {
			notices.splice(index, 1);
		},
		clear: function() {
			notices = [];
		},
		get: function() {
			return notices;
		},
		ERROR:   function() { return 'error'; },
		WARN:    function() { return 'warn'; },
		INFO:    function() { return 'info'; },
		SUCCESS: function() { return 'success'; }
	};
}])
.directive('silNotices', ['silNoticeService', '$log', '$location', function(noticeService, $log, $location) {
	
	return {
		restrict : 'EA',
		template : '<div ng-class="{shiftRight: isActive(\'/browse\')}" class="notices"><alert ng-repeat="notice in notices()" type="notice.type" close="closeNotice($index)">{{notice.message}}</alert></div>',
		replace : true,
		compile : function(tElement, tAttrs) {
			return function($scope, $elem, $attr) {
				$scope.closeNotice = function(index) {
					noticeService.remove(index);
				};
				$scope.notices = function() {
					return noticeService.get();
				};
				$scope.isActive = function (viewLocation) { 
					return viewLocation === $location.path();
				};
			};
		}
	};
}]);