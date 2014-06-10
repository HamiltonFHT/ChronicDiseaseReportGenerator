var reportViewer = (function() {
	//var canvas = d3.select("#canvasContainer").append("svg")
	//				.attr("id", "canvasSVG");
	var canvas = d3.select("#canvasContainer").select("#canvasSVG");
	
	var mode = "";
	
	var calculatedData = null;
	var selectedPhysicians = null;
	var arrayDates = null;
	
	var tracking_measure = 0;
	
	var reportTitle = "";
	var xScale, yScale, xAxis, yAxis;
	
	var DEFAULT_CANVAS_WIDTH = 960;  		// pixels
	var DEFAULT_CANVAS_HEIGHT = 480;    	// pixels
	
	var DEFAULT_PADDING_LEFT_SNAPSHOT_MODE = 300;
	var DEFAULT_PADDING_TOP_SNAPSHOT_MODE = 50;
	
	var	DEFAULT_COLUMN_CURRENT_DATE = 23;

	var DEFAULT_GRAPH_WIDTH_SNAPSHOT_MODE = DEFAULT_CANVAS_WIDTH - DEFAULT_PADDING_LEFT_SNAPSHOT_MODE - 25;
	var DEFAULT_GRAPH_HEIGHT_SNAPSHOT_MODE = DEFAULT_CANVAS_HEIGHT - 2 * DEFAULT_PADDING_TOP_SNAPSHOT_MODE;
	
	var DEFAULT_PADDING_LEFT_TRACKING_MODE = 75;
	var DEFAULT_PADDING_TOP_TRACKING_MODE = 50;
	
	var DEFAULT_GRAPH_WIDTH_TRACKING_MODE = DEFAULT_CANVAS_WIDTH - 2 * DEFAULT_PADDING_LEFT_TRACKING_MODE;
	var DEFAULT_GRAPH_HEIGHT_TRACKING_MODE = DEFAULT_CANVAS_HEIGHT - 2 * DEFAULT_PADDING_TOP_TRACKING_MODE;
	
	var DEFAULT_COLOURS = ["firebrick", "steelblue", "yellowgreen", "mediumpurple", "cadetblue",
							"sandybrown", "slategray", "goldenrod", "darkslateblue", "palevioletred",
							"forestgreen", "sienna", "bisque"];

	function clearCanvas() {
		document.getElementById("canvasContainer").removeChild(document.getElementById("canvasSVG"));
		
		canvas = d3.select("#canvasContainer").append("svg")
					.attr("id", "canvasSVG")
					// Set the width and height of the canvas
					.attr("width", DEFAULT_CANVAS_WIDTH)
					.attr("height", DEFAULT_CANVAS_HEIGHT)
					.style("border", "1px solid lightgray")
						.append("g")
							.attr("transform", function() {
								switch (mode) {
								
								case "snapshot":
									return "translate(" + DEFAULT_PADDING_LEFT_SNAPSHOT_MODE + ", " + DEFAULT_PADDING_TOP_SNAPSHOT_MODE + ")";
								break;
									
								case "tracking":
									return "translate(" + DEFAULT_PADDING_LEFT_TRACKING_MODE + ", " + DEFAULT_PADDING_TOP_TRACKING_MODE + ")";
								break;
						}	
				});
	};
	
	function addSidePanels() {
		//reportData.physicianList contains 2 columns and n rows
		//[Doctor number, boolean selected]
		
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
			.attr("id", "physicianSection");
		
		// Adding a div within 'physicianSection' for the legend
		d3.select("#physicianSection").append("div")
			.attr("id", "physicianLegend");
			
		// Adding an unordered list within 'physicianLegend'. This unordered list will contain one list item for each option in the filter.
		// One for each unique physician through all imported files, and one for selecting all physicians
		d3.select("#physicianLegend").append("ul")
			.attr("id", "physicianLegendList");
		
		// Loop through 'arrayUniquePhysicians' and create a list item for each element. These will be the physician filters that will appear in the side
		// panel. There will also be a filter for "All Selected Physicians"
		for (var i = 0; i < Object.keys(selectedPhysicians).length+1; i++) {
			
			// Append a list item to the unordered list 'physicianLegendList'. Set its classes to be 'legendListItem', 'physicianListItem', 'selected'
			// Selected by default
			d3.select("#physicianLegendList").append("li")
				.attr("class", "legendListItem physicianListItem")
				.on("click", toggleSelected);
		}
		
		// Retrieve an array of all physician list items
		var physicianListItems = document.getElementsByClassName("physicianListItem");
		console.log("Populating physicians...");
		
		// Looping through the array of physician list items
		for (var i = 0; i < physicianListItems.length; i++) {
		
			// First item, i.e. "Select All Doctors"
			if (i == 0) {
				physicianListItems[i].innerHTML += "<span class='physicianItemLabel'><span class='checkmark'>\u2714</span> Select All</span>";
				
				var all_selected = true;
				for (doc in selectedPhysicians) {
					if (selectedPhysicians.hasOwnProperty(doc) &
						selectedPhysicians[doc] == false){
						all_selected = false;
					} 
				}
				if (all_selected) {
					physicianListItems[i].classList.add("selected");				
				} else {
					physicianListItems[i].classList.add("notSelected");
				}
			}
			
			// Every other doctor. All doctors are selected by default
			else {
				//arraySelectedPhysicians[i - 1] = true;
				var doc = Object.keys(selectedPhysicians)[i-1];
				physicianListItems[i].innerHTML += "<span class='physicianItemLabel'><span class='checkmark'>\u2714</span> Doctor Number " + doc + "</span>";
				if (selectedPhysicians[doc] == true) {
					physicianListItems[i].classList.add("selected");
				} else {
					physicianListItems[i].classList.add("notSelected");
				}
				
				
			}
		}
		
		
		
		
		// If tracking mode
		// Add a section in the sidebar for the diabetic measures
	
		if (mode == "tracking") {
		
			d3.select("#sidePanel").append("div")
				.attr("class", "sidePanelSection")
				.attr("id", "measuresSection");
				
			console.log("Populating diabetic measures...");
			
			// Add a drop down menu for the diabetic measures	
			d3.select("#measuresSection").append("select")
				.attr("id", "dropdownDiabeticMeasures")
				.on("change", function() { updateTrackingMeasure(this.selectedIndex); });
					
			// Add the options for the different diabetic measures in the drop down menu
			// Created dynamically based on default values
			// To do: variables to store user input values
			for (var i = 0; i < calculatedData.length; i++) {
				d3.select("#dropdownDiabeticMeasures").append("option")
					.text(calculatedData[0][i]["desc"])
					.attr("id", "optionDiabeticAssessment");
			}
		}
		
		// Add a section in the side bar for the buttons for settings, save-to-PDF, etc.
		d3.select("#sidePanel").append("div")
			.attr("class", "sidePanelSection")
			.attr("id", "settingsSection");
		
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
					.style("display", "none");
					
				// Retrieve output canvas and copy the current visualization into the canvas
				var output = document.getElementById("outputCanvas");
				var svgXML = (new XMLSerializer()).serializeToString(document.getElementById("canvasSVG"));	
				canvg(output, svgXML, { ignoreDimensions: true });
				
				// Retrieve data string of the canvas and append to the hidden img element
				var outputURL = output.toDataURL();
				document.getElementById("outputImg").src = outputURL;
				
				// Modify attributes of hidden elements and simulate file download
				//TODO get reportTitle here
				console.log("reportTitle: " + reportTitle);
				document.getElementById("outputA").download = reportTitle;
				document.getElementById("outputA").href = outputURL;
				document.getElementById("outputA").click();
			});
		
		// Toggle data labels
		d3.select("#settingsSection").append("input")
			.attr("type", "button")
			.attr("value", "Toggle data labels")
			.on("click", toggleDataLabels);
	};
	
	function updateTrackingMeasure(selectedIndex) {
		console.log("Selected: ", selectedIndex);
	}
	
	function generateCharts(rd_calculatedData, rd_selectedPhysicians, rd_arrayDates) {
		
		mode = rd_arrayDates.length > 1 ? "tracking" : "snapshot";
		calculatedData = rd_calculatedData;
		selectedPhysicians = rd_selectedPhysicians;
		arrayDates = rd_arrayDates;
				
		clearCanvas();
		addSidePanels();
		
		if (calculatedData == undefined) {
			console.log("calculatedData undefined");
			return;
		}
		
		if (mode == "snapshot") {
			calculatedData = calculatedData[0];
			genVisSnapshot();
		} else {
			genVisTracking();
		}
	}
	
	function genVisSnapshot(){
		console.log("Generating visualization for Snapshot Mode...");

		if (calculatedData.length == 0) {
			return;
		}

		//var calculatedData = reportData.calculatedData();
		// Add rectangles for percentage of patients within criteria
		var arrayData = [];
		var arrayDesc = [];
		for (var i=0; i < calculatedData.length; i++) {
			arrayData.push(calculatedData[i]["passed"] / calculatedData[i]["total"] * 100);
			arrayDesc.push(calculatedData[i]["desc"]);
		}


		xScale = d3.scale.linear()
			.domain([0, 100])
			.range([0, DEFAULT_GRAPH_WIDTH_SNAPSHOT_MODE]);
			
		xAxis = d3.svg.axis()
			.scale(xScale)
			.orient("bottom")
			.tickFormat(function(d) { return d + "%"; });
		
		yScale = d3.scale.ordinal()
			.domain(arrayDesc)
			.rangeRoundBands([0, DEFAULT_GRAPH_HEIGHT_SNAPSHOT_MODE], 0.1);
			
		yAxis = d3.svg.axis()
			.scale(yScale)
			.orient("left");
			
		canvas.selectAll(".tickline")
			.data(xScale.ticks(10))
			.enter().append("line")
				.attr("x1", xScale)
				.attr("x2", xScale)
				.attr("y1", 0)
				.attr("y2", DEFAULT_GRAPH_HEIGHT_SNAPSHOT_MODE)
				.style("stroke", "#ccc")
				.style("stroke-width", 1)
				.style("opacity", 0.7);
			

		
		canvas.selectAll("onTargetBar")
			.data(arrayData)
			.enter().append("rect")
				.attr("class", "onTargetBar")
				.attr("width", function(d) { return xScale(d); })
				.attr("height", yScale.rangeBand())
				.attr("y", function (d, i) { return yScale(arrayDesc[i]); })
				.attr("fill", DEFAULT_COLOURS[0])
				.style("stroke", "black")
				.style("stroke-width", "1px")
				.attr("shape-rendering", "crispEdges");
				
		// Add bars for patients not within criteria
		canvas.selectAll("offTargetBar")
			.data(arrayData)
			.enter().append("rect")
				.attr("class", "offTargetBar")
				.attr("width", function(d) { return xScale(100 - d); })
				.attr("height", yScale.rangeBand())
				.attr("x", function(d) { return xScale(d); })
				.attr("y", function(d, i) { return yScale(arrayDesc[i]); })
				.attr("fill", "white")
				.style("stroke", "black")
				.style("stroke-width", "1px")
				.attr("shape-rendering", "crispEdges");
		
		canvas.append("g")
			.attr("transform", "translate(0, " + DEFAULT_GRAPH_HEIGHT_SNAPSHOT_MODE + ")")
			.style("font-family", "Arial")
			.style("font-size", "14px")
			.call(xAxis);
			
		canvas.append("g")
			.style("font-family", "Arial")
			.style("font-size", "14px")
			.call(yAxis);
		
		// Add styling and attributes for major ticks in axes
		var majorTicks = document.getElementsByClassName("tick major");
		for (var i = 0; i < majorTicks.length; i++) {
			majorTicks[i].childNodes[0].setAttribute("style", "fill:none; stroke:black");
			majorTicks[i].childNodes[0].setAttribute("shape-rendering", "crispEdges");
		}
		
		
		// Add styling and attributes for axes paths
		var paths = document.getElementsByClassName("domain");
		for (var i = 0; i < paths.length; i++) {
			paths[i].setAttribute("style", "fill:none; stroke:black");
			paths[i].setAttribute("shape-rendering", "crispEdges");
		}
		
		canvas.selectAll("onTargetLabel")
			.data(arrayData)
			.enter().append("text")
				.attr("class", "dataLabel")
				.attr("x", function(d, i) { return xScale(d / 2); })
				.attr("y", function(d, i) { return yScale(arrayDesc[i]) + (yScale.rangeBand()/2); })
				.attr("text-anchor", "middle")
				.style("font-family", "Arial")
				.style("font-size", "13px")
				.attr("dy", ".35em")
				.style("fill", "white")
				.text(function(d) { if (d > 0) return d.toFixed(1) + "%"; else return ""; });
		
		canvas.selectAll("offTargetLabel")
			.data(arrayData)
			.enter().append("text")
				.attr("class", "dataLabel")
				.attr("x", function(d) { return xScale((100 - d)/2 + parseFloat(d)); })
				.attr("y", function(d, i) { return yScale(arrayDesc[i]) + (yScale.rangeBand()/2); })
				.attr("text-anchor", "middle")
				.attr("dy", ".35em")
				.style("fill", "black")
				.style("font-family", "Arial")
				.style("font-size", "13px")
				.text(function(d) { if (100 - d < 100) return (100 - d).toFixed(1) + "%"; })
				// don't display off target labels
				.attr("display", "none");
		
		// Graph title text
		canvas.append("text")
			.attr("class", "graphTitle")
			.attr("x", DEFAULT_GRAPH_WIDTH_SNAPSHOT_MODE / 2)
			.attr("y", -DEFAULT_PADDING_TOP_SNAPSHOT_MODE / 2 + 10)
			.attr("text-anchor", "middle")
			.style("font-size", "14px")
			.style("font-weight", "bold")
			.text(function() {
				var title = "Diabetes Report for Doctor";
				var arraySelectedOnly = [];

				for (var doc in selectedPhysicians) {
					if (selectedPhysicians[doc] == true)
						arraySelectedOnly.push(doc);
				}
				
				if (arraySelectedOnly.length > 1) title += "s ";
				else title += " ";
				for (var i = 0; i < arraySelectedOnly.length; i++) {
					if (i == arraySelectedOnly.length - 2)
						title += arraySelectedOnly[i] + " and ";
					else if (i == arraySelectedOnly.length - 1)	
						title += arraySelectedOnly[i];
					else title += arraySelectedOnly[i] + ", ";
				}
				title += " as of " + arrayDates[0];
				title += " (n = " + calculatedData[0]["total"] + ")";
				reportTitle = title;
				return title;
			});
			
		// Add x axis label
		canvas.append("text")
			.attr("class", "xAxisLabel")
			.attr("x", DEFAULT_GRAPH_WIDTH_SNAPSHOT_MODE / 2)
			.attr("y", DEFAULT_GRAPH_HEIGHT_SNAPSHOT_MODE + 40)
			.attr("text-anchor", "middle")
			.style("font-weight", "bold")
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.text("% of Patients");
			
		// Add y axis label
		canvas.append("text")
			.attr("class", "yAxisLabel")
			.attr("transform", "rotate(-90)")
			.attr("x", -DEFAULT_GRAPH_HEIGHT_SNAPSHOT_MODE / 2)
			.attr("y", -DEFAULT_PADDING_LEFT_SNAPSHOT_MODE / 2 - 125)
			.attr("text-anchor", "middle")
			.style("font-weight", "bold")
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.text("Diabetic Measure");
	
	};
	function genVisTracking() {
		console.log("Generating visualization for Tracking Mode...");

	// Create min and max dates for the time scale - 1 week before and after
		var minDate = new Date(arrayDates[0].getFullYear(),
							   arrayDates[0].getMonth(),
							   arrayDates[0].getDate() - 7);
		var maxDate = new Date(arrayDates[arrayDates.length - 1].getFullYear(),
							   arrayDates[arrayDates.length - 1].getMonth(),
							   arrayDates[arrayDates.length - 1].getDate() + 7);
		
		// Creat the scale for the X axis
		xScale = d3.time.scale()
			.domain([minDate, maxDate])
			.range([0, DEFAULT_GRAPH_WIDTH_TRACKING_MODE]);
			
		// To do: better date format
		xAxis = d3.svg.axis()
			.scale(xScale)
			.orient("bottom")
			.tickFormat(d3.time.format("%b %d"));
	
		// Create Y Axis scale
		yScale = d3.scale.linear()
			.domain([0, 100])
			.range([DEFAULT_GRAPH_HEIGHT_TRACKING_MODE, 0]);
			
		yAxis = d3.svg.axis()
			.scale(yScale)
			.orient("left");
			
		// Create and append ticklines for the xAxis
		canvas.selectAll(".xTickLine")
			.data(calculatedData)
			.enter().append("line")
				.attr("class", "tickLine xTickLine")
				.attr("x1", function (d, i) { return xScale(arrayDates[i]); })
				.attr("x2", function (d, i) { return xScale(arrayDates[i]); })
				.attr("y1", 0)
				.attr("y2", DEFAULT_GRAPH_HEIGHT_TRACKING_MODE)
				.style("opacity", 0.7)
				.style("stroke", "#cccccc")
				.style("stroke-width", "1px");
	
		// Create and append ticklines for the yAxis
		canvas.selectAll(".yTickLine")
			.data(yScale.ticks(10))
			.enter().append("line")
				.attr("class", "tickLine yTickLine")
				.attr("x1", 0)
				.attr("x2", DEFAULT_GRAPH_WIDTH_TRACKING_MODE)
				.attr("y1", yScale)
				.attr("y2", yScale)
				.style("opacity", 0.7)
				.style("stroke", "#cccccc")
				.style("stroke-width", "1px");
		
		// Append xAxis to the canvas
		canvas.append("g")
			.attr("class", "xAxis")
			.attr("transform", "translate(0, " + DEFAULT_GRAPH_HEIGHT_TRACKING_MODE + ")")
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.call(xAxis);
					
		// Append yAxis to the canvas
		canvas.append("g")
			.attr("class", "yAxis")
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.call(yAxis);
		
		// Add styling and attributes for major ticks
		var majorTicks = document.getElementsByClassName("tick major");
		for (var i = 0; i < majorTicks.length; i++) {
			
			// Get 'line' child nodes
			majorTicks[i].childNodes[0].setAttribute("style", "fill:none; stroke:black");
			majorTicks[i].childNodes[0].setAttribute("shape-rendering", "crispEdges");
		}
		
		// // Add styling and attributes for axes paths
		var paths = document.getElementsByClassName("domain");
		for (var i = 0; i < paths.length; i++) {
			
			// Get child nodes within group
			paths[i].setAttribute("style", "fill:none; stroke:black");
			paths[i].setAttribute("shape-rendering", "crispEdges");
			paths[i].setAttribute("vector-effect", "non-scaling-stroke");
		}
		
		// Append lines between data points
		canvas.selectAll(".dataPointConnector")
			.data(new Array(calculatedData.length - 1))
			.enter().append("line")
				.attr("class", "dataPointConnector")
				.attr("x1", function (d, i) { return xScale(arrayDates[i]); })
				.attr("x2", function (d, i) { return xScale(arrayDates[i + 1]); })
				.attr("y1", function (d, i) { return yScale(calculatedData[i][0] * 100); })
				.attr("y2", function (d, i) { return yScale(calculatedData[i + 1][0] * 100); })
				.attr("stroke", DEFAULT_COLOURS[0])
				.attr("stroke-width", 2);
		
		// Append data points
		canvas.selectAll(".dataPoint")
			.data(calculatedData)
			.enter().append("circle")
				.attr("class", "dataPoint")
				.attr("cx", function (d, i) { return xScale(arrayDates[i]); })
				.attr("cy", function(d, i) { return yScale(calculatedData[i][0] * 100); })
				.attr("r", 5)
				.attr("fill", DEFAULT_COLOURS[0])
				.on("mouseover", function(d) {
					d3.select(this)
						.attr("r", 7)
						.attr("fill", "lightcoral");
				})
				.on("mouseout", function(d) {
					d3.select(this)
						.attr("r", 5)
						.attr("fill", DEFAULT_COLOURS[0]);
				})
				.on("click", function(d, i) {
					// To do: generate graph underneath for the date clicked
					//document.getElementById("canvasContainer_extra").removeChild(document.getElementById("canvasSVG"));
					clearCanvas("canvasContainer_extra");
					genVisSnapshot("canvasContainer_extra");
				});
				
		// Add x axis label
		canvas.append("text")
			.attr("class", "xAxisLabel")
			.attr("x", DEFAULT_GRAPH_WIDTH_TRACKING_MODE / 2)
			.attr("y", DEFAULT_GRAPH_HEIGHT_TRACKING_MODE + 40)
			.attr("text-anchor", "middle")
			.style("font-weight", "bold")
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.text("Date");
		
		// Add y axis label
		canvas.append("text")
			.attr("class", "yAxisLabel")
			.attr("transform", "rotate(-90)")
			.attr("x", -DEFAULT_GRAPH_HEIGHT_TRACKING_MODE / 2)
			.attr("y", -DEFAULT_PADDING_LEFT_TRACKING_MODE / 2)
			.attr("text-anchor", "middle")
			.style("font-weight", "bold")
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.text("% of patients");
			
		// Add graph title
		canvas.append("text")
			.attr("class", "graphTitle")
			.attr("x", DEFAULT_GRAPH_WIDTH_TRACKING_MODE / 2)
			.attr("y", -DEFAULT_PADDING_TOP_TRACKING_MODE / 2)
			.attr("text-anchor", "middle")
			.style("font-size", "14px")
			.style("font-family", "sans-serif")
			.style("font-weight", "bold")
			.text(function() {
				var d = document.getElementById("dropdownDiabeticMeasures");
				var title = d.options[d.selectedIndex].value + " for Doctor";
				var arraySelectedOnly = [];
				
				
				//TODO -- work out selected and unique physicians
				var indices = reportData.selectedPhysicianList.allIndicesOf(true);
				for (i=0; i < indices.length; i++) {
					arraySelectedOnly.push(reportData.physicianList[indices[i]]);
				}
				
				/*
				for (var i = 0; i < arraySelectedPhysicians.length; i++) {
					if (arraySelectedPhysicians[i]) {
						arraySelectedOnly.push(arrayUniquePhysicians[i]);
					}
				}
				*/
				if (arraySelectedOnly.length > 1) title += "s ";
				else title += " ";
				for (var i = 0; i < arraySelectedOnly.length; i++) {
					if (i == arraySelectedOnly.length - 2)
						title += arraySelectedOnly[i] + " and ";
					else if (i == arraySelectedOnly.length - 1)
						title += arraySelectedOnly[i];
					else title += arraySelectedOnly[i] + ", ";	
				}
				reportTitle = title;
				return title;
			});
		
		// Add labels for data points
		canvas.selectAll(".dataLabel")
			.data(calculatedData)
			.enter().append("text")
				.attr("class", "dataLabel")
				.attr("x", function(d, i) { return xScale(arrayDates[i]); })
				.attr("y", function(d, i) { 
					// If small value, place label above point
					if ((calculatedData[i][0] * 100) < 10)
						return yScale(calculatedData[i][0] * 100) - 15;
					// Else	
					else {
						// For first data point
						if (i == 0) {
							// If adjacent point is above, place label below, vice versa
							if (calculatedData[1][0] >= calculatedData[i][0])
								return yScale(calculatedData[i][0] * 100) + 25;
							else return yScale(calculatedData[i][0] * 100) - 15;
						}
						// For last point, compare with second last point
						else if (i == calculatedData.length - 1) {
							if (calculatedData[calculatedData.length - 2][0] >= calculatedData[i][0])
								return yScale(calculatedData[i][0] * 100) + 25;
							else return yScale(calculatedData[i][0] * 100) - 15;
						}
						// Else all points in between, check both sides
						else {
							// If both adjacent points are above, place below
							if (calculatedData[i - 1][0] >= calculatedData[i][0] && calculatedData[i + 1][0] >= calculatedData[i][0])
								return yScale(calculatedData[i][0] * 100) + 25;
							// Else if both are below, place above	
							else if (calculatedData[i - 1][0] < calculatedData[i][0] && calculatedData[i + 1][0] < calculatedData[i][0])
								return yScale(calculatedData[i][0] * 100) - 15;
							// Else just place above
							else return yScale(calculatedData[i][0] * 100) - 15;
						}
					}
				}) 
				.attr("text-anchor", "middle")
				.style("fill", "black")
				.style("font-size", "13px")
				.style("font-family", "Arial")
				.text(function(d, i) { 
					if ((calculatedData[i][0] * 100) == 0)
						return (calculatedData[i][0] * 100).toFixed(0) + "%";
					else 
					return (calculatedData[i][0] * 100).toFixed(1) + "%";
				});
	};
	function toggleDataLabels() {
			// Find data labels
		if (d3.selectAll(".dataLabel")[0].length > 0) 
			d3.selectAll(".dataLabel").remove();
		else {
			
			var arrayData = [];
			var arrayDesc = [];
			for (var i=0; i < calculatedData.length; i++) {
				arrayData.push(calculatedData[i]["passed"] / calculatedData[i]["total"] * 100);
				arrayDesc.push(calculatedData[i]["desc"]);
			}
			
			
			if (mode == "snapshot") {
			
				canvas.selectAll("onTargetLabel")
					.data(arrayData)
					.enter().append("text")
						.attr("class", "dataLabel")
						.attr("x", function(d, i) { return xScale(d / 2); })
						.attr("y", function(d, i) { return yScale(arrayDesc[i]) + (yScale.rangeBand()/2); })
						.attr("text-anchor", "middle")
						.style("font-family", "Arial")
						.style("font-size", "13px")
						.attr("dy", ".35em")
						.style("fill", "white")
						.text(function(d) { if (d > 0) return d.toFixed(1) + "%"; else return ""; });
				
				canvas.selectAll("offTargetLabel")
					.data(arrayData)
					.enter().append("text")
						.attr("class", "dataLabel")
						.attr("x", function(d) { return xScale((100 - d)/2 + parseFloat(d)); })
						.attr("y", function(d, i) { return yScale(arrayDesc[i]) + (yScale.rangeBand()/2); })
						.attr("text-anchor", "middle")
						.attr("dy", ".35em")
						.style("fill", "black")
						.style("font-family", "Arial")
						.style("font-size", "13px")
						.text(function(d) { if (100 - d < 100) return (100 - d).toFixed(1) + "%"; })
						// don't display off target labels
						.attr("display", "none");
			} else {
				canvas.selectAll(".dataLabel")
					.data(calculatedData)
					.enter().append("text")
						.attr("class", "dataLabel")
						.attr("x", function(d, i) { return xScale(arrayDates[i]); })
						.attr("y", function(d, i) { return yScale(calculatedData[i][0] * 100) - 15; }) // 15 pixels above data point
						.attr("text-anchor", "middle")
						.style("fill", "black")
						.style("font-size", "13px")
						.style("font-family", "Arial")
						.text(function(d, i) { 
							if ((calculatedData[i][0] * 100) == 0)
								return (calculatedData[i][0] * 100).toFixed(0) + "%";
							else 
							return (calculatedData[i][0] * 100).toFixed(1) + "%";
						});
			
			}
		}
	};
	
	
	function toggleSelected() {

		if (calculatedData == undefined) { 
			console.log("Calculated data undefined");
			return;
		}

		// Retrieve an array of all physician item labels
		var physicianListItems = document.getElementsByClassName("physicianListItem");
		
		// If clicked on "Select All"
		if (this.innerHTML.indexOf("Select All") != -1) {
			
			// If class has 'selected', unselect all doctors
			if (this.className.indexOf("selected") != -1) {
				
				for (doc in selectedPhysicians) {
					if (selectedPhysicians.hasOwnProperty(doc)) {
						selectedPhysicians[doc] = false;
					}
				}
			}
			
			// Else class has 'notSelected', select it and select all doctors
			else {
			
			
				for (doc in selectedPhysicians) {
					if (selectedPhysicians.hasOwnProperty(doc)) {
						selectedPhysicians[doc] = true;
					}
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
				
					// Search innerHTML for Doctor Number, match against arrayUniquePhysicians for the array index, use index to update selected Boolean
					var docNum = this.innerHTML.substring(this.innerHTML.indexOf("Doctor") + 14, this.innerHTML.length - 7);
					//TPS come back to this, it can be cleaned up
					selectedPhysicians[docNum] = false;

				}
				
				// "Select All" is not selected, so just unselect the clicked doctor 
				else {
				
					// Update class name, get index in innerHTML and update array based on the index
					// 14 is based on the number of characters "Doctor Number "
					// 7 is based on the number of characters "</span>"
					// This will need to be updated if we show actual physician names
					//this.className = this.className.substring(0, this.className.indexOf("selected")) + "notSelected";
					var docNum = this.innerHTML.substring(this.innerHTML.indexOf("Doctor") + 14, this.innerHTML.length - 7);
					selectedPhysicians[docNum] = false;
					//var index = reportData.physicianList.getArrayIndex(docNum);
					//reportData.selectedPhysicianList[index] = false;
				}
			}
			
			// Clicked doctor is not selected
			else {
				
				var docNum = this.innerHTML.substring(this.innerHTML.indexOf("Doctor") + 14, this.innerHTML.length - 7);
				selectedPhysicians[docNum] = true;

				// Loop through array to see if ALL doctors are now selected, if so, select "Select All"
			}	
		}
		
		// After toggling, filter the data for calculations and graph the data
		//TODO is this best practice?
		//reportData.filter();
		reportData.reCalculate(selectedPhysicians);
	};
	
	return {
		generateCharts: generateCharts,
		clearCanvas: clearCanvas
	};
	
})();


Array.prototype.allIndicesOf = function(ele) {
	var indices = [];
	var idx = this.indexOf(ele);
	while (idx != -1) {
    	indices.push(idx);
    	idx = this.indexOf(ele, idx + 1);
	}
	return indices;
};