var niApp = angular.module('niApp', ["ngRoute", "ngMap", "chart.js","ngTouch"]);


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

niApp.service('userService', function(NavigatorGeolocation, $http) {
  var _user = {};

  var getUser = function(){
    return _user;
  };

  var setUser = function(user){
    _user = user;
  };

  var getGeoData = function(callback, q){

    $http.get('https://maps.googleapis.com/maps/api/geocode/json?' + q + '&sensor=true').then(function(res){
      var isPhoenix = false;
      angular.forEach(res.data.results[0].address_components, function(item){
        if(item.short_name == 'Phoenix'){
          isPhoenix = true;
        }
      });
      _user.isPhoenix = isPhoenix;
      _user.formattedAddress = res.data.results[0].formatted_address;
      _user.lat = res.data.results[0].geometry.location.lat;
      _user.lng = res.data.results[0].geometry.location.lng;

      //console.log("getGeoData: isPhoenix = " + isPhoenix);

      if(typeof callback === 'function'){
        //console.log("getGeoData: Calling callback");
        callback();
      }

    });

  };

  var setUserLocation = function(callback){
    NavigatorGeolocation.getCurrentPosition()
      .then(function(position) {
        _user.lat = position.coords.latitude;
        _user.lng = position.coords.longitude;
        getGeoData(callback, 'latlng=' + _user.lat + ',' + _user.lng);
      },
      function(err){
        console.log('Error getting location ...');
        console.log(err);
        _user.declinedLocation = true;
        if(typeof callback === 'function'){
          callback();
        }
      });
  };

  return {
    getUser : getUser,
    setUser : setUser,
    setUserLocation : setUserLocation,
    getGeoData : getGeoData
  }
});

niApp.service('timeService', function() {
  var _time = new Date();

  var getTime = function(){
    return _time;
  };

  var setTime = function(time){
    _time = time;
  };

  return {
    getTime : getTime,
    setTime : setTime
  }
});

niApp.config(['ChartJsProvider', function (ChartJsProvider) {
  // Configure all charts
  ChartJsProvider.setOptions({
    chartColors: ['#ffffff', '#ffffff']
  });
}]);

niApp.controller('NIController', function NIController($scope, $window, $http, NavigatorGeolocation, $window, $rootScope, userService, timeService) {
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
  $scope.selectedIndex = 0;

  // $scope.googleMapsUrl="https://maps.google.com/maps/api/js?key=AIzaSyAtvTUqW2i2tbup-B9tW-4NQ6-bb1H3I_w"

  $scope.$watch('selectedIndex', function(current, old) {
    switch (current) {
      case 0:
        $location.url("/");
        break;
      case 1:
        $location.url("/more.html");
        break;
      case 2:
        $location.url("/type.html");
        break;
      case 3:
        $location.url("/heatmap.html");
        break;
    }
  });

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

	// // Get the modal
	// var modal = document.getElementById('howModal');
	// // Get the button that opens the modal
	// var btn = document.getElementById("how");
	// // Get the <span> element that closes the modal
	// var span = document.getElementsByClassName("close")[0];
	// // When the user clicks on the button, open the modal
	// btn.onclick = function() {
	//  modal.style.display = "block";
	// }
	// // When the user clicks on <span> (x), close the modal
	// span.onclick = function() {
	// 	modal.style.display = "none";
	// };
	// // When the user clicks anywhere outside of the modal, close it
	// $window.onclick = function(event) {
	// 	if (event.target == modal) {
	// 	  modal.style.display = "none";
	// 	}
	// };

  $scope.submitManualInput = function(){

    $scope.user.declinedLocation = false;
    userService.getGeoData(function(){getData()}, 'address='+$scope.user.manualLocation.replace(' ','+')+'+Phoenix+AZ');


    // $http.get('https://maps.googleapis.com/maps/api/geocode/json?address='+$scope.user.manualLocation.replace(' ','+')+'+Phoenix+AZ&sensor=true').then(function(res){
    //   $scope.user.lat = res.data.results[0].geometry.location.lat;
    //   $scope.user.lng = res.data.results[0].geometry.location.lng;
    //   $scope.user.formattedAddress = res.data.results[0].formatted_address;
    //   $scope.user.declinedLocation = false;
    //   getData();
    // });
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

niApp.controller('MoreController', function MoreController($scope, $window, $http, $rootScope, $timeout, userService, timeService) {

  $scope.loading = false;
  $scope.init = false;
  $scope.riskLevel = '';
  $scope.charts = [];
  $scope.user = userService.getUser();

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

niApp.controller('TypeController', function TypeController($scope, $window, $http, $rootScope, $timeout, userService, timeService) {

  $scope.loading = false;
  $scope.init = false;
  $scope.riskLevel = '';
  $scope.charts = [];
  $scope.user = userService.getUser();

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

niApp.controller('HeatmapController', function HeatmapController($scope, $window, $http, $rootScope, $timeout, userService, timeService, NgMap) {

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

niApp.controller('IndexController', ['$scope', '$location', function IndexController($scope, $location) {
  $scope.$on('$locationChangeSuccess', function() {
        $scope.location = $location.path();
    });
}]);
