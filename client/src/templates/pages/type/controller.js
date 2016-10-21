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

  //$scope.crimeType = ["LARCENY-THEFT","BURGLARY","DRUG OFFENSE","ROBBERY","MOTOR VEHICLE THEFT","AGGRAVATED ASSAULT","RAPE","ARSON"];
  $scope.crimeType = [];
  $scope.typeSeries = ['Crime type']
  $scope.time = timeService.getTime();
  $scope.highestCrimeTypeData = [];
  $scope.highestCrimeType = '';
  //$scope.highestCrimeTypeData = [5,7,2,9,4,5,2,1];
  //$scope.highestCrimeType = 'ROBBERY';

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
      console.log("Crime types: " + $scope.crimeType + ", Values: " + $scope.highestCrimeTypeData + ", Max = " + $scope.highestCrimeType );
    });
  };

  var getUserLocation = function(){
    $scope.loading = true;
    $window.navigator.geolocation.getCurrentPosition(
      function(pos){
        $http.get('https://maps.googleapis.com/maps/api/geocode/json?latlng='+pos.coords.latitude+','+pos.coords.longitude+'&sensor=true')
          .then(function(res){
            $scope.user.lat = res.data.results[0].geometry.location.lat;
            $scope.user.lng = res.data.results[0].geometry.location.lng;
            $scope.formattedAddress = res.data.results[0].formatted_address;
            $scope.loading = false;
            userService.setUser($scope.user);
            getData();
          });
      },
      function(err){

      }
    );
  };

  /*var setPage = function(page) {
    $location.path(page);
  };*/

  if($scope.user && !$scope.user.lat){
    getUserLocation();
  }else{
    getData();
  }

});
