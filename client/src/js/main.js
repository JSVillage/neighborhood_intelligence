//- bower components

//- application
//= include app.js
//= include directives.js 
//= include services.js 

		//Day Chart
		var ctx = document.getElementById("dayChart");
		var dayChart = new Chart(ctx, {
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
		        scales: {
		        	xAxes: [{
		        		ticks: {
		                    fontColor: 'white',
		                    fontSize: 9
		                },
		        		gridLines: {
		        			show: true,
		        			color: "white",

		        		} }] ,
		            yAxes: [{
		                ticks: {
		                    beginAtZero:true,
		                    fontColor: 'white',
		                    fontSize: 9
		                },
		                gridLines: {show: true, color: "white"}
				            }]
				        },
				title: {
					display: true,
            		text: 'Risk x Day',
					fontSize: 18,
					fontColor: "#fff"
				    },
				legend: {
		            display: true,
		            labels: {
	                	fontColor: 'rgb(255, 255, 132)',
	                	fontSize: 10
				            }
				        },
				data: {
					labels: {
						display: true,
						fontColor: 'rgb(255, 255, 132)',
	                	fontSize: 20
					}
					}
				}
				});
		//Time Chart
		var ctx = document.getElementById("timeChart");
		var timeChart = new Chart(ctx, {
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
		        scales: {
		        	xAxes: [{
		        		ticks: {
		                    fontColor: 'white',
		                    fontSize: 9
		                },
		        		gridLines: {
		        			show: true,
		        			color: "white",

		        		} }] ,
		            yAxes: [{
		                ticks: {
		                    beginAtZero:true,
		                    fontColor: 'white',
		                    fontSize: 9
		                },
		                gridLines: {show: true, color: "white"}
				            }]
				        },
				title: {
					display: true,
            		text: 'Risk x Time',
					fontSize: 18,
					fontColor: "#fff"
				    },
				legend: {
		            display: true,
		            labels: {
	                	fontColor: 'rgb(255, 255, 132)',
	                	fontSize: 10
				            }
				        },
				data: {
					labels: {
						display: true,
						fontColor: 'rgb(255, 255, 132)',
	                	fontSize: 20
					}
					}
				}
				});
		
			d = new Date();//create date object and get current time and date
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
			}
			// When the user clicks anywhere outside of the modal, close it
			window.onclick = function(event) {
			    if (event.target == modal) {
			        modal.style.display = "none";
			    }
			}