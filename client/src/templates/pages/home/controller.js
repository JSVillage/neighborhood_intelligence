angular.module('niApp').controller('NIController', function NIController($scope, $window, $http, NavigatorGeolocation, $window, $rootScope, userService, timeService, $location, navService) {
  var apiUrl = $window.location.origin + '/hm';
  $scope.howModal = false;
  $scope.loading = false;
  $scope.init = false;
  $scope.riskLevel = '';
  $scope.riskText = '';
  $scope.mostLikely = '';
  $scope.user = userService.getUser();
  $scope.time = timeService.getTime();
  $scope.selectedIndex = navService.currentIndex = 0;

  $scope.onSwipeLeft = function(){
    $scope.selectedIndex ++;
    navService.navigate($scope.selectedIndex, $location);
  };
  $scope.onSwipeRight = function(){
    $scope.selectedIndex --;
    navService.navigate($scope.selectedIndex, $location);
  };

  var getData = function(){
    //console.log("Entered getData" );
    if($scope.user.declinedLocation){return;}
    $scope.loading = true;
    console.log("sending hm request for " + $scope.user.lat + "," + $scope.user.lng );
    $http({
      url: apiUrl + '/' + $scope.user.lat.toFixed(3) + '/' + $scope.user.lng.toFixed(3),
      method: "GET",
      cache: true
    }).then(function(results) {
      var time = new Date($scope.time);
      var hour = time.getHours();
      $scope.user.riskText = results.data.precog.time[hour].risk;
      $scope.user.riskLevel = results.data.precog.time[hour].risk.toLowerCase();
      $scope.user.mostLikely = results.data.precog.time[hour].guess;
      //console.log("result: " + results.data.precog + " hour: " + hour + " guess: " + results.data.precog.time[hour].guess);
      $scope.loading = false;
      $scope.init = true;
    });
  };

  $scope.setTime = function(hour){
    var d = new Date($scope.time);
    $scope.time = d.setHours(d.getHours()+hour);
    getData();
  };

  $scope.submitManualInput = function(){

    $scope.user.declinedLocation = false;
    userService.getGeoData(function(){getData()}, 'address='+$scope.user.manualLocation.replace(' ','+')+'+Phoenix+AZ');

  };

  if($scope.user && !$scope.user.lat){
    $scope.loading = true;
    //console.log("setUserLocation() used to call getData()");
    userService.setUserLocation(function(){
      $scope.user = userService.getUser();
      $scope.loading = false;
      //console.log("inside setUserLocation() callback function, about to call getData()");
      getData();
    });
  } else {
    //console.log("Raw call to getData()");
    getData();
  }

});