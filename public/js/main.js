//- bower components
//= include ../bower_components/ngmap/build/scripts/ng-map.js 
//= include ../node_modules/chart.js/dist/Chart.js
/*!
 * angular-chart.js - An angular.js wrapper for Chart.js
 * http://jtblin.github.io/angular-chart.js/
 * Version: 1.0.3
 *
 * Copyright 2016 Jerome Touffe-Blin
 * Released under the BSD-2-Clause license
 * https://github.com/jtblin/angular-chart.js/blob/master/LICENSE
 */
(function (factory) {
  'use strict';
  if (typeof exports === 'object') {
    // Node/CommonJS
    module.exports = factory(
      typeof angular !== 'undefined' ? angular : require('angular'),
      typeof Chart !== 'undefined' ? Chart : require('chart.js'));
  }  else if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['angular', 'chart'], factory);
  } else {
    // Browser globals
    if (typeof angular === 'undefined' || typeof Chart === 'undefined')
      throw new Error('Chart.js library needs to be included, see http://jtblin.github.io/angular-chart.js/');
    factory(angular, Chart);
  }
}(function (angular, Chart) {
  'use strict';

  Chart.defaults.global.multiTooltipTemplate = '<%if (datasetLabel){%><%=datasetLabel%>: <%}%><%= value %>';
  Chart.defaults.global.tooltips.mode = 'label';
  Chart.defaults.global.elements.line.borderWidth = 2;
  Chart.defaults.global.elements.rectangle.borderWidth = 2;
  Chart.defaults.global.legend.display = false;
  Chart.defaults.global.colors = [
    '#97BBCD', // blue
    '#DCDCDC', // light grey
    '#F7464A', // red
    '#46BFBD', // green
    '#FDB45C', // yellow
    '#949FB1', // grey
    '#4D5360'  // dark grey
  ];

  var useExcanvas = typeof window.G_vmlCanvasManager === 'object' &&
    window.G_vmlCanvasManager !== null &&
    typeof window.G_vmlCanvasManager.initElement === 'function';

  if (useExcanvas) Chart.defaults.global.animation = false;

  return angular.module('chart.js', [])
    .provider('ChartJs', ChartJsProvider)
    .factory('ChartJsFactory', ['ChartJs', '$timeout', ChartJsFactory])
    .directive('chartBase', ['ChartJsFactory', function (ChartJsFactory) { return new ChartJsFactory(); }])
    .directive('chartLine', ['ChartJsFactory', function (ChartJsFactory) { return new ChartJsFactory('line'); }])
    .directive('chartBar', ['ChartJsFactory', function (ChartJsFactory) { return new ChartJsFactory('bar'); }])
    .directive('chartHorizontalBar', ['ChartJsFactory', function (ChartJsFactory) { return new ChartJsFactory('horizontalBar'); }])
    .directive('chartRadar', ['ChartJsFactory', function (ChartJsFactory) { return new ChartJsFactory('radar'); }])
    .directive('chartDoughnut', ['ChartJsFactory', function (ChartJsFactory) { return new ChartJsFactory('doughnut'); }])
    .directive('chartPie', ['ChartJsFactory', function (ChartJsFactory) { return new ChartJsFactory('pie'); }])
    .directive('chartPolarArea', ['ChartJsFactory', function (ChartJsFactory) { return new ChartJsFactory('polarArea'); }])
    .directive('chartBubble', ['ChartJsFactory', function (ChartJsFactory) { return new ChartJsFactory('bubble'); }])
    .name;

  /**
   * Wrapper for chart.js
   * Allows configuring chart js using the provider
   *
   * angular.module('myModule', ['chart.js']).config(function(ChartJsProvider) {
   *   ChartJsProvider.setOptions({ responsive: false });
   *   ChartJsProvider.setOptions('Line', { responsive: true });
   * })))
   */
  function ChartJsProvider () {
    var options = { responsive: true };
    var ChartJs = {
      Chart: Chart,
      getOptions: function (type) {
        var typeOptions = type && options[type] || {};
        return angular.extend({}, options, typeOptions);
      }
    };

    /**
     * Allow to set global options during configuration
     */
    this.setOptions = function (type, customOptions) {
      // If no type was specified set option for the global object
      if (! customOptions) {
        customOptions = type;
        options = angular.merge(options, customOptions);
      } else {
        // Set options for the specific chart
        options[type] = angular.merge(options[type] || {}, customOptions);
      }

      angular.merge(ChartJs.Chart.defaults, options);
    };

    this.$get = function () {
      return ChartJs;
    };
  }

  function ChartJsFactory (ChartJs, $timeout) {
    return function chart (type) {
      return {
        restrict: 'CA',
        scope: {
          chartGetColor: '=?',
          chartType: '=',
          chartData: '=?',
          chartLabels: '=?',
          chartOptions: '=?',
          chartSeries: '=?',
          chartColors: '=?',
          chartClick: '=?',
          chartHover: '=?',
          chartDatasetOverride: '=?'
        },
        link: function (scope, elem/*, attrs */) {
          if (useExcanvas) window.G_vmlCanvasManager.initElement(elem[0]);

          // Order of setting "watch" matter
          scope.$watch('chartData', watchData, true);
          scope.$watch('chartSeries', watchOther, true);
          scope.$watch('chartLabels', watchOther, true);
          scope.$watch('chartOptions', watchOther, true);
          scope.$watch('chartColors', watchOther, true);
          scope.$watch('chartDatasetOverride', watchOther, true);
          scope.$watch('chartType', watchType, false);

          scope.$on('$destroy', function () {
            destroyChart(scope);
          });

          scope.$on('$resize', function () {
            if (scope.chart) scope.chart.resize();
          });

          function watchData (newVal, oldVal) {
            if (! newVal || ! newVal.length || (Array.isArray(newVal[0]) && ! newVal[0].length)) {
              destroyChart(scope);
              return;
            }
            var chartType = type || scope.chartType;
            if (! chartType) return;

            if (scope.chart && canUpdateChart(newVal, oldVal))
              return updateChart(newVal, scope);

            createChart(chartType, scope, elem);
          }

          function watchOther (newVal, oldVal) {
            if (isEmpty(newVal)) return;
            if (angular.equals(newVal, oldVal)) return;
            var chartType = type || scope.chartType;
            if (! chartType) return;

            // chart.update() doesn't work for series and labels
            // so we have to re-create the chart entirely
            createChart(chartType, scope, elem);
          }

          function watchType (newVal, oldVal) {
            if (isEmpty(newVal)) return;
            if (angular.equals(newVal, oldVal)) return;
            createChart(newVal, scope, elem);
          }
        }
      };
    };

    function createChart (type, scope, elem) {
      var options = getChartOptions(type, scope);
      if (! hasData(scope) || ! canDisplay(type, scope, elem, options)) return;

      var cvs = elem[0];
      var ctx = cvs.getContext('2d');

      scope.chartGetColor = getChartColorFn(scope);
      var data = getChartData(type, scope);

      // Destroy old chart if it exists to avoid ghost charts issue
      // https://github.com/jtblin/angular-chart.js/issues/187
      destroyChart(scope);

      scope.chart = new ChartJs.Chart(ctx, {
        type: type,
        data: data,
        options: options
      });
      scope.$emit('chart-create', scope.chart);
      bindEvents(cvs, scope);
    }

    function canUpdateChart (newVal, oldVal) {
      if (newVal && oldVal && newVal.length && oldVal.length) {
        return Array.isArray(newVal[0]) ?
        newVal.length === oldVal.length && newVal.every(function (element, index) {
          return element.length === oldVal[index].length; }) :
          oldVal.reduce(sum, 0) > 0 ? newVal.length === oldVal.length : false;
      }
      return false;
    }

    function sum (carry, val) {
      return carry + val;
    }

    function getEventHandler (scope, action, triggerOnlyOnChange) {
      var lastState = null;
      return function (evt) {
        var atEvent = scope.chart.getElementsAtEvent || scope.chart.getPointsAtEvent;
        if (atEvent) {
          var activePoints = atEvent.call(scope.chart, evt);
          if (triggerOnlyOnChange === false || angular.equals(lastState, activePoints) === false) {
            lastState = activePoints;
            scope[action](activePoints, evt);
          }
        }
      };
    }

    function getColors (type, scope) {
      var colors = angular.copy(scope.chartColors ||
        ChartJs.getOptions(type).chartColors ||
        Chart.defaults.global.colors
      );
      var notEnoughColors = colors.length < scope.chartData.length;
      while (colors.length < scope.chartData.length) {
        colors.push(scope.chartGetColor());
      }
      // mutate colors in this case as we don't want
      // the colors to change on each refresh
      if (notEnoughColors) scope.chartColors = colors;
      return colors.map(convertColor);
    }

    function convertColor (color) {
      if (typeof color === 'object' && color !== null) return color;
      if (typeof color === 'string' && color[0] === '#') return getColor(hexToRgb(color.substr(1)));
      return getRandomColor();
    }

    function getRandomColor () {
      var color = [getRandomInt(0, 255), getRandomInt(0, 255), getRandomInt(0, 255)];
      return getColor(color);
    }

    function getColor (color) {
      return {
        backgroundColor: rgba(color, 0.2),
        pointBackgroundColor: rgba(color, 1),
        pointHoverBackgroundColor: rgba(color, 0.8),
        borderColor: rgba(color, 1),
        pointBorderColor: '#fff',
        pointHoverBorderColor: rgba(color, 1)
      };
    }

    function getRandomInt (min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function rgba (color, alpha) {
      // rgba not supported by IE8
      return useExcanvas ? 'rgb(' + color.join(',') + ')' : 'rgba(' + color.concat(alpha).join(',') + ')';
    }

    // Credit: http://stackoverflow.com/a/11508164/1190235
    function hexToRgb (hex) {
      var bigint = parseInt(hex, 16),
        r = (bigint >> 16) & 255,
        g = (bigint >> 8) & 255,
        b = bigint & 255;

      return [r, g, b];
    }

    function hasData (scope) {
      return scope.chartData && scope.chartData.length;
    }

    function getChartColorFn (scope) {
      return typeof scope.chartGetColor === 'function' ? scope.chartGetColor : getRandomColor;
    }

    function getChartData (type, scope) {
      var colors = getColors(type, scope);
      return Array.isArray(scope.chartData[0]) ?
        getDataSets(scope.chartLabels, scope.chartData, scope.chartSeries || [], colors, scope.chartDatasetOverride) :
        getData(scope.chartLabels, scope.chartData, colors, scope.chartDatasetOverride);
    }

    function getDataSets (labels, data, series, colors, datasetOverride) {
      return {
        labels: labels,
        datasets: data.map(function (item, i) {
          var dataset = angular.extend({}, colors[i], {
            label: series[i],
            data: item
          });
          if (datasetOverride && datasetOverride.length >= i) {
            angular.merge(dataset, datasetOverride[i]);
          }
          return dataset;
        })
      };
    }

    function getData (labels, data, colors, datasetOverride) {
      var dataset = {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.map(function (color) {
            return color.pointBackgroundColor;
          }),
          hoverBackgroundColor: colors.map(function (color) {
            return color.backgroundColor;
          })
        }]
      };
      if (datasetOverride) {
        angular.merge(dataset.datasets[0], datasetOverride);
      }
      return dataset;
    }

    function getChartOptions (type, scope) {
      return angular.extend({}, ChartJs.getOptions(type), scope.chartOptions);
    }

    function bindEvents (cvs, scope) {
      cvs.onclick = scope.chartClick ? getEventHandler(scope, 'chartClick', false) : angular.noop;
      cvs.onmousemove = scope.chartHover ? getEventHandler(scope, 'chartHover', true) : angular.noop;
    }

    function updateChart (values, scope) {
      if (Array.isArray(scope.chartData[0])) {
        scope.chart.data.datasets.forEach(function (dataset, i) {
          dataset.data = values[i];
        });
      } else {
        scope.chart.data.datasets[0].data = values;
      }

      scope.chart.update();
      scope.$emit('chart-update', scope.chart);
    }

    function isEmpty (value) {
      return ! value ||
        (Array.isArray(value) && ! value.length) ||
        (typeof value === 'object' && ! Object.keys(value).length);
    }

    function canDisplay (type, scope, elem, options) {
      // TODO: check parent?
      if (options.responsive && elem[0].clientHeight === 0) {
        $timeout(function () {
          createChart(type, scope, elem);
        }, 50, false);
        return false;
      }
      return true;
    }

    function destroyChart(scope) {
      if(! scope.chart) return;
      scope.chart.destroy();
      scope.$emit('chart-destroy', scope.chart);
    }
  }
}));



//- application
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

  var setUserLocation = function(callback){
    NavigatorGeolocation.getCurrentPosition()
      .then(function(position) {        
        _user.lat = position.coords.latitude;
        _user.lng = position.coords.longitude;
        $http.get('https://maps.googleapis.com/maps/api/geocode/json?latlng='+_user.lat+','+_user.lng+'&sensor=true').then(function(res){
          console.log(res.data);
          _user.formattedAddress = res.data.results[0].formatted_address;
        });
        if(typeof callback === 'function'){
          callback();
        }
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
    setUserLocation : setUserLocation
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
  
  var apiUrl = $window.location.origin + '/api';

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
      url: apiUrl + '/' + $scope.user.lat + '/' + $scope.user.lng + '/' + new Date($scope.time), 
      method: "GET",
      cache: true
    }).then(function(results) {
      $scope.riskText = results.data.precog.risk;
      $scope.riskLevel = results.data.precog.risk.toLowerCase();
      $scope.mostLikely = results.data.precog.guess.type;
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
    console.log($scope.user.manualLocation);
    $http.get('https://maps.googleapis.com/maps/api/geocode/json?address='+$scope.user.manualLocation.replace(' ','+')+'+Phoenix+AZ&sensor=true').then(function(res){
      $scope.user.lat = res.data.results[0].geometry.location.lat;
      $scope.user.lng = res.data.results[0].geometry.location.lng;
      $scope.user.formattedAddress = res.data.results[0].formatted_address;
      $scope.user.declinedLocation = false;
      getData();
    });
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
  
  var apiUrl = $window.location.origin + '/api';

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
      url: apiUrl + '/' + $scope.user.lat + '/' + $scope.user.lng + '/' + new Date($scope.time),  
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

niApp.directive("home", function () {
    return {
        templateUrl: 'home.html',
        controller: 'NIController'
    };
});

niApp.directive("more", function () {
    return {
        templateUrl: 'more.html',
        controller: 'MoreController'
    };
});
//= include services.js
niApp.config(function ($routeProvider) {
    $routeProvider.
    when('/', {
        templateUrl: 'home.html'
    }).
    when('/more', {
    	templateUrl: 'more.html'
    }).
    otherwise('/');
});

		


