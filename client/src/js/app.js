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
}])

niApp.config(['ChartJsProvider', function (ChartJsProvider) {
  // Configure all charts
  ChartJsProvider.setOptions({
    chartColors: ['#ffffff', '#ffffff']
  });
}]);

niApp.controller('NIController', function NIController($scope, $window, $http, NavigatorGeolocation, $window, $rootScope) {
  
  $rootScope.niTime = $rootScope.niTime || new Date(); 
  $scope.loading = false;
  $scope.init = false;
  $scope.riskLevel = '';
  var apiUrl = 'https://neighborhood-intelligence.tailw.ag/api/';
  $rootScope.user = $rootScope.user || {};
  $scope.formattedAddress = '';

  // $scope.googleMapsUrl="https://maps.google.com/maps/api/js?key=AIzaSyAtvTUqW2i2tbup-B9tW-4NQ6-bb1H3I_w"

  var getData = function(){
    $scope.loading = true;
    $http({
      url: apiUrl + '/' + $rootScope.user.lat + '/' + $rootScope.user.lng + '/' + new Date($rootScope.niTime), 
      method: "GET",
      cache: true
    }).then(function(results) {
      //$scope.formattedAddress = results.data.records[0].formattedAddress;
      $scope.riskText = results.data.precog.risk;
      $scope.riskLevel = results.data.precog.risk.toLowerCase();
      $scope.mostLikely = results.data.precog.guess.type;
      $scope.loading = false;
      $scope.init = true;
    });
  };  


  var getUserLocation = function(){
    $scope.loading = true;
    NavigatorGeolocation.getCurrentPosition()
     .then(function(position) {
        var lat = position.coords.latitude, lng = position.coords.longitude;
        $rootScope.user.lat = position.coords.latitude;
        $rootScope.user.lng = position.coords.longitude;
        console.log(position);
        $http.get('https://maps.googleapis.com/maps/api/geocode/json?latlng='+$rootScope.user.lat+','+$rootScope.user.lng+'&sensor=true').then(function(res){
          $rootScope.user.formattedAddress = $scope.formattedAddress = res.data.results[0].formatted_address;
          console.log($rootScope.user.formattedAddress);
        });
        // 
        $scope.loading = false;
        getData();

       }, 
       function(err){
        console.log(err);
       });
  };


	$scope.riskText = '';
  $scope.mostLikely = '';

  $scope.setTime = function(hour){   
    var d = new Date($rootScope.niTime); 
    $rootScope.niTime = d.setHours(d.getHours()+hour);
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

  if($rootScope.user && !$rootScope.user.lat){
    getUserLocation();
  }else{
    getData();
  }
  
}); 




niApp.controller('MoreController', function MoreController($scope, $window, $http, $rootScope, $timeout) {

  
  $scope.loading = false;
  $scope.init = false;
  $scope.riskLevel = '';
  $scope.charts = [];
  $rootScope.user = $rootScope.user || {};
  
  // $scope.$on('chart-create', function (evt, chart) {
  //   $scope.charts.push(chart);
  //   console.log($scope.charts);
  // });

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
  
  $scope.timesOfDay = ['12-4am', '4-8am','8am-12','12-4pm','4-8pm','8pm-12'];
  $scope.daysOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  $scope.highestDay = '';
  $scope.highestDayData = [0,0,0,0,0,0];
  $scope.highestTime = '';
  $scope.highestTimeData = [0,0,0,0,0,0,0];
  $scope.todSeries = ['Time of Day'];
  $scope.dowSeries = ['Day of week'];

  $rootScope.niTime = $rootScope.niTime || new Date();  
  
  var apiUrl = 'https://neighborhood-intelligence.tailw.ag/api/';

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

  // $scope.setTime = function(hour){   
  //   var d = new Date($rootScope.niTime); 
  //   $rootScope.niTime = d.setHours(d.getHours()+hour);
  //   getData();
  // };

  var getData = function(){
    $scope.loading = true;
    $http({
      url: apiUrl + '/' + $rootScope.user.lat + '/' + $rootScope.user.lng + '/' + new Date($rootScope.niTime),  
      method: "GET",
      cache: true
    }).then(function(results) {
      $scope.init = true;
      $scope.riskText = results.data.precog.risk;
      $scope.riskLevel = results.data.precog.risk.toLowerCase();
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
            console.log(res.data);
            $rootScope.user.lat = res.data.results[0].geometry.location.lat;
            $rootScope.user.lng = res.data.results[0].geometry.location.lng;
            $scope.formattedAddress = res.data.results[0].formatted_address;
            $scope.loading = false;
            getData();
          });
      }, 
      function(err){

      }
    );
  };

  // $scope.chartClick = function (points, evt) {
  //   console.log(points, evt);
  // };
  if($rootScope.user && !$rootScope.user.lat){
    getUserLocation();
  }else{
    getData();
  }

});

// //Type Chart
  // var ctxdo = document.getElementById("typeChart");
  // var dayChart = new Chart(ctxdo, {
  //     type: 'doughnut',
  //     data: {
  //         labels: ["MOTOR VEHICLE THEFT", "LARCENY-THEFT", "DRUG OFFENSE", "RAPE", "BURGLARY", "AGGRAVATED ASSAULT", "MURDER", "ROBBERY", "OTHER"],
  //         datasets: [{
  //             label: 'Crimes',
  //             data: [12, 19, 3, 5, 2, 6, 3, 14, 20],
  //             backgroundColor: [
  //                 'rgba(255, 0, 255, 0.3)',
  //                 'rgba(0, 0, 255, 0.3)',
  //                 'rgba(255, 255, 0, 0.3)',
  //                 'rgba(0, 255, 255, 0.3)',
  //                 'rgba(255, 0, 0, 0.3)',
  //                 'rgba(128, 64, 200, 0.3)',
  //                 'rgba(200, 64, 64, 0.3)',
  //                 'rgba(0, 255, 0, 0.3)',
  //                 'rgba(255, 153, 51, 0.3)'
  //             ],
  //             borderColor: [
  //                 'rgba(255,0,255,1)',
  //                 'rgba(0, 0, 255, 1)',
  //                 'rgba(255, 255, 0, 1)',
  //                 'rgba(0, 255, 255, 1)',
  //                 'rgba(255, 0, 0, 1)',
  //                 'rgba(128, 64, 200, 1)',
  //                 'rgba(200, 64, 64, 1)',
  //                 'rgba(0, 255, 0, 1)',
  //                 'rgba(255, 153, 51, 0.3)'
  //             ],
  //        borderWidth: 1
  //          }]
  //      },
  //     options: {
  //      responsive: false,
          
  //    title: {
  //      display: true,
 //           text: 'History at this location',
  //      fontSize: 20,
  //      fontColor: "#fff"
  //        },
  //    legend: {
  //             display: true,
  //             labels: {
 //                 fontColor: 'rgb(255, 255, 132)',
 //                 fontSize: 10
  //                }
  //            },
  //      }
  //    });
  // var scales = {
 //    xAxes: [{
 //      ticks: {
 //              fontColor: 'white',
 //              fontSize: 10
 //          },
 //      gridLines: {
 //        show: true,
 //        color: "white",

 //      } }] ,
 //      yAxes: [{
 //          ticks: {
 //              beginAtZero:true,
 //              fontColor: 'white',
 //              fontSize: 10
 //          },
 //          gridLines: {show: true, color: "white"}
 //              }]
 //          };
 //  var legend = {
 //        display: true,
 //        labels: {
 //          fontColor: 'rgb(255, 255, 132)',
 //          fontSize: 16
 //                }
 //            };
 //  var data = {
 //      labels: {
 //        display: true,
 //        fontColor: 'rgb(255, 255, 132)',
 //            fontSize: 12
 //        }
 //      }
 //  //Day Chart
 //  var ctxd = document.getElementById("dayChart");
 //  var dayChart = new $window.Chart(ctxd, {
 //      type: 'line',
 //      data: {
 //          labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
 //          datasets: [{
 //              label: 'Crimes',
 //              data: [12, 19, 3, 5, 2, 3, 6],
 //              backgroundColor: 'rgba(255, 255, 0, .1)',
 //              borderColor: 'rgba(255, 255, 0, 1)',
 //              borderWidth: 1
 //          }]
 //      },
 //      options: {
 //        responsive: false,
 //          scales: scales,
 //      title: {
 //        display: true,
 //          text: 'Risk x Day',
 //        fontSize: 20,
 //        fontColor: "#fff"
 //          },
 //      legend: legend,
 //      data: data
 //      }
 //      });
 //  //Time Chart
 //  var ctxt = document.getElementById("timeChart");
 //  var timeChart = new $window.Chart(ctxt, {
 //      type: 'line',
 //      data: {
 //          labels: ["12a-4a", "4a-8a", "8a-12p", "12p-4p", "4p-8p", "8p-12a"],
 //          datasets: [{
 //              label: 'Crimes',
 //              data: [19, 12, 3, 5, 13, 10],
 //              backgroundColor: 'rgba(255, 255, 0, .1)',
 //              borderColor: 'rgba(255, 255, 0, 1)',
 //              borderWidth: 1
 //          }]
 //      },
 //      options: {
 //        responsive: false,
 //          scales: scales,
 //      title: {
 //        display: true,
 //          text: 'Risk x Time',
 //        fontSize: 20,
 //        fontColor: "#fff"
 //          },
 //      legend: legend,
 //      data: data
 //      }
 //      });
/*
niApp.controller('ChartsController', function ChartsController($scope, $window){
var scales = {
    xAxes: [{
      ticks: {
              fontColor: 'white',
              fontSize: 10
          },
      gridLines: {
        show: true,
        color: "white",

      } }] ,
      yAxes: [{
          ticks: {
              beginAtZero:true,
              fontColor: 'white',
              fontSize: 10
          },
          gridLines: {show: true, color: "white"}
              }]
          };
var legend = {
    display: true,
    labels: {
      fontColor: 'rgb(255, 255, 132)',
      fontSize: 16
            }
        };
var data = {
  labels: {
    display: true,
    fontColor: 'rgb(255, 255, 132)',
        fontSize: 12
    }
  }
//Day Chart
var ctxd = document.getElementById("dayChart");
var dayChart = new $window.Chart(ctxd, {
  type: 'line',
  data: {
      labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      datasets: [{
          label: 'Crimes',
          data: [12, 19, 3, 5, 2, 3, 6],
          backgroundColor: 'rgba(255, 255, 0, .1)',
          borderColor: 'rgba(255, 255, 0, 1)',
          borderWidth: 1
      }]
  },
  options: {
    responsive: false,
      scales: scales,
  title: {
    display: true,
      text: 'Risk x Day',
    fontSize: 20,
    fontColor: "#fff"
      },
  legend: legend,
  data: data
  }
  });
//Time Chart
var ctxt = document.getElementById("timeChart");
var timeChart = new $window.Chart(ctxt, {
  type: 'line',
  data: {
      labels: ["12a-4a", "4a-8a", "8a-12p", "12p-4p", "4p-8p", "8p-12a"],
      datasets: [{
          label: 'Crimes',
          data: [19, 12, 3, 5, 13, 10],
          backgroundColor: 'rgba(255, 255, 0, .1)',
          borderColor: 'rgba(255, 255, 0, 1)',
          borderWidth: 1
      }]
  },
  options: {
    responsive: false,
      scales: scales,
  title: {
    display: true,
      text: 'Risk x Time',
    fontSize: 20,
    fontColor: "#fff"
      },
  legend: legend,
  data: data
  }
  });


});
*/
