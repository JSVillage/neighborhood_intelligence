var niApp = angular.module('niApp', ["ngRoute", "ngMap", "chart.js", "ngTouch"]);


niApp.factory('mapService', ['$http', function($http) {
  return {
    getGoogleInfo: function(payload) {
      return $http({
          url: 'https://maps.googleapis.com/maps/api/geocode/json',
          method: "GET",
          params: payload
        }).then(function(result) {
          return result;
        });
    }
  };
}]);

niApp.config(['ChartJsProvider', function (ChartJsProvider) {
  // Configure all charts
  ChartJsProvider.setOptions({
    chartColors: ['#ffffff', '#ffffff']
  });
}]);


niApp.controller('IndexController', ['$scope', '$location', 'navService', 'userService', function IndexController($scope, $location, navService, userService) {
  $scope.$on('$locationChangeSuccess', function() {
      $scope.user = userService.getUser();    
      $scope.location = $location.path();
    });
}]);
  