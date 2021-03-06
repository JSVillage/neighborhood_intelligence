
angular.module('niApp').controller('MoreController', function MoreController($scope, $window, $http, $rootScope, $timeout, userService, timeService, $location, navService) {

  $scope.loading = false;
  $scope.init = false;
  $scope.riskLevel = '';
  $scope.charts = [];
  $scope.user = userService.getUser();
  $scope.selectedIndex = navService.currentIndex = 1;
  console.log($scope.user);

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

  $scope.timesOfDay = ['12-4am', '4-8am', '8am-12', '12-4pm', '4-8pm', '8pm-12'];
  $scope.daysOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  $scope.highestDay = '';
  $scope.highestDayData = [0,0,0,0,0,0];
  $scope.highestTime = '';
  $scope.highestTimeData = [0,0,0,0,0,0,0];
  $scope.todSeries = ['Time of Day'];
  $scope.dowSeries = ['Day of week'];
  $scope.time = timeService.getTime();

  var apiUrl = $window.location.origin + '/hm';

  var indexOfMax = function(arr) {
    if (arr.length === 0) {return -1;}
    var max = arr[0];
    var maxIndex = 0;

    for (var i = 1; i < arr.length; i++) {
      if (arr[i] > max) {
        maxIndex = i;
        max = arr[i];
      }
    }

    return maxIndex;
  };

  var getData = function(){
    $scope.loading = true;
    console.log("sending hm request for " + $scope.user.lat + "," + $scope.user.lng );
    $http({
      url: apiUrl + '/' + $scope.user.lat.toFixed(3) + '/' + $scope.user.lng.toFixed(3) ,
      method: "GET",
      cache: true
    }).then(function(results) {
      $scope.init = true;
      console.log($scope.time);
      var time = new Date($scope.time);
      console.log(time);
      var hour = time.getHours();
      $scope.user.riskText = results.data.precog.time[hour].risk;
      $scope.user.riskLevel = results.data.precog.time[hour].risk.toLowerCase();
      $scope.loading = false;

      $scope.highestTimeData = results.data.precog.timeOfDay;
      $scope.highestTime = $scope.timesOfDay[indexOfMax(results.data.precog.timeOfDay)];
      $scope.highestDayData = results.data.precog.dayOfWeek;
      $scope.highestDay = $scope.daysOfWeek[indexOfMax(results.data.precog.dayOfWeek)];
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