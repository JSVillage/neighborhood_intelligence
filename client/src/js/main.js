//- bower components

//- application
//= include app.js
//= include directives.js 
//= include services.js 
		
		
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