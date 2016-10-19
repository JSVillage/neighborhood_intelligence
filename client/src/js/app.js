var niApp = angular.module('niApp', ["ngRoute", "ngMap", "chart.js"]);


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

    });
    if(typeof callback === 'function'){
      callback();
    }

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

  // $scope.googleMapsUrl="https://maps.google.com/maps/api/js?key=AIzaSyAtvTUqW2i2tbup-B9tW-4NQ6-bb1H3I_w"

  var getData = function(){
    if($scope.user.declinedLocation){return;}
    $scope.loading = true;
    $http({
      url: apiUrl + '/' + $scope.user.lat + '/' + $scope.user.lng,
      method: "GET",
      cache: true
    }).then(function(results) {
      var date = new Date();
      var hour = date.getHours();
      $scope.riskText = results.data.precog.time[hour].risk;
      $scope.riskLevel = results.data.precog.time[hour].risk.toLowerCase();
      $scope.mostLikely = results.data.precog.time[hour].guess;
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
    userService.getGeoData(getData(), 'address='+$scope.user.manualLocation.replace(' ','+')+'+Phoenix+AZ');

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
    userService.setUserLocation(function(){
      $scope.user = userService.getUser();
      $scope.loading = false;
      getData();
    });
  } else {
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
    $http({
      url: apiUrl + '/' + $scope.user.lat + '/' + $scope.user.lng,
      method: "GET",
      cache: true
    }).then(function(results) {
      $scope.init = true;
      var date = new Date();
      var hour = date.getHours();
      $scope.riskText = results.data.precog.time[hour].risk;
      $scope.riskLevel = results.data.precog.time[hour].risk.toLowerCase();
      $scope.loading = false;

      $scope.highestTimeData =results.data.precog.timeOfDay;
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

  if($scope.user && !$scope.user.lat){
    getUserLocation();
  }else{
    getData();
  }

});
