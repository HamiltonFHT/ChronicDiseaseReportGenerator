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

/* 
 * Generates and displays chart and user controls
 * Handles user interaction
 */
var reportViewer = (function() {

	//Variables to store data and state
	var g_canvas = d3.select("#canvasContainer").select("#canvasSVG");
	
	var g_mode = "";
	
	var g_calculatedData = null;
	var g_selectedPhysicians = null;
	var g_arrayDates = null;
	var g_currentRuleListIndex = 0;
	var g_currentRuleListName = "";
	var g_currentRule = null;
	
	var g_reportTitle = "";
	var xScale, yScale, xAxis, yAxis;
	
	
	//Static variables to handle graph dimensions and colors
	var DEFAULT_CANVAS_WIDTH = 940;  		// pixels
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
							"sandybrown", "forestgreen", "firebrick", "goldenrod", "darkslateblue", "palevioletred",
							"sienna", "bisque"];
							
	var HIGHLIGHT_COLOURS = ["lightcoral", "#90B4D2", "#CCE698", "#DFD4F4", "#AFCED0", "#FAD2B0", "#90C590", "lightcoral"];
	var chosen_colour = 0;

	/*
	 * Remove graph and user interface elements
	 * Called when chart needs to be refreshed or cleared
	 */
	function clearCanvas() {
		
		$("#canvasContainer").empty();
				
		g_canvas = d3.select("#canvasContainer").append("svg")
					.attr("id", "canvasSVG")
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
	
	/*
	 * Removes user interface elements other than the chart
	 */
	function clearUserInterface() {
		$("#physicianSection").remove();
		$("#measuresSection").remove();
		$("#settingsSection").remove();
		$("#dropdownRules").remove();
	}
	
	/*
	 * Adds and initializes user interface elements, namely
	 * Physician Selection
	 * Indicator Set dropdown
	 * Individual indicator dropdown (in tracking mode)
	 * Download buttons
	 */
	function addUserInterface() {
		// If uploading new files, remove old side panels and recreate the panels with new filters based on the new imported data
		// physicianSection, measuresSection, settingsSection
		clearUserInterface();
	
		// Adding a panel section for selecting physicians
		$("#actionBar").append('<div class="actionBarSection" id="physicianSection">' +
								'<div id="physicianLegend"></div>' +
								'<ul id="physicianLegendList"></ul>' +
								'</div>');
		
		// Loop through 'arrayUniquePhysicians' and create a list item for each element. These will be the physician filters that will appear in the side
		// panel. There will also be a filter for "All Selected Physicians"
		for (var i = 0; i < Object.keys(g_selectedPhysicians).length+1; i++) {
			// Append a list item to the unordered list 'physicianLegendList'. Set its classes to be 'legendListItem', 'physicianListItem', 'selected'
			// Selected by default
			$("#physicianLegendList").append('<li class="legendListItem physicianListItem"></li>');
		}
		
		$(".physicianListItem").click( function(){ 
			if (g_calculatedData == undefined) { 
				console.log("Calculated data undefined");
				return false;
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
			
			reportData.reCalculate(g_currentRuleListIndex, g_selectedPhysicians);
			return false; 
	  });

		// Retrieve an array of all physician list items
		var physicianListItems = $(".physicianListItem");
	
		// Looping through the array of physician list items
		for (var i = 0; i < physicianListItems.length; i++) {
		
			// First item, i.e. "Select All Doctors"
			if (i == 0) {
				physicianListItems.eq(i).html("<span class='physicianItemLabel'><span class='checkmark'>\u2714</span> Select All</span>");
				
				var all_selected = true;
				for (doc in g_selectedPhysicians) {
					if (g_selectedPhysicians.hasOwnProperty(doc) &
						g_selectedPhysicians[doc] == false){
						all_selected = false;
					} 
				}
				if (all_selected) {
					physicianListItems.eq(i).addClass("selected");				
				} else {
					physicianListItems.eq(i).addClass("notSelected");
				}
			}
			
			// Every other doctor. All doctors are selected by default
			else {
				//arraySelectedPhysicians[i - 1] = true;
				var doc = Object.keys(g_selectedPhysicians)[i-1];
				physicianListItems.eq(i).html("<span class='physicianItemLabel'><span class='checkmark'>\u2714</span> Doctor Number " + doc + "</span>");
				if (g_selectedPhysicians[doc] == true) {
					physicianListItems.eq(i).addClass("selected");
				} else {
					physicianListItems.eq(i).addClass("notSelected");
				}
			}
		}
		
		// If tracking mode
		// Add a section in the sidebar for the diabetic measures
		if (g_mode == "tracking") {
		
			$("#actionBar").append('<div class="actionBarSection" id="measuresSection"> </div>');
				
			// Add a drop down menu for the diabetic measures	
			$("#measuresSection").append('<select id="dropdownIndicators"></select>');
			$("#dropdownIndicators").change(function() {
				g_mode = "tracking";
				clearCanvas();
				generateTracking(this.selectedIndex);
			});
					
			// Add the options for the different diabetic measures in the drop down menu
			// Created dynamically based on default values
			// To do: variables to store user input values
			for (var i = 0; i < g_calculatedData[0].length; i++) {
				$("#dropdownIndicators").append('<option id="optionDiabeticAssessment">' + g_calculatedData[0][i]["desc"] + '</option>');
			}
		}
		
		// Add a section in the side bar for the buttons for settings, save-to-PDF, etc.
		$("#actionBar").append('<div id="settingsSection" class="actionBarSection"></div>');
		
		// Save to PNG
		var btnSaveImage = '<button class="pure-button actionButton" id="btnSaveImage"><i class="fa fa-file-image-o"></i> Save as image</button>';
		$("#settingsSection").append(btnSaveImage);
		$("#btnSaveImage").unbind();
		$("#btnSaveImage").click(function() { saveFile('image'); });
		

		var btnSavePDF = '<button class="pure-button actionButton" id="btnSavePDF"><i class="fa fa-file-pdf-o"></i> Save as PDF</button>';
		$("#settingsSection").append(btnSavePDF);
		$("#btnSavePDF").unbind();
		$("#btnSavePDF").click(function() {	saveFile('pdf'); });
				
		// Toggle data labels
		var btnToggleLabels = '<button class="pure-button actionButton" id="btnToggleLabels"><i class="fa fa-check-square-o"></i> Toggle data labels</button>';
		$("#settingsSection").append(btnToggleLabels);
		$("#btnToggleLabels").unbind();
		$("#btnToggleLabels").click(function() {
			toggleDataLabels();
			$(this).find("i").toggleClass("fa-check-square-o fa-square-o");
			return false;
		});
		
		$("#settingsSection").append('<select id="dropdownRules" class="pure-menu">');
		$("#dropdownRules").change(function() {
			g_currentRuleListIndex = chosen_colour = this.selectedIndex;
			g_currentRuleListName = this.value;
			reportData.reCalculate(g_currentRuleListIndex, g_selectedPhysicians);
		});
	
		// Add dropdown to switch between rule sets
		for (var i=0; i<reportRules.ruleList.length;i++) {
			$("#dropdownRules").append('<option>' + reportRules.ruleList[i].name + '</option>');
		}
		
		$("#dropdownRules").val(reportRules.ruleList[g_currentRuleListIndex].name);
	};
	
	function saveFile(fileType) {
		
			// Append canvas to the document
			var canvasString = '<canvas id="outputCanvas" width="' + DEFAULT_CANVAS_WIDTH + '" height="' + DEFAULT_CANVAS_HEIGHT +
								'" style="border: 1px solid black; display:none;"></canvas>';
					
			$("body").append(canvasString);

			// Retrieve output canvas and copy the current visualization into the canvas
			var output = $("#outputCanvas")[0];
			var svgXML = (new XMLSerializer()).serializeToString($("#canvasSVG")[0]);	
			canvg(output, svgXML, { ignoreDimensions: true });
			
			var ctx = output.getContext('2d');
			ctx.save();
			ctx.globalCompositeOperation = "destination-over";
			ctx.fillStyle = 'white';
			ctx.fillRect(0, 0, output.width, output.height);
								
		if (fileType === 'pdf') {
			// Retrieve data URL of the graph
			var outputURL = output.toDataURL('image/jpeg');
			
			// Create portrait PDF object
			var doc = new jsPDF();

			// Title
			doc.setFontSize(20);
			doc.setFont('times');
			var splitTitle = doc.splitTextToSize(g_reportTitle, 180);
			doc.text(15, 20, splitTitle);
			doc.addImage(outputURL, 'JPEG', 15, 60, 180, 100);
			
			// save() to download automatically, output() to open in a new tab
			//doc.save(g_reportTitle);
			doc.output('save', g_reportTitle);
		} else {
			// Retrieve data string of the canvas and append to the hidden img element
			var outputURL = output.toDataURL();
			$("#outputImg").src = outputURL;
			// Modify attributes of hidden elements and simulate file download
			$("#outputA").download = g_reportTitle;
			$("#outputA").href = outputURL;
			$("#outputA").click();
			
			output.toBlob(function(blob) {
				saveAs(blob, g_reportTitle);
			});
		}
		ctx.restore();
		
		//For jQuery callback
		return false;
	}
	
	function addIndicatorEditor(ruleIndex) {
		
		function capitalize(s){
			return s.toLowerCase().replace( /\b./g, function(a){ return a.toUpperCase(); } );
		};
		
		//Reset indicator editor bar
		removeIndicatorEditor();

		var items = [];
		
		items.push('<div class="pure-g">');
		items.push('<div class="pure-u-1 indicatorTitle">Modify Indicator Targets</div>');
		
		
		$.each(g_currentRule.modifiable, function(i, item) {
			var itemName = reportRules.lookupVarNameTable[item];
			if (typeof itemName === 'undefined') {
				itemName = item;
			}
			
			items.push('<div class="pure-u-1 indicator"><label for="' + item + '">' + itemName + '</label>');
			items.push('<br/><input id="' + item + '" class="indicatorValue" value="' + g_currentRule[item] + '"></div>'); 
		});
		
		items.push('<div class="pure-u-1-2"><button id="applybtn" class="pure-button">Apply Changes</button></div>');
		items.push('<div class="pure-u-1-2"><button style="float:right" id="resetbtn" class="pure-button">Reset</button></div>');
		items.push('<div class="pure-u-1 indicator"><button id="resetallbtn" class="pure-button">Reset All</button></div>');
		items.push('</div>');
		$("#indicatorBar").append(items.join(''));
		
		
		$("#indicatorBar .indicatorValue").bind('keypress', function(e) {
			var code = e.keyCode || e.which;
			if(code == 13) {
				updateIndicator(ruleIndex);
			}
		});
				
		//var $saveChanges = $('<input type="button" id="applybtn" value="Save Changes" />');
		//$saveChanges.appendTo($("#indicatorParameters"));
		
		$("#applybtn").unbind();
		$("#applybtn").click( function() { updateIndicator(ruleIndex); return false; } );
		
		$("#resetbtn").unbind();
		$("#resetbtn").click( function() { resetIndicator(ruleIndex); return false; } );
		
		$("#resetallbtn").unbind();
		$("#resetallbtn").click( function() { resetAllIndicators(ruleIndex); return false; } );
			
		$("#indicatorBar").css("display", "block");
	}
	
	function updateIndicator(ruleIndex) {
		var params_updated = 0;
		
		$('.indicatorValue').each(function() {
			reportRules.ruleList[g_currentRuleListIndex].rules[ruleIndex][this.id] = this.value || 0;
			params_updated++;
		});
		
		if (params_updated === $('.indicatorValue').length) {
			reportData.reCalculate(g_currentRuleListIndex, g_selectedPhysicians);
		}
	}
	
	function resetIndicator(ruleIndex) {
		reportRules.resetToDefault(reportRules.ruleList[g_currentRuleListIndex].rules[ruleIndex]);
		
		reportData.reCalculate(g_currentRuleListIndex, g_selectedPhysicians);
		
		addIndicatorEditor(ruleIndex);
	}
	
	function resetAllIndicators(ruleIndex) {
		
		//Loop through all rules and Reset if they have a 'defaults' property			
		for (var i = 0; i < reportRules.ruleList[g_currentRuleListIndex].rules.length; i++){
			if (reportRules.ruleList[g_currentRuleListIndex].rules[i].hasOwnProperty('defaults')) {
				reportRules.resetToDefault(reportRules.ruleList[g_currentRuleListIndex].rules[i]);
			}
		}
		
		reportData.reCalculate(g_currentRuleListIndex, g_selectedPhysicians);
		
		addIndicatorEditor(ruleIndex);
	}
	
	function removeIndicatorEditor(ruleIndex) {
		$("#indicatorBar").empty();
		$("#indicatorBar").css("display", "none");
	}
	
	/* 
	 * Called by reportData
	 * Removes and reinitializes UI elements and chart
	 * Calls appropriate graphing function based on mode
	 */
	function generateCharts(rd_currentRuleListIndex, rd_calculatedData, rd_selectedPhysicians, rd_arrayDates) {
		
		g_mode = rd_arrayDates.length > 1 ? "tracking" : "snapshot";
		g_calculatedData = rd_calculatedData;
		g_selectedPhysicians = rd_selectedPhysicians;
		g_arrayDates = rd_arrayDates;
		g_currentRuleListIndex = chosen_colour = rd_currentRuleListIndex;
		g_currentRuleListName = reportRules.ruleList[rd_currentRuleListIndex].name;
				
		clearCanvas();
		clearUserInterface();
		//removeIndicatorEditor();
		addUserInterface();
		
		if (g_calculatedData == undefined) {
			console.log("no calculated data!");
			return;
		}
		
		if (g_mode == "snapshot") {
			//calculatedData = calculatedData[0];
			generateSnapshot(0);
		} else {
			//By default, select first item in dropdown
			generateTracking(0);
		}
	};
	
	function generateSnapshot(selectedDate){
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
				return reportRules.ruleList[g_currentRuleListIndex].name + " Measure"; 
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
				
				var title = g_currentRuleListName + " Report for Doctor";
				
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
		
		// Add bars for patients within criteria
		g_canvas.selectAll("onTargetBar")
			.data(arrayData)
			.enter().append("rect")
				.attr("class", "onTargetBar")
				.attr("width", function(d) { return xScale(d); })
				.attr("height", yScale.rangeBand())
				.attr("y", function (d, i) { return yScale(arrayDesc[i]); })
				.attr("fill", DEFAULT_COLOURS[chosen_colour])
				.attr("data-ruleindex", function (d, i) { return i.toString(); }) //used to select/modify current rule
				.on("click", function() {
					d3.selectAll(".onTargetBar")
						.style("fill", DEFAULT_COLOURS[chosen_colour]);
					d3.select(this)
						.style("fill", HIGHLIGHT_COLOURS[chosen_colour]);
						
					origRuleIndex = g_calculatedData[0][d3.select(this).attr("data-ruleindex")].index;
					g_currentRule = reportRules.ruleList[g_currentRuleListIndex].rules[origRuleIndex];
					if (g_currentRule.hasOwnProperty("modifiable")) {
						addIndicatorEditor(origRuleIndex);
					} else {
						removeIndicatorEditor(origRuleIndex);
					}
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
				.attr("shape-rendering", "crispEdges")
				.on("click", function() {
					handleBarClick(this.getAttribute("y"));
					return false;
				});
		
		//Labels for each bar
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
	
	function handleBarClick(y) {
					$(".onTargetBar")
						.attr("fill", DEFAULT_COLOURS[chosen_colour]);
					var thisBar = $(".onTargetBar[y="+y+"]");
					thisBar.attr("fill", HIGHLIGHT_COLOURS[chosen_colour]);
						
					origRuleIndex = g_calculatedData[0][thisBar.attr("data-ruleindex")].index;
					g_currentRule = reportRules.ruleList[g_currentRuleListIndex].rules[origRuleIndex];
					if (g_currentRule.hasOwnProperty("modifiable")) {
						addIndicatorEditor(origRuleIndex);
					} else {
						removeIndicatorEditor(origRuleIndex);
					}
	}
	
	function generateTracking(selectedRule) {

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
					clearCanvas();
					clearUserInterface();
					generateSnapshot(i);
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
	
	function toggleDataLabels(selectedDate) {
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
				
				var selectedRule = $("#dropdownRules option:selected").index();
				
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
	
	return {
		generateCharts: generateCharts,
		clearCanvas: clearCanvas
	};
	
})();
