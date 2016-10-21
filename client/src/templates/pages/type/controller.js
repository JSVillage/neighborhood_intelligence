angular.module('niApp').controller('TypeController', function TypeController($scope, $window, $http, $rootScope, $timeout, userService, timeService, $location, navService) {

  $scope.loading = false;
  $scope.init = false;
  // $scope.riskLevel = '';
  $scope.charts = [];
  $scope.user = userService.getUser();
  $scope.selectedIndex = navService.currentIndex = 2;

  $scope.onSwipeLeft = function(){
    $scope.selectedIndex ++;
    navService.navigate($scope.selectedIndex, $location);
  };
  $scope.onSwipeRight = function(){
    $scope.selectedIndex --;
    navService.navigate($scope.selectedIndex, $location);
  };

  $scope.dataOptions = {
    scales: {
      yAxes: [
        {
          id: 'y-axis-1',
          type: 'linear',
          display: true,
          position: 'left'
        }
      ]
    }
  };

  $scope.crimeType = [];
  $scope.typeSeries = ['Crime type']
  $scope.time = timeService.getTime();
  $scope.highestCrimeTypeData = [];
  $scope.highestCrimeType = '';

  var apiUrl = $window.location.origin + '/hm';

  var getData = function(){
    $scope.loading = true;
    console.log("sending hm request for " + $scope.user.lat + "," + $scope.user.lng );
    $http({
      url: apiUrl + '/' + $scope.user.lat.toFixed(3) + '/' + $scope.user.lng.toFixed(3) ,
      method: "GET",
      cache: true
    }).then(function(results) {
      $scope.init = true;
      var time = new Date($scope.time);
      var hour = time.getHours();
      $scope.riskText = results.data.precog.time[hour].risk;
      $scope.riskLevel = results.data.precog.time[hour].risk.toLowerCase();
      $scope.loading = false;

      $scope.highestCrimeTypeData = [];
      $scope.highestCrimeType = "";
      var max = 0;
      for (var i in results.data.precog.types) {
         $scope.crimeType.push(i);
         $scope.highestCrimeTypeData.push(results.data.precog.types[i])
         if (results.data.precog.types[i] > max) {
           max = results.data.precog.types[i];
           $scope.highestCrimeType = i;
         }
      }
      //console.log("Crime types: " + $scope.crimeType + ", Values: " + $scope.highestCrimeTypeData + ", Max = " + $scope.highestCrimeType );
    });
  };


  /*var setPage = function(page) {
    $location.path(page);
  };*/

  if($scope.user && !$scope.user.lat){
    $scope.loading = true;
    userService.setUserLocation(function(){
      $scope.user = userService.getUser();
      $scope.loading = false;
      getData();
    });
  } else {
    getData();
  }

});
