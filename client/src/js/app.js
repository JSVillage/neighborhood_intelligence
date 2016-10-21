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

niApp.controller('NIController', function NIController($scope, $window, $http, NavigatorGeolocation, $window, $rootScope, userService, timeService, $location, navService) {
  var apiUrl = $window.location.origin + '/hm';
  $scope.howModal = false;
  $scope.loading = false;
  $scope.init = false;
  $scope.riskLevel = '';
  $scope.riskText = '';
  $scope.mostLikely = '';
  $scope.user = userService.getUser();
  $scope.time = timeService.getTime();
  $scope.formattedAddress = '';
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
      $scope.riskText = results.data.precog.time[hour].risk;
      $scope.riskLevel = results.data.precog.time[hour].risk.toLowerCase();
      $scope.mostLikely = results.data.precog.time[hour].guess;
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

niApp.controller('MoreController', function MoreController($scope, $window, $http, $rootScope, $timeout, userService, timeService, $location, navService) {

  $scope.loading = false;
  $scope.init = false;
  $scope.riskLevel = '';
  $scope.charts = [];
  $scope.user = userService.getUser();
  $scope.selectedIndex = navService.currentIndex = 1;

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
      var time = new Date($scope.time);
      var hour = time.getHours();
      $scope.riskText = results.data.precog.time[hour].risk;
      $scope.riskLevel = results.data.precog.time[hour].risk.toLowerCase();
      $scope.loading = false;

      $scope.highestTimeData = results.data.precog.timeOfDay;
      $scope.highestTime = $scope.timesOfDay[indexOfMax(results.data.precog.timeOfDay)];
      $scope.highestDayData = results.data.precog.dayOfWeek;
      $scope.highestDay = $scope.daysOfWeek[indexOfMax(results.data.precog.dayOfWeek)];
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

niApp.controller('TypeController', function TypeController($scope, $window, $http, $rootScope, $timeout, userService, timeService, $location, navService) {

  $scope.loading = false;
  $scope.init = false;
  $scope.riskLevel = '';
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

      $scope.highestCrimeTypeData = results.data.precog.types;
      $scope.highestCrimeType = "";
      var max = 0;
      for (var i in $scope.highestCrimeTypeData) {
         $scope.crimeType.push(i);
         if ($scope.highestCrimeTypeData[i] > max) {
           max = $scope.highestCrimeTypeData[i];
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

niApp.controller('HeatmapController', function HeatmapController($scope, $window, $http, $rootScope, $timeout, userService, timeService, NgMap, $location, navService) {

  $scope.loading = false;
  $scope.init = false;
  $scope.riskLevel = '';
  $scope.user = userService.getUser();

  $scope.time = timeService.getTime();
  $scope.date = new Date($scope.time);
  $scope.hour = $scope.date.getHours();

  $scope.mapKey = ["1x090J8w093GiDGlD3kSwrd5X-5PqwFiUqyiGyiFI",
                    "1bHt6Gl6MoVP5_anlZah5BdF1KSZ5FCbKGudugNjT",
                    "1gosTwXTFxC_w9QyJQ2Q4WOR2eoA9Jfmgu98Ho2vY",
                    "1esNP3WO7heaeW8Iaccu9F2DOszuqAXqpuWwgjEbF",
                    "1Ki-gvVowKUegpV28pCPpnmEOpmwd5ZMZ-RE7l2Oz",
                    "1if4z8xMxHlOp0QE77lix8XVT2JN1IPhVVavCIKRa",
                    "1Hlrh7hJWBp5ZMFCW29OLmpWaJ4WclngbhZ7yVjF2",
                    "1tCdeJEeevmWjldLi0SeSPRhunJI0dbQlgj4e5_uu",
                    "1dxPuW_gr1q5Si4ICWX9BfrBhHXuHCu0ejgmiWWn9",
                    "1EWhzhxezo1p-aqcaflUCnk2jpReG7bel5CKRAYlg",
                    "11Add1NwAL9PZTE10vX38rCFrHYe84gAoZuhlNOL6",
                    "1w4RhYC-AEOO-ASv83U3s3Pdo74wMkyacIY7i4O2T",
                    "1o7l4tU81-x6offzKHb9eSqcmGCZtBs_w8JWVf8iq",
                    "1MXFCNajFb6cqy_POzfrDasFi270KybCLZ40ANzGt",
                    "1qEYKqp7bWcMrbX6nzQ3w7vDfzB_uSX3w_Ei2dpwe",
                    "14j-8-mChI46KHSbzRY8TW4Y4iyF-nDOdVdrk3pYD",
                    "1RPz7RPJ55tVaJTE8nPyOqhQ-rhIDetebt9fjrBD5",
                    "1Jgj_6Spb2IZg-LkwqpaXzUISpiiJhnp7kafGTfvh",
                    "1q83e_kiQchXesv-XZEgeFNwEIvULInzrlWLvjx_F",
                    "16jldRxYU6n8754Kv9XpE3wsyoG8gsD24HT_UIS1j",
                    "1FfNrlP0mPHawG-y3LxT-U6GIqrFuDe-1TbJxQQ0i",
                    "1EkI_IbDhPyZP-TS4GH2drTfs6xep2heOGC1o0tYX",
                    "1gxtXOEWr8l6ksUn2XuoSWJk8PgKCAqFU4IY0rlbr",
                    "1_NIOWKin-h5zLI0bODI0OaLLr80o1oukRROgSt54"];

  $scope.selectedIndex = navService.currentIndex = 3;

  $scope.onSwipeLeft = function(){
    $scope.selectedIndex ++;
    navService.navigate($scope.selectedIndex, $location);
  };
  $scope.onSwipeRight = function(){
    $scope.selectedIndex --;
    navService.navigate($scope.selectedIndex, $location);
  };                    

  var apiUrl = $window.location.origin + '/hm';

  var getData = function(){
    $scope.loading = true;
    //console.log("downloading 24 heat maps for Phoenix" );
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

niApp.controller('IndexController', ['$scope', '$location', function IndexController($scope, $location, navService) {
  $scope.$on('$locationChangeSuccess', function() {
        $scope.location = $location.path();
    });
}]);
