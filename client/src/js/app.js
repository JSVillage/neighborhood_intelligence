var niApp = angular.module('niApp', ["ngRoute"]);
niApp.controller('NIController', function NIController($scope, $window) {
	$scope.address = {
		block: '600 block',
		street: '6908 E Thomas Rd',
		city: 'Scottsdale',
		zip: '85251'
	};
	$scope.risk = {
		level: ['High', 'Medium', 'Low']
	};
  $scope.mostLikely = "MURDER";

  var d = new Date();//create date object and get current time and date
	document.getElementById("time").innerHTML = d.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'});

	// Get the modal
	var modal = document.getElementById('howModal');
	// Get the button that opens the modal
	var btn = document.getElementById("how");
	// Get the <span> element that closes the modal
	var span = document.getElementsByClassName("close")[0];
	// When the user clicks on the button, open the modal 
	btn.onclick = function() {
	modal.style.display = "block";
	}
	// When the user clicks on <span> (x), close the modal
	span.onclick = function() {
		modal.style.display = "none";
	};
	// When the user clicks anywhere outside of the modal, close it
	$window.onclick = function(event) {
		if (event.target == modal) {
		    modal.style.display = "none";
			}
		};
    }); 
niApp.controller('MoreController', function MoreController($scope, $window) {
    $scope.highestDay = "Insert highest Day";
    $scope.highestTime = "Insert highest Time";
    //Type Chart
	var ctxdo = document.getElementById("typeChart");
	var dayChart = new Chart(ctxdo, {
	    type: 'doughnut',
	    data: {
	        labels: ["MOTOR VEHICLE THEFT", "LARCENY-THEFT", "DRUG OFFENSE", "RAPE", "BURGLARY", "AGGRAVATED ASSAULT", "MURDER", "ROBBERY", "OTHER"],
	        datasets: [{
	            label: 'Crimes',
	            data: [12, 19, 3, 5, 2, 6, 3, 14, 20],
	            backgroundColor: [
	                'rgba(255, 0, 255, 0.3',
	                'rgba(0, 0, 255, 0.3',
	                'rgba(255, 255, 0, 0.3',
	                'rgba(0, 255, 255, 0.3',
	                'rgba(255, 0, 0, 0.3',
	                'rgba(128, 64, 200, 0.3',
	                'rgba(200, 64, 64, 0.3',
	                'rgba(0, 255, 0, 0.3',
	                'rgba(255, 153, 51, 0.3'
	            ],
	            borderColor: [
	                'rgba(255,0,255,1)',
	                'rgba(0, 0, 255, 1)',
	                'rgba(255, 255, 0, 1)',
	                'rgba(0, 255, 255, 1)',
	                'rgba(255, 0, 0, 1)',
	                'rgba(128, 64, 200, 1)',
	                'rgba(200, 64, 64, 1)',
	                'rgba(0, 255, 0, 1)',
	                'rgba(255, 153, 51, 0.3'
	            ],
		    	borderWidth: 1
		        }]
		    },
	    options: {
	    	responsive: false,
	        
			title: {
				display: true,
        		text: 'History at this location',
				fontSize: 20,
				fontColor: "#fff"
			    },
			legend: {
	            display: true,
	            labels: {
                	fontColor: 'rgb(255, 255, 132)',
                	fontSize: 10
			            }
			        },
				}
			});
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
/*niApp.controller('ChartsController', function ChartsController($scope, $window){
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
