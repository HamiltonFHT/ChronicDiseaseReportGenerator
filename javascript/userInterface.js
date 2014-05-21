// **************************************************************************************************************************************************
// @author Brice Wong
// Copyright 2014 Hamilton Family Health Team
//
// userInterface.js
// 
// This document contains the global variables and functions that are associated with the user interface of the Report Generator. User interface 
// elements are added to the DOM after files are uploaded and read by the FileReader. It creates different sections of the panel to select different
// filters, such as selecting by physician, selecting by diabetic measure, and the settings menus. The filters in each panel are created dynamically 
// to only contain information that exists in the imported files. It also contains the code to update the filters based on user input, such as 
// changing the classes of the filters based on onClick events fired in the document.
//
// **************************************************************************************************************************************************


// Array variables that will store information about filters and user interface status
// 
// arrayUniquePhysicians: Stores all the unique instances of "Doctor Number" for all imported files
// 
// arraySelectedPhysicians: Stores Boolean values of whether each physician is selected for the aggregated line
var arrayUniquePhysicians,
	arraySelectedPhysicians;
	

	
/*
* addSidePanel:
* - Add user interface elements to the #sidePanel div declared in 'index.html'
* 
*/
function addSidePanels() {

	arrayUniquePhysicians = [];
	arraySelectedPhysicians = [];
	
	// If uploading new files, remove old side panels and recreate the panels with new filters based on the new imported data
	// physicianSection, measuresSection, settingsSection
	if (document.getElementById("physicianSection")) {
		console.log("Removing old physician panel...");
		document.getElementById("sidePanel").removeChild(document.getElementById("physicianSection"));
	}
	
	if (document.getElementById("measuresSection")) {
		console.log("Removing old measures panel...");
		document.getElementById("sidePanel").removeChild(document.getElementById("measuresSection"));
	}
	
	if (document.getElementById("settingsSection")) {
		console.log("Removing old sections panel...");
		document.getElementById("sidePanel").removeChild(document.getElementById("settingsSection"));
	}
	
	console.log("Adding side panels...");

	// Adding a panel section for selecting physicians
	d3.select("#sidePanel").append("div")
		.attr("class", "sidePanelSection")
		.attr("id", "physicianSection")
	
	// Adding a div within 'physicianSection' for the legend
	d3.select("#physicianSection").append("div")
		.attr("id", "physicianLegend")
		
	// Adding an unordered list within 'physicianLegend'. This unordered list will contain one list item for each option in the filter.
	// One for each unique physician through all imported files, and one for selecting all physicians
	d3.select("#physicianLegend").append("ul")
		.attr("id", "physicianLegendList")
	
	// Loop through each imported file to retrieve unique instances of Doctor Number
	for (var i = 0; i < arrayParsedData.length; i++) {
	
		// Loop through each row in the file. Do not look at headers, so start at row j = 1
		for (var j = 1; j < arrayParsedData[i].length; j++) {
		
			// If 'arrayUniquePhysicians' does not already contain that "Doctor Number", add it to the array
			if (!arrayUniquePhysicians.contains(arrayParsedData[i][j][DEFAULT_COLUMN_DOCTOR_NUMBER]))
				arrayUniquePhysicians.push(arrayParsedData[i][j][DEFAULT_COLUMN_DOCTOR_NUMBER]);
		}
	}
	
	// Sort 'arrayUniquePhysicians' so the number displayed in ascending order
	arrayUniquePhysicians.sort(function(a, b) { return a - b; });
	
	// Loop through 'arrayUniquePhysicians' and create a list item for each element. These will be the physician filters that will appear in the side
	// panel. There will also be a filter for "All Selected Physicians"
	for (var i = 0; i < arrayUniquePhysicians.length + 1; i++) {
		
		// Append a list item to the unordered list 'physicianLegendList'. Set its classes to be 'legendListItem', 'physicianListItem', 'selected'
		// Selected by default
		d3.select("#physicianLegendList").append("li")
			.attr("class", "legendListItem physicianListItem selected")
			.on("click", toggleSelected)
	}
	
	// Retrieve an array of all physician list items
	var physicianListItems = document.getElementsByClassName("physicianListItem");
	console.log("Populating physicians...");
	
	// Looping through the array of physician list items
	for (var i = 0; i < physicianListItems.length; i++) {
	
		// First item, i.e. "Select All Doctors"
		if (i == 0) {
			physicianListItems[i].innerHTML += "<span class='physicianItemLabel'><span class='checkmark'>\u2714</span> Select All</span>";
		}
		
		// Every other doctor. All doctors are selected by default
		else {
			arraySelectedPhysicians[i - 1] = true;
			physicianListItems[i].innerHTML += "<span class='physicianItemLabel'><span class='checkmark'>\u2714</span> Doctor Number " + arrayUniquePhysicians[i - 1].toString() + "</span>";
		}
	}
	
	// If tracking mode
	// Add a section in the sidebar for the diabetic measures
	if (currentMode == "tracking") {
	
		d3.select("#sidePanel").append("div")
			.attr("class", "sidePanelSection")
			.attr("id", "measuresSection")
			
		console.log("Populating diabetic measures...");
		
		// Add a drop down menu for the diabetic measures	
		d3.select("#measuresSection").append("select")
			.attr("id", "dropdownDiabeticMeasures")
			.on("change", calculateAndGenerate)
				
		// Add the options for the different diabetic measures in the drop down menu
		// Created dynamically based on default values
		// To do: variables to store user input values
		d3.select("#dropdownDiabeticMeasures").append("option")
			.text("Diabetic Assessment in past " + DEFAULT_VALUE_DIABETIC_ASSESSMENT + " months")
			.attr("id", "optionDiabeticAssessment")
		
		d3.select("#dropdownDiabeticMeasures").append("option")
			.text("A1C measured in past " + DEFAULT_VALUE_A1C_MEASURED + " months")
			.attr("id", "optionA1CMeasured")
		
		d3.select("#dropdownDiabeticMeasures").append("option")
			.text("A1C \u2264 " + DEFAULT_VALUE_A1C_COMPARED + " in past " + DEFAULT_VALUE_A1C_MEASURED + " months")
			.attr("id", "optionA1CCompared")
		
		d3.select("#dropdownDiabeticMeasures").append("option")
			.text("BP measured in past " + DEFAULT_VALUE_BP_MEASURED + " months")
			.attr("id", "optionBPMeasured")
			
		d3.select("#dropdownDiabeticMeasures").append("option")
			.text("BP < " + DEFAULT_VALUE_BP_SYS_COMPARED + "/" + DEFAULT_VALUE_BP_DIAS_COMPARED + " in past " + DEFAULT_VALUE_BP_MEASURED + " months")
			.attr("id", "optionBPCompared")
			
		d3.select("#dropdownDiabeticMeasures").append("option")
			.text("LDL measured in past " + DEFAULT_VALUE_LDL_MEASURED + " months")
			.attr("id", "optionLDLMeasured")
			
		d3.select("#dropdownDiabeticMeasures").append("option")
			.text("LDL \u2264 " + DEFAULT_VALUE_LDL_COMPARED + " in past " + DEFAULT_VALUE_LDL_MEASURED + " months")
			.attr("id", "optionLDLCompared")
			
		d3.select("#dropdownDiabeticMeasures").append("option")
			.text("ACR measured in past " + DEFAULT_VALUE_ACR_MEASURED + " months")
			.attr("id", "optionACRMeasured")
			
		// d3.select("#dropdownDiabeticMeasures").append("option")
			// .text("ACR Male < " + DEFAULT_VALUE_ACR_MALE_COMPARED + " in past " + DEFAULT_VALUE_ACR_MEASURED + " months")
			// .attr("id", "optionACRMaleCompared")
			
		// d3.select("#dropdownDiabeticMeasures").append("option")
			// .text("ACR Female < " + DEFAULT_VALUE_ACR_FEMALE_COMPARED + " in past " + DEFAULT_VALUE_ACR_MEASURED + " months")
			// .attr("id", "optionACRFemaleCompared")
		
		d3.select("#dropdownDiabeticMeasures").append("option")
			.text("eGFR measured in past " + DEFAULT_VALUE_EGFR_MEASURED + " months")
			.attr("id", "optionEGFRMeasured")
		
		d3.select("#dropdownDiabeticMeasures").append("option")
			.text("eGFR > " + DEFAULT_VALUE_EGFR_COMPARED + " in past " + DEFAULT_VALUE_EGFR_MEASURED + " months")
			.attr("id", "optionEGFRCompared")
		
		d3.select("#dropdownDiabeticMeasures").append("option")
			.text("Retinopathy")
			.attr("id", "optionRetinopathy")
		
		d3.select("#dropdownDiabeticMeasures").append("option")
			.text("Foot Checks")
			.attr("id", "optionFootChecks")
		
		d3.select("#dropdownDiabeticMeasures").append("option")
			.text("Self-Management")
			.attr("id", "optionSelfManagement")

		d3.select("#dropdownDiabeticMeasures").append("option")
			.text("Current Smokers")
			.attr("id", "optionCurrentSmokers")
			
	}
	
	// Add a section in the side bar for the buttons for settings, save-to-PDF, etc.
	d3.select("#sidePanel").append("div")
		.attr("class", "sidePanelSection")
		.attr("id", "settingsSection")
	
	// Save to PNG	
	d3.select("#settingsSection").append("input")
		.attr("type", "button")
		.attr("value", "Save as image")
		.on("click", function () {

			// Append canvas to the document
			d3.select("body").append("canvas")
				.attr("id", "outputCanvas")
				.attr("width", DEFAULT_CANVAS_WIDTH)
				.attr("height", DEFAULT_CANVAS_HEIGHT)
				.style("border", "1px solid black")
				.style("display", "none")
				
			// Retrieve output canvas and copy the current visualization into the canvas
			var output = document.getElementById("outputCanvas");
			var svgXML = (new XMLSerializer()).serializeToString(document.getElementById("canvasSVG"));	
			canvg(output, svgXML, { ignoreDimensions: true })
			
			// Retrieve data string of the canvas and append to the hidden img element
			var outputURL = output.toDataURL();
			document.getElementById("outputImg").src = outputURL;
			
			// Modify attributes of hidden elements and simulate file download
			document.getElementById("outputA").download = visualizationTitle;
			document.getElementById("outputA").href = outputURL;
			document.getElementById("outputA").click();
		})
	
	// Toggle data labels
	d3.select("#settingsSection").append("input")
		.attr("type", "button")
		.attr("value", "Toggle data labels")
		.on("click", toggleDataLabels)
	
}





/*
* toggleSelected:
* - If selected, toggle unselected, and vice versa
* 
* @param target The list item that called this function
*/
function toggleSelected() {

	// Retrieve an array of all physician item labels
	var physicianListItems = document.getElementsByClassName("physicianListItem");
	
	// If clicked on "Select All"
	if (this.innerHTML.indexOf("Select All") != -1) {
		
		// If class has 'selected', unselect it and unselect all doctors
		if (this.className.indexOf("selected") != -1) {
			
			// Splice out 'selected' and add 'notSelected'
			this.className = this.className.substring(0, this.className.indexOf("selected")) + "notSelected";
			
			// Set everything to false and 'notSelected', start at index 1
			for (var i = 1; i < physicianListItems.length; i++) {
				
				// Update each element in the array
				arraySelectedPhysicians[i - 1] = false;
				
				// If doctor is 'selected', unselect it
				if (physicianListItems[i].className.indexOf("selected") != -1)
					physicianListItems[i].className = physicianListItems[i].className.substring(0, physicianListItems[i].className.indexOf("selected")) + "notSelected";
			}
		}
		
		// Else class has 'notSelected', select it and select all doctors
		else {
		
			// Splice out 'notSelected' and add 'selected'
			this.className = this.className.substring(0, this.className.indexOf("notSelected")) + "selected";
			
			// Set everything to true and 'selected'
			for (var i = 1; i < physicianListItems.length; i++) {
			
				// Update each element in the array
				arraySelectedPhysicians[i - 1] = true;
				
				// If doctor is 'notSelected', select it
				if (physicianListItems[i].className.indexOf("notSelected") != -1)
					physicianListItems[i].className = physicianListItems[i].className.substring(0, physicianListItems[i].className.indexOf("notSelected")) + "selected";
			}
		}
	}	
	
	// Otherwise, clicked on an individual doctor
	else {
		
		// If clicked doctor is selected
		if (this.className.indexOf("selected") != -1) {
		
			// Check "Select All", if "Select All" is selected, unselect it AND unselect the clicked doctor, otherwise just unselect the clicked doctor
			if (physicianListItems[0].className.indexOf("selected") != -1) {
			
				// Updating classes of "Select All" and clicked doctor
				physicianListItems[0].className = physicianListItems[0].className.substring(0, physicianListItems[0].className.indexOf("selected")) + "notSelected";
				this.className = this.className.substring(0, this.className.indexOf("selected")) + "notSelected";
				
				// Search innerHTML for Doctor Number, match against arrayUniquePhysicians for the array index, use index to update selected Boolean
				var docNum = this.innerHTML.substring(this.innerHTML.indexOf("Doctor") + 14, this.innerHTML.length - 7);
				var index = arrayUniquePhysicians.getArrayIndex(docNum);
				arraySelectedPhysicians[index] = false;
			}
			
			// "Select All" is not selected, so just unselect the clicked doctor 
			else {
			
				// Update class name, get index in innerHTML and update array based on the index
				// 14 is based on the number of characters "Doctor Number "
				// 7 is based on the number of characters "</span>"
				// This will need to be updated if we show actual physician names
				this.className = this.className.substring(0, this.className.indexOf("selected")) + "notSelected";
				var docNum = this.innerHTML.substring(this.innerHTML.indexOf("Doctor") + 14, this.innerHTML.length - 7);
				var index = arrayUniquePhysicians.getArrayIndex(docNum);
				arraySelectedPhysicians[index] = false;
			}
		}
		
		// Clicked doctor is not selected
		else {
			
			// Select it and update array
			this.className = this.className.substring(0, this.className.indexOf("notSelected")) + "selected";
			var docNum = this.innerHTML.substring(this.innerHTML.indexOf("Doctor") + 14, this.innerHTML.length - 7);
			var index = arrayUniquePhysicians.getArrayIndex(docNum);
			arraySelectedPhysicians[index] = true;
			
			// Loop through array to see if ALL doctors are now selected, if so, select "Select All"
			if (arraySelectedPhysicians.allEqualsBoolean(true)) {
				physicianListItems[0].className = physicianListItems[0].className.substring(0, physicianListItems[0].className.indexOf("notSelected")) + "selected";
			}
		}	
	}
	
	// After toggling, filter the data for calculations and graph the data
	filterData();
	calculateAndGenerate();
}



function calculateAndGenerate() {

	if (currentMode == "snapshot") {
	
		calculateDataSnapshotMode();
		clearCanvas();
		generateVisualizationSnapshotMode();
	}
	
	else {
	
		calculateDataTrackingMode();
		clearCanvas();
		generateVisualizationTrackingMode();
		
	}
}


/*
* toggleDataLabels:
* - Turns the data labels in a data visualization on and off.
*

function toggleDataLabels() {
			
	// Find data labels
	if (d3.selectAll(".dataLabel")[0].length > 0) {
		showDataLabels = !showDataLabels;
		d3.selectAll(".dataLabel").remove();
	}
	
	else {
	
		showDataLabels = !showDataLabels;
		
		// Add labels for data points
		canvas.selectAll(".dataLabel")
			.data(arrayCalculatedData)
			.enter().append("text")
				.attr("class", "dataLabel")
				.attr("x", function(d, i) { return xScale(arrayDates[i]); })
				.attr("y", function(d, i) { return yScale(arrayCalculatedData[i][0] * 100) - 15; }) // 15 pixels above data point
				.attr("text-anchor", "middle")
				.style("fill", "black")
				.style("font-size", "16px")
				.style("font-family", "Arial")
				.text(function(d, i) { 
					if ((arrayCalculatedData[i][0] * 100) == 0)
						return (arrayCalculatedData[i][0] * 100).toFixed(0) + "%";
					else 
					return (arrayCalculatedData[i][0] * 100).toFixed(1) + "%";
				})
	}

}
*/

/*
* contains:
* - Declare a 'contains' function for the prototype of an Array object. 
* - Loops through the array to see if any of its elements is equal to the object in both variable type and value. Only works on 1-dimensional arrays.
* 
* @param obj The object to find in the array
*/
Array.prototype.contains = function(obj) {
	
	// Sets 'len' to the length of the array and checks each element, while decrementing the index
	var len = this.length;
	while (len--) {
	
		// If the element and object matches in both variable type and value, return true
		if (this[len] === obj) return true;
	}
	
	// Checked entire array and could not find a match. Return false
	return false;
}


/*
* allEqualsBoolean:
* - Declare an 'allEqualsBoolean' function for the prototype of an Array object.
* - Loops through the array to match each element with bool. Only works on 1-dimensional arrays.
* 
* @param bool The Boolean value to compare with each element in the array. Returns true if all elements are equal to the Boolean value
*/
Array.prototype.allEqualsBoolean = function(bool) {

	// Sets 'len' to the length of the array and checks each element, while decrementing the index
	var len = this.length;
	while (len--) {
	
		// If element doesn't match the passed in Boolean value, return false
		if (this[len] != bool) return false;
	}
	
	// If all elements match, return true
	return true;
}


/*
* getArrayIndex:
* - Declare a 'getArrayIndex' function for the prototype of an Array object.
* - Searches an array for a specific and returns the array index of the found object. Returns -1 if object cannot be found
*
* @param ele The element to search for in the array
*/
Array.prototype.getArrayIndex = function(ele) {

	// Sets 'len' to the length of the array and checks each element to see if it exists, while decrementing the index
	var len = this.length;
	while (len--) {
		
		// Return array index of the element if it finds a match
		if (this[len] === ele) return len;
	}
	
	// Return -1 if cannot find a match
	return -1;
}	


