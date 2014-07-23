/*
	Chronic Disease Report Generator - Web based reports on quality of care standards
    Copyright (C) 2014  Brice Wong, Tom Sitter - Hamilton Family Health Team

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
*/

var reportViewer = (function() {

	var g_canvas = d3.select("#canvasContainer").select("#canvasSVG");
	
	var g_mode = "";
	
	var g_calculatedData = null;
	var g_selectedPhysicians = null;
	var g_arrayDates = null;
	var g_currentRuleList = 0;
	var g_currentRuleName = "";
	
	var g_reportTitle = "";
	var xScale, yScale, xAxis, yAxis;
	
	var DEFAULT_CANVAS_WIDTH = 960;  		// pixels
	var DEFAULT_CANVAS_HEIGHT = 480;    	// pixels
	
	var DEFAULT_PADDING_LEFT_SNAPSHOT_MODE = 300;
	var DEFAULT_PADDING_TOP_SNAPSHOT_MODE = 50;
	
	var DEFAULT_GRAPH_WIDTH_SNAPSHOT_MODE = DEFAULT_CANVAS_WIDTH - DEFAULT_PADDING_LEFT_SNAPSHOT_MODE - 25;
	var DEFAULT_GRAPH_HEIGHT_SNAPSHOT_MODE = DEFAULT_CANVAS_HEIGHT - 2 * DEFAULT_PADDING_TOP_SNAPSHOT_MODE;
	
	var DEFAULT_PADDING_LEFT_TRACKING_MODE = 75;
	var DEFAULT_PADDING_TOP_TRACKING_MODE = 50;
	
	var DEFAULT_GRAPH_WIDTH_TRACKING_MODE = DEFAULT_CANVAS_WIDTH - 2 * DEFAULT_PADDING_LEFT_TRACKING_MODE;
	var DEFAULT_GRAPH_HEIGHT_TRACKING_MODE = DEFAULT_CANVAS_HEIGHT - 2 * DEFAULT_PADDING_TOP_TRACKING_MODE;
	
	var DEFAULT_COLOURS = ["firebrick", "steelblue", "yellowgreen", "mediumpurple", "cadetblue",
							"sandybrown", "slategray", "goldenrod", "darkslateblue", "palevioletred",
							"forestgreen", "sienna", "bisque"];
							
	var HIGHLIGHT_COLOURS = ["lightcoral", "#90B4D2", "#90B4D2"];
	var chosen_colour = 0;

	function ClearCanvas() {
		
		document.getElementById("canvasContainer").removeChild(document.getElementById("canvasSVG"));
				
		g_canvas = d3.select("#canvasContainer").append("svg")
					.attr("id", "canvasSVG")
					// Set the width and height of the canvas
					.attr("width", DEFAULT_CANVAS_WIDTH)
					.attr("height", DEFAULT_CANVAS_HEIGHT)
					.style("border", "1px solid lightgray")
						.append("g")
							.attr("class", "g_main")
							.attr("transform", function() {
								switch (g_mode) {

								case "snapshot":
									return "translate(" + DEFAULT_PADDING_LEFT_SNAPSHOT_MODE + ", " + DEFAULT_PADDING_TOP_SNAPSHOT_MODE + ")";
								break;

								case "tracking":
									return "translate(" + DEFAULT_PADDING_LEFT_TRACKING_MODE + ", " + DEFAULT_PADDING_TOP_TRACKING_MODE + ")";
								break;
								}	
							});
	};
	
	function AddUserInterface() {
		//reportData.physicianList contains 2 columns and n rows
		//[Doctor number, boolean selected]
		
		// If uploading new files, remove old side panels and recreate the panels with new filters based on the new imported data
		// physicianSection, measuresSection, settingsSection
		if (document.getElementById("physicianSection")) {
			document.getElementById("sidePanel").removeChild(document.getElementById("physicianSection"));
		}
		
		if (document.getElementById("measuresSection")) {
			document.getElementById("sidePanel").removeChild(document.getElementById("measuresSection"));
		}
		
		if (document.getElementById("settingsSection")) {
			document.getElementById("sidePanel").removeChild(document.getElementById("settingsSection"));
		}
		
		if (document.getElementById("dropdownRules")) {
			document.getElementById("dropdownRules").remove();
		}

	
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
		for (var i = 0; i < Object.keys(g_selectedPhysicians).length+1; i++) {
			
			// Append a list item to the unordered list 'physicianLegendList'. Set its classes to be 'legendListItem', 'physicianListItem', 'selected'
			// Selected by default
			d3.select("#physicianLegendList").append("li")
				.attr("class", "legendListItem physicianListItem")
				.on("click", ToggleSelectedPhysicians);
		}
		
		// Retrieve an array of all physician list items
		var physicianListItems = document.getElementsByClassName("physicianListItem");
	
		// Looping through the array of physician list items
		for (var i = 0; i < physicianListItems.length; i++) {
		
			// First item, i.e. "Select All Doctors"
			if (i == 0) {
				physicianListItems[i].innerHTML += "<span class='physicianItemLabel'><span class='checkmark'>\u2714</span> Select All</span>";
				
				var all_selected = true;
				for (doc in g_selectedPhysicians) {
					if (g_selectedPhysicians.hasOwnProperty(doc) &
						g_selectedPhysicians[doc] == false){
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
				var doc = Object.keys(g_selectedPhysicians)[i-1];
				physicianListItems[i].innerHTML += "<span class='physicianItemLabel'><span class='checkmark'>\u2714</span> Doctor Number " + doc + "</span>";
				if (g_selectedPhysicians[doc] == true) {
					physicianListItems[i].classList.add("selected");
				} else {
					physicianListItems[i].classList.add("notSelected");
				}
				
				
			}
		}
		
		// If tracking mode
		// Add a section in the sidebar for the diabetic measures
		if (g_mode == "tracking") {
		
			d3.select("#sidePanel").append("div")
				.attr("class", "sidePanelSection")
				.attr("id", "measuresSection");
				
			// Add a drop down menu for the diabetic measures	
			d3.select("#measuresSection").append("select")
				.attr("id", "dropdownIndicators")
				.on("change", function() { 
					g_mode = "tracking";
					ClearCanvas();
					GenerateTracking(this.selectedIndex); 
				});
					
			// Add the options for the different diabetic measures in the drop down menu
			// Created dynamically based on default values
			// To do: variables to store user input values
			for (var i = 0; i < g_calculatedData[0].length; i++) {
				d3.select("#dropdownIndicators").append("option")
					.text(g_calculatedData[0][i]["desc"])
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
				
				var ctx = document.getElementById("outputCanvas").getContext('2d');
				ctx.save();
				ctx.globalCompositeOperation = "destination-over";
				ctx.fillStyle = 'white';
				ctx.fillRect(0, 0, output.width, output.height);
				
				
				// Retrieve data string of the canvas and append to the hidden img element
				var outputURL = output.toDataURL();
				document.getElementById("outputImg").src = outputURL;
				
				// Modify attributes of hidden elements and simulate file download
				document.getElementById("outputA").download = g_reportTitle;
				document.getElementById("outputA").href = outputURL;
				document.getElementById("outputA").click();
				
				output.toBlob(function(blob) {
 					saveAs(blob, g_reportTitle);
 				});
				ctx.restore();
			});
		
		// Save to PDF
		d3.select("#settingsSection").append("input")
			.attr("type", "button")
			.attr("value", "Save as PDF")
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
				
				// Create a white background
				var ctx = document.getElementById("outputCanvas").getContext('2d');
				ctx.save();
				ctx.globalCompositeOperation = "destination-over";
				ctx.fillStyle = 'white';
				ctx.fillRect(0, 0, output.width, output.height);
				
				// Retrieve data URL of the graph
				var outputURL = output.toDataURL('image/jpeg');
				
				// Create portrait PDF object
				var doc = new jsPDF();

				// Title
				doc.setFontSize(20);
				var splitTitle = doc.splitTextToSize(g_reportTitle, 180);
				doc.text(15, 20, splitTitle);
				doc.addImage(outputURL, 'JPEG', 15, 60, 180, 100);
				
				// save() to download automatically, output() to open in a new tab
				//doc.save(g_reportTitle);
				doc.output('save', g_reportTitle);
				ctx.restore();
					
			});
		
		// Toggle data labels
		d3.select("#settingsSection").append("input")
			.attr("type", "button")
			.attr("value", "Toggle data labels")
			.on("click", ToggleDataLabels);
			
		
		d3.select("#settingsSection").append("select")
			.attr("id", "dropdownRules")
			.on("change", function() {
				g_currentRuleList = chosen_colour = this.selectedIndex;
				g_currentRuleName = reportRules.ruleList[this.selectedIndex].name;
				reportData.ReCalculate(g_currentRuleList, g_selectedPhysicians);
			});
			
		for (var i=0; i<reportRules.ruleList.length;i++) {
			d3.select("#dropdownRules").append("option")
					.text(reportRules.ruleList[i].name)
					.attr("id", "optionDiabeticAssessment");
		}

		document.getElementById("dropdownRules").selectedIndex = g_currentRuleList;
		
	};
	
	function GenerateCharts(rd_currentRuleList, rd_calculatedData, rd_selectedPhysicians, rd_arrayDates) {
		
		g_mode = rd_arrayDates.length > 1 ? "tracking" : "snapshot";
		g_calculatedData = rd_calculatedData;
		g_selectedPhysicians = rd_selectedPhysicians;
		g_arrayDates = rd_arrayDates;
		g_currentRuleList = chosen_colour = rd_currentRuleList;
		g_currentRuleName = reportRules.ruleList[rd_currentRuleList].name;
				
		ClearCanvas();
		AddUserInterface();
		
		if (g_calculatedData == undefined) {
			console.log("no calculated data!");
			return;
		}
		
		if (g_mode == "snapshot") {
			//calculatedData = calculatedData[0];
			GenerateSnapshot(0);
		} else {
			//By default, select first item in dropdown
			GenerateTracking(0);
		}
	};
	
	function GenerateSnapshot(selectedDate){
		var snapshotData = g_calculatedData[selectedDate];

		// Add rectangles for percentage of patients within criteria
		var arrayData = [];
		var arrayDesc = [];
		if (typeof(snapshotData) === undefined || snapshotData.length == 0) {
			return;
		}
		for (var i=0; i < snapshotData.length; i++) {
			if (snapshotData[i]["total"] == 0) {
				continue;
			}
			arrayData.push(snapshotData[i]["passed"] / snapshotData[i]["total"] * 100);
			arrayDesc.push(snapshotData[i]["desc"]);
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
			
		g_canvas.selectAll(".tickline")
			.data(xScale.ticks(10))
			.enter().append("line")
				.attr("x1", xScale)
				.attr("x2", xScale)
				.attr("y1", 0)
				.attr("y2", DEFAULT_GRAPH_HEIGHT_SNAPSHOT_MODE)
				.style("stroke", "#ccc")
				.style("stroke-width", 1)
				.style("opacity", 0.7);
			
		// Add x axis label
		g_canvas.append("text")
			.attr("class", "xAxisLabel")
			.attr("x", DEFAULT_GRAPH_WIDTH_SNAPSHOT_MODE / 2)
			.attr("y", DEFAULT_GRAPH_HEIGHT_SNAPSHOT_MODE + 40)
			.attr("text-anchor", "middle")
			.style("font-weight", "bold")
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.text("% of Patients");
			
		// Add y axis label
		g_canvas.append("text")
			.attr("class", "yAxisLabel")
			.attr("transform", "rotate(-90)")
			.attr("x", -DEFAULT_GRAPH_HEIGHT_SNAPSHOT_MODE / 2)
			.attr("y", -DEFAULT_PADDING_LEFT_SNAPSHOT_MODE / 2 - 125)
			.attr("text-anchor", "middle")
			.style("font-weight", "bold")
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.text( (function() {
				return reportRules.ruleList[g_currentRuleList].name + " Measure"; 
			}));
		
		// Graph title text
		g_canvas.append("text")
			.attr("class", "graphTitle")
			.attr("x", DEFAULT_GRAPH_WIDTH_SNAPSHOT_MODE / 2)
			.attr("y", -DEFAULT_PADDING_TOP_SNAPSHOT_MODE / 2 + 10)
			.attr("text-anchor", "middle")
			.style("font-size", "14px")
			.style("font-weight", "bold")
			.text(function() {
				var arraySelectedOnly = [];

				for (var doc in g_selectedPhysicians) {
					if (g_selectedPhysicians[doc] == true)
						arraySelectedOnly.push(doc);
				}
				
				if (arraySelectedOnly.length == 0) {
					return "No Doctors Selected";
				}
				
				var title = g_currentRuleName + " Report for Doctor";
				
				if (arraySelectedOnly.length > 1) title += "s ";
				else title += " ";
				for (var i = 0; i < arraySelectedOnly.length; i++) {
					if (i == arraySelectedOnly.length - 2)
						title += arraySelectedOnly[i] + " and ";
					else if (i == arraySelectedOnly.length - 1)	
						title += arraySelectedOnly[i];
					else title += arraySelectedOnly[i] + ", ";
				}
				title += " as of " + g_arrayDates[selectedDate].toString().substring(4, 15);
				title += " (n = " + snapshotData[0]["total"] + ")";
				g_reportTitle = title;
				return title;
			});
		
		//Translate graph into center of page
		g_canvas.append("g")
			.attr("transform", "translate(0, " + DEFAULT_GRAPH_HEIGHT_SNAPSHOT_MODE + ")")
			.style("font-family", "Arial")
			.style("font-size", "14px")
			.call(xAxis);
			
		g_canvas.append("g")
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
		
		
		if (arrayData.length == 0) {
			return;
		}
		
		//Labels for each bar
		g_canvas.selectAll("onTargetBar")
			.data(arrayData)
			.enter().append("rect")
				.attr("class", "onTargetBar")
				.attr("width", function(d) { return xScale(d); })
				.attr("height", yScale.rangeBand())
				.attr("y", function (d, i) { return yScale(arrayDesc[i]); })
				.attr("fill", DEFAULT_COLOURS[chosen_colour])
				.on("click", function() {
					d3.selectAll(".onTargetBar")
						.style("fill", DEFAULT_COLOURS[chosen_colour]);
					d3.select(this)
						.style("fill", HIGHLIGHT_COLOURS[chosen_colour]);
				})
				//.on("mouseout", function() {
				//	d3.select(this)
				//		.style("fill", DEFAULT_COLOURS[chosen_colour]);
				//})
				.style("stroke", "black")
				.style("stroke-width", "1px")
				.attr("shape-rendering", "crispEdges");

		// Add bars for patients not within criteria
		g_canvas.selectAll("offTargetBar")
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
		
		
		g_canvas.selectAll("onTargetLabel")
			.data(arrayData)
			.enter().append("text")
				.attr("class", "dataLabel")
				.attr("x", function(d, i) { 
											if (d<5) { return xScale(d+5); } 
											else { return xScale(d/2);	} 
										  })
				.attr("y", function(d, i) { return yScale(arrayDesc[i]) + (yScale.rangeBand()/2); })
				.attr("text-anchor", "middle")
				.style("font-family", "Arial")
				.style("font-size", "13px")
				.attr("dy", ".35em")
				.style("fill", function(d, i) { 
												if (d<5) { return "black"; } 
												else { return "white";	} 
											  })
				.text(function(d) { if (d > 0) return d.toFixed(1) + "%"; else return "0%"; });
		
		g_canvas.selectAll("offTargetLabel")
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
	};
	
	function GenerateTracking(selectedRule) {

		var arrayDates = g_arrayDates;

		var arrayData = [];
		var arrayDesc = [];
		for (var i=0; i < g_calculatedData.length; i++) {
			arrayData.push([]);
			arrayDesc.push([]);
			for (var j=0; j < g_calculatedData[i].length; j++) {
				if (g_calculatedData[i][j]["total"] == 0) {
					continue;
				}
				arrayData[i].push(g_calculatedData[i][j]["passed"] / g_calculatedData[i][j]["total"] * 100);
				arrayDesc[i].push(g_calculatedData[i][j]["desc"]);
			}
		}

		if (arrayData.length == 0) {
			return;
		}
		
		// Create min and max dates for the time scale - 1 week before and after
		var minDate = new Date(arrayDates[0]);
		minDate.setDate(minDate.getDate()-30);				   
							   
		var maxDate = new Date(arrayDates[arrayDates.length - 1]);
		maxDate.setDate(maxDate.getDate()+30);
		
		
		// Creat the scale for the X axis
		xScale = d3.time.scale()
			.domain([minDate, maxDate])
			.range([0, DEFAULT_GRAPH_WIDTH_TRACKING_MODE]);
			
		// To do: better date format
		xAxis = d3.svg.axis()
			.scale(xScale)
			.orient("bottom")
			.tickFormat(d3.time.format("%b %Y"));
	
		// Create Y Axis scale
		yScale = d3.scale.linear()
			.domain([0, 100])
			.range([DEFAULT_GRAPH_HEIGHT_TRACKING_MODE, 0]);
			
		yAxis = d3.svg.axis()
			.scale(yScale)
			.orient("left");
			
		// Create and append ticklines for the xAxis
		g_canvas.selectAll(".xTickLine")
			.data(arrayData)
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
		g_canvas.selectAll(".yTickLine")
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
		
		// Append xAxis to the g_canvas
		g_canvas.append("g")
			.attr("class", "xAxis")
			.attr("transform", "translate(0, " + DEFAULT_GRAPH_HEIGHT_TRACKING_MODE + ")")
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.call(xAxis);
					
		// Append yAxis to the g_canvas
		g_canvas.append("g")
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
		g_canvas.selectAll(".dataPointConnector")
			.data(new Array(arrayData.length - 1))
			.enter().append("line")
				.attr("class", "dataPointConnector")
				.attr("x1", function (d, i) { return xScale(arrayDates[i]); })
				.attr("x2", function (d, i) { return xScale(arrayDates[i + 1]); })
				.attr("y1", function (d, i) { return yScale(arrayData[i][selectedRule]); })
				.attr("y2", function (d, i) { return yScale(arrayData[i + 1][selectedRule]); })
				.attr("stroke", DEFAULT_COLOURS[chosen_colour])
				.attr("stroke-width", 2);
		
		// Append data points
		g_canvas.selectAll(".dataPoint")
			.data(arrayData)
			.enter().append("circle")
				.attr("class", "dataPoint")
				.attr("cx", function (d, i) { return xScale(arrayDates[i]); })
				.attr("cy", function(d, i) { return yScale(arrayData[i][selectedRule]); })
				.attr("r", 5)
				.attr("fill", DEFAULT_COLOURS[chosen_colour])
				.on("mouseover", function(d) {
					d3.select(this)
						.attr("r", 7)
						.style("fill", HIGHLIGHT_COLOURS[chosen_colour]);
				})
				.on("mouseout", function(d) {
					d3.select(this)
						.attr("r", 5)
						.style("fill", DEFAULT_COLOURS[chosen_colour]);
				})
				.on("click", function(d, i) {
					// To do: generate graph underneath for the date clicked
					//document.getElementById("canvasContainer_extra").removeChild(document.getElementById("canvasSVG"));
					d3.select(this)
						.attr("r", 7)
						.style("fill", HIGHLIGHT_COLOURS[chosen_colour]);
					g_mode = "snapshot";
					ClearCanvas();
					GenerateSnapshot(i);
				});
				
		// Add x axis label
		g_canvas.append("text")
			.attr("class", "xAxisLabel")
			.attr("x", DEFAULT_GRAPH_WIDTH_TRACKING_MODE / 2)
			.attr("y", DEFAULT_GRAPH_HEIGHT_TRACKING_MODE + 40)
			.attr("text-anchor", "middle")
			.style("font-weight", "bold")
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.text("Date");
		
		// Add y axis label
		g_canvas.append("text")
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
		g_canvas.append("text")
			.attr("class", "graphTitle")
			.attr("x", DEFAULT_GRAPH_WIDTH_TRACKING_MODE / 2)
			.attr("y", -DEFAULT_PADDING_TOP_TRACKING_MODE / 2)
			.attr("text-anchor", "middle")
			.style("font-size", "14px")
			.style("font-family", "sans-serif")
			.style("font-weight", "bold")
			.text(function() {
				var d = document.getElementById("dropdownIndicators");
				var title = d.options[d.selectedIndex].value + " for Doctor";
				var arraySelectedOnly = [];

				for (var doc in g_selectedPhysicians) {
					if (g_selectedPhysicians[doc] == true)
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
				g_reportTitle = title;
				return title;
			});
		
		// Add labels for data points
		g_canvas.selectAll(".dataLabel")
			.data(arrayData)
			.enter().append("text")
				.attr("class", "dataLabel")
				.attr("x", function(d, i) { return xScale(arrayDates[i]); })
				.attr("y", function(d, i) { 
					// If small value, place label above point
					if ((arrayData[i][0]) < 10)
						return yScale(arrayData[i][0]) - 15;
					// Else	
					else {
						// For first data point
						if (i == 0) {
							// If adjacent point is above, place label below, vice versa
							if (arrayData[1][0] >= arrayData[i][selectedRule])
								return yScale(arrayData[i][selectedRule]) + 25;
							else return yScale(arrayData[i][selectedRule]) - 15;
						}
						// For last point, compare with second last point
						else if (i == arrayData.length - 1) {
							if (arrayData[arrayData.length - 2][0] >= arrayData[i][selectedRule])
								return yScale(arrayData[i][selectedRule]) + 25;
							else return yScale(arrayData[i][selectedRule]) - 15;
						}
						// Else all points in between, check both sides
						else {
							// If both adjacent points are above, place below
							if (arrayData[i - 1][0] >= arrayData[i][selectedRule] && arrayData[i + 1][0] >= arrayData[i][selectedRule])
								return yScale(arrayData[i][selectedRule]) + 25;
							// Else if both are below, place above	
							else if (arrayData[i - 1][0] < arrayData[i][selectedRule] && arrayData[i + 1][0] < arrayData[i][selectedRule])
								return yScale(arrayData[i][selectedRule]) - 15;
							// Else just place above
							else return yScale(arrayData[i][selectedRule]) - 15;
						}
					}
				}) 
				.attr("text-anchor", "middle")
				.style("fill", "black")
				.style("font-size", "13px")
				.style("font-family", "Arial")
				.text(function(d, i) { 
					if (arrayData[i].length == 0) {
						return "0%";
					} else {
						if (arrayData[i][selectedRule] == 0)
							return (arrayData[i][selectedRule]).toFixed(0) + "%";
						else 
							return (arrayData[i][selectedRule]).toFixed(1) + "%";
					}
					
				});
	};
	
	function ToggleDataLabels(selectedDate) {
			// Find data labels
		if (d3.selectAll(".dataLabel")[0].length > 0) 
			d3.selectAll(".dataLabel").remove();
		else {
			
			var arrayData = [];
			var arrayDesc = [];

			if (g_mode == "snapshot") {
				var snapshotData = g_calculatedData[0];
			
				for (var i=0; i < snapshotData.length; i++) {
					if (snapshotData[i]["total"] == 0) {
						continue;
					}
					arrayData.push(snapshotData[i]["passed"] / snapshotData[i]["total"] * 100);
					arrayDesc.push(snapshotData[i]["desc"]);
				}
				if (arrayData.length == 0) {
					return;
				}
			
				g_canvas.selectAll("onTargetLabel")
					.data(arrayData)
					.enter().append("text")
						.attr("class", "dataLabel")
						.attr("x", function(d, i) { 
											if (d<5) { return xScale(d+5); } 
											else { return xScale(d/2);	} 
										  })
						.attr("y", function(d, i) { return yScale(arrayDesc[i]) + (yScale.rangeBand()/2); })
						.attr("text-anchor", "middle")
						.style("font-family", "Arial")
						.style("font-size", "13px")
						.attr("dy", ".35em")
						.style("fill", function(d, i) { 
												if (d<5) { return "black"; } 
												else { return "white";	} 
											  })
						.text(function(d) { if (d > 0) return d.toFixed(1) + "%"; else return "0%"; });
				
				g_canvas.selectAll("offTargetLabel")
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
						.text(function(d) { if (100 - d < 100) return (100 - d).toFixed(1) + "0%"; })
						// don't display off target labels
						.attr("display", "none");
			} else {

				for (var i=0; i < g_calculatedData.length; i++) {
					arrayData.push([]);
					arrayDesc.push([]);
					for (var j=0; j < g_calculatedData[i].length; j++) {
						if (g_calculatedData[i][j]["total"] == 0) {
							continue;
						}
						arrayData[i].push(g_calculatedData[i][j]["passed"] / g_calculatedData[i][j]["total"] * 100);
						arrayDesc[i].push(g_calculatedData[i][j]["desc"]);
					}
				}
				if (arrayData.length == 0) {
					return;
				}
				
				var selectedRule = document.getElementById("dropdownIndicators").selectedIndex;
				
				g_canvas.selectAll(".dataLabel")
					.data(arrayData)
					.enter().append("text")
						.attr("class", "dataLabel")
						.attr("x", function(d, i) { return xScale(g_arrayDates[i]); })
						.attr("y", function(d, i) { return yScale(arrayData[i][selectedRule]) - 15; }) // 15 pixels above data point
						.attr("text-anchor", "middle")
						.style("fill", "black")
						.style("font-size", "13px")
						.style("font-family", "Arial")
						.text(function(d, i) { 
							if ((arrayData[i][selectedRule]) == 0)
								return (arrayData[i][selectedRule]).toFixed(0) + "%";
							else 
							return (arrayData[i][selectedRule]).toFixed(1) + "%";
						});
			
			}
		}
	};
		
	function ToggleSelectedPhysicians() {

		if (g_calculatedData == undefined) { 
			console.log("Calculated data undefined");
			return;
		}

		var isSelected = (this.className.indexOf("selected") != -1);

		// If clicked on "Select All"
		if (this.innerHTML.indexOf("Select All") != -1) {
			// If class has 'selected', it currently is selected and must be unselected
				
			for (doc in g_selectedPhysicians) {
				if (g_selectedPhysicians.hasOwnProperty(doc)) {
					//negate the isSelected status to select/deselect the option
					g_selectedPhysicians[doc] = !isSelected;
				}
			}
		}	
		// Otherwise, clicked on an individual doctor
		else {
			var doc = this.innerHTML.substring(this.innerHTML.indexOf("Doctor") + 14, this.innerHTML.length - 7);
			g_selectedPhysicians[doc] = !isSelected;
		}
		
		reportData.ReCalculate(g_currentRuleList, g_selectedPhysicians);
	};
	
	return {
		GenerateCharts: GenerateCharts,
		ClearCanvas: ClearCanvas
	};
	
})();
