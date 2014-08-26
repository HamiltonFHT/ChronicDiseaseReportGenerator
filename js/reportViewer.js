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
	var gCanvas = d3.select("#canvasContainer").select("#canvasSVG");
	
	var gMode = ""; //either "snapshot" or "tracking"
	var gDataLabels = true; //either true or false (not currently used)
	var gCalculatedData = null; // indicator result data set from reportRules
	var gSelectedPhysicians = null; // selected physicians object [{docnumber: true/false}, ...]
	var gArrayDates = null; //array of dates [date, date, ...]
	var gCurrentRuleSetIndex = 0; // current rule set index
	var gCurrentRuleSetName = ""; // current rule set name
	var gCurrentIndicator = 0;       // current indicator
	
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
							"sandybrown", "forestgreen", "firebrick", "goldenrod", "darkslateblue",
							 "palevioletred", "sienna", "bisque"];
							
	var HIGHLIGHT_COLOURS = ["lightcoral", "#90B4D2", "#CCE698", "#DFD4F4", "#AFCED0",
							 "#FAD2B0", "#90C590", "lightcoral"];

	//Used when displaying axis titles
	String.prototype.replaceAt=function(index, character) {
	    return this.substr(0, index) + character + this.substr(index+character.length);
	}


	/*
	 * Remove graph and user interface elements
	 * Called when chart needs to be refreshed or cleared
	 */
	function clearCanvas() {
		
		$("#canvasContainer").empty();
				
		gCanvas = d3.select("#canvasContainer").append("svg")
					.attr("id", "canvasSVG")
					.attr("width", DEFAULT_CANVAS_WIDTH)
					.attr("height", DEFAULT_CANVAS_HEIGHT)
					.style("border", "1px solid lightgray")
						.append("g")
							.attr("class", "g_main")
							.attr("transform", function() {
								switch (gMode) {
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
		$("#settings").empty();
		$("#save").empty();
	}
	
	
	function allEqual(val, obj){
		for (k in obj) {
			if (obj[k] != val) {
				return false;
			}
		}
		return true;
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
		$("#settings").append('<ul id="selectPhysicians"></ul>' +
							  '<div id="selectRuleSet"></div>' +
							  '<div id="selectIndicator"></div>' +
							  '<div id="toggleLabels"></div>');
		
		$("#selectPhysicians").append('<li id="mainSelector" class="physicianListItem selected"><span class="checkmark">\u2714</span>Select All</li>');
		// Loop through 'arrayUniquePhysicians' and create a list item for each element. These will be the physician filters that will appear in the side
		// panel. There will also be a filter for "All Selected Physicians"
		//for (var i = 0; i < Object.keys(gSelectedPhysicians).length; i++) {
		for (doc in gSelectedPhysicians) {
			$("#selectPhysicians").append('<li class="physicianListItem selected" data-docnumber="'+doc+'"><span class="checkmark">\u2714</span> Doctor Number ' + doc + '</li>');
		}
		
		//}
		
		$(".physicianListItem").click( function(){ 
			if (gCalculatedData == undefined) { 
				console.log("Calculated data undefined");
				return false;
			}

			var isSelected = $(this).hasClass("selected");
			if (isSelected === true) {
				var className = 'notSelected';
			} else {
				var className = 'selected';
			}
			// If clicked on "Select All"
			if (this.id === "mainSelector") {
				// If class has 'selected', it currently is selected and must be unselected
				for (doc in gSelectedPhysicians) {
					if (gSelectedPhysicians.hasOwnProperty(doc)) {
						//negate the isSelected status to select/deselect the option
						gSelectedPhysicians[doc] = !isSelected;
					}
				}
				$(".physicianListItem").removeClass("selected notSelected").addClass(className);
			}
			// Otherwise, clicked on an individual doctor
			else {
				var doc = $(this).data('docnumber');//.innerHTML.substring(this.innerHTML.indexOf("Doctor") + 14, this.innerHTML.length - 7);
				gSelectedPhysicians[doc] = !isSelected;
				$(this).toggleClass('selected notSelected');
				if(allEqual(true, gSelectedPhysicians)) {
					$("#mainSelector").removeClass("selected notSelected").addClass("selected");
				} else {
					$("#mainSelector").removeClass("selected notSelected").addClass("notSelected");
				}
			}
			
			reportData.reCalculate(gCurrentRuleSetIndex, gSelectedPhysicians);
			return false; 
	  	});

		// Save to PNG
		var btnSaveImage = '<button class="pure-button actionButton" id="btnSaveImage"><i class="fa fa-file-image-o"></i> Save as image</button>';
		$("#save").append(btnSaveImage);
		$("#btnSaveImage").unbind();
		$("#btnSaveImage").click(function() { saveFile('image'); });
		

		var btnSavePDF = '<button class="pure-button actionButton" id="btnSavePDF"><i class="fa fa-file-pdf-o"></i> Save as PDF</button>';
		$("#save").append(btnSavePDF);
		$("#btnSavePDF").unbind();
		$("#btnSavePDF").click(function() {	saveFile('pdf'); });
				
		// Toggle data labels
		var btnToggleLabels = '<button class="pure-button actionButton" id="btnToggleLabels"><i class="fa fa-check-square-o"></i> Toggle data labels</button>';
		$("#save").append(btnToggleLabels);
		$("#btnToggleLabels").unbind();
		$("#btnToggleLabels").click(function() {
			toggleDataLabels();
			$(this).find("i").toggleClass("fa-check-square-o fa-square-o");
			return false;
		});
		
		/*
		 * Mode dropdown
		 */
		var dropdownMode = '<select id="dropdownMode" class="settingsDropdown">' +
							'<option data-mode="snapshot">Snapshot</option>' +
							'<option data-mode="tracking">Tracking</option>' +
							'</select>';
		$("#settings").append(dropdownMode);
		
		if(gMode === "snapshot") {
			$("#dropdownMode").val("Snapshot");
		} else {
			$("#dropdownMode").val("Tracking");
		}
		
		$("#dropdownMode").change(function() {
			gMode = $(this).find(':selected').data('mode');
			updateCharts();
		});
		/*
		 * Rule set dropdown
		 */
		var dropdownRules = ['<select id="dropdownRules" class="settingsDropdown">'];
		
		// Add dropdown to switch between rule sets
		for (var i=0; i<reportRules.ruleList.length;i++) {
			dropdownRules.push('<option>' + reportRules.ruleList[i].name + '</option>');
		}
		dropdownRules.push('</div>');
		
		$("#settings").append(dropdownRules.join('\n'));
		
		$("#dropdownRules").change(function() {
			gCurrentRuleSetIndex = this.selectedIndex;
			gCurrentRuleSetName = this.value;
			gCurrentIndicator = 0;
			
			reportData.reCalculate(gCurrentRuleSetIndex, gSelectedPhysicians);
			updateDropdownIndicators();
		});
		
		$("#dropdownRules").val(reportRules.ruleList[gCurrentRuleSetIndex].name);
		
		/*
		 * Indicator set dropdown
		 */
		updateDropdownIndicators();	
	};
	
		function updateDropdownMode() {
		if(gMode === "snapshot") {
			$("#dropdownMode").val("Snapshot");
		} else {
			$("#dropdownMode").val("Tracking");
		}
	}
	
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
			var splitTitle = doc.splitTextToSize(gReportTitle, 180);
			doc.text(15, 20, splitTitle);
			doc.addImage(outputURL, 'JPEG', 15, 60, 180, 100);
			
			// save() to download automatically, output() to open in a new tab
			//doc.save(gReportTitle);
			doc.output('save', gReportTitle);
		} else {
			// Retrieve data string of the canvas and append to the hidden img element
			var outputURL = output.toDataURL();
			$("#outputImg").src = outputURL;
			// Modify attributes of hidden elements and simulate file download
			$("#outputA").download = gReportTitle;
			$("#outputA").href = outputURL;
			$("#outputA").click();
			
			output.toBlob(function(blob) {
				saveAs(blob, gReportTitle);
			});
		}
		ctx.restore();
		
		//For jQuery callback
		return false;
	}
	
	function addIndicatorEditor() {
		
		function capitalize(s){
			return s.toLowerCase().replace( /\b./g, function(a){ return a.toUpperCase(); } );
		};
		
		var currentIndicator = getInternalRuleIndex();
		
		//Reset indicator editor bar
		removeIndicatorEditor();

		currentRule = reportRules.ruleList[gCurrentRuleSetIndex].rules[currentIndicator];
		if (!currentRule.hasOwnProperty("modifiable")) {
			return false;
		}

		var items = [];
		
		//items.push('<div id="indicatorEditor" class="pure-g">');
		items.push('<div class="pure-u-1 indicatorTitle">Modify Indicator Targets</div>');
				
		$.each(currentRule.modifiable, function(i, item) {
			var itemName = reportRules.lookupVarNameTable[item];
			if (typeof itemName === 'undefined') {
				itemName = capitalize(item);
			}
			
			items.push('<div class="pure-u-1"><label for="' + item + '">' + itemName + '</label>');
			items.push('<br/><input id="' + item + '" class="indicatorValue" value="' + currentRule[item] + '"></div>'); 
		});
		
		//items.push('<div style="line-height:200px;">&nbsp;</div>');
		items.push('<div style="padding-top:15px;" class="pure-u-1-2"><button id="applybtn" class="pure-button">Apply Changes</button></div>');
		items.push('<div class="pure-u-1-2" style="padding-top:15px;"><button style="float:right" id="resetbtn" class="pure-button">Reset</button></div>');
		items.push('<div class="pure-u-1"><button id="resetallbtn" class="pure-button">Reset All</button></div>');
		$("#indicatorEditor").append(items.join(''));
		
		
		$("#indicatorEditor .indicatorValue").bind('keypress', function(e) {
			var code = e.keyCode || e.which;
			if(code == 13) {
				updateIndicator();
			}
		});
				
		//var $saveChanges = $('<input type="button" id="applybtn" value="Save Changes" />');
		//$saveChanges.appendTo($("#indicatorParameters"));
		
		$("#applybtn").unbind();
		$("#applybtn").click( function() { updateIndicator(); return false; } );
		
		$("#resetbtn").unbind();
		$("#resetbtn").click( function() { resetIndicator(); return false; } );
		
		$("#resetallbtn").unbind();
		$("#resetallbtn").click( function() { resetAllIndicators(); return false; } );
			
		$("#indicatorEditor").css("display", "block");
		
		updateDropdownIndicators();
	}
	
	function updateDropdownIndicators() {
		
		if ($("#indicatorEditor").length === 0) {
			return false;
		}
		
		$("#dropdownIndicators").remove();
		
		var dropdownIndicators = ['<select id="dropdownIndicators">'];
				
		// Add the options for the different measures in the drop down menu
		// Created dynamically based on default values
		// To do: variables to store user input values
		for (var i = 0; i < gCalculatedData[0].length; i++) {
			dropdownIndicators.push('<option>' + gCalculatedData[0][i]["desc"] + '</option>');
		}
		dropdownIndicators.push('</select>');
		
		$("#indicatorEditor").prepend(dropdownIndicators.join('\n'));
		
		$("#dropdownIndicators")[0].selectedIndex = gCurrentIndicator;
		
		$("#dropdownIndicators").change(function() {
			clearCanvas();
			
			gCurrentIndicator = this.selectedIndex;
			addIndicatorEditor(getInternalRuleIndex());
						
 			updateCharts();
		});
	}
	
	function updateIndicator() {
		var params_updated = 0;
		
		var currentIndicator = getInternalRuleIndex();
		
		$('.indicatorValue').each(function() {
			reportRules.ruleList[gCurrentRuleSetIndex].rules[currentIndicator][this.id] = this.value || 0;
			params_updated++;
		});
		
		if (params_updated === $('.indicatorValue').length) {
			reportData.reCalculate(gCurrentRuleSetIndex, gSelectedPhysicians);
			updateDropdownIndicators();
		}
	}
	
	function resetIndicator() {
		var currentIndicator = getInternalRuleIndex();
		
		reportRules.resetToDefault(reportRules.ruleList[gCurrentRuleSetIndex].rules[currentIndicator]);
		
		updateDropdownIndicators();
		reportData.reCalculate(gCurrentRuleSetIndex, gSelectedPhysicians);
		
		addIndicatorEditor();
	}
	
	function resetAllIndicators() {
		//Loop through all rules and Reset if they have a 'defaults' property			
		for (var i = 0; i < reportRules.ruleList[gCurrentRuleSetIndex].rules.length; i++){
			if (reportRules.ruleList[gCurrentRuleSetIndex].rules[i].hasOwnProperty('defaults')) {
				reportRules.resetToDefault(reportRules.ruleList[gCurrentRuleSetIndex].rules[i]);
			}
		}
		updateDropdownIndicators();
		reportData.reCalculate(gCurrentRuleSetIndex, gSelectedPhysicians);
		addIndicatorEditor();
	}
	
	function removeIndicatorEditor(ruleIndex) {
		$("#indicatorEditor").empty();
		$("#indicatorEditor").css("display", "none");
	}
	
	function updateCharts() {
		clearCanvas();
		
		if (gMode === "tracking") {
			generateTracking();			
		} else {
			generateSnapshot(0);
		}
		addIndicatorEditor();
	}
	
	function getInternalRuleIndex() {
		return gCalculatedData[0][gCurrentIndicator].index;
	}
	
	/* 
	 * Called by reportData
	 * Removes and reinitializes UI elements and chart
	 * Calls appropriate graphing function based on mode
	 */
	function generateCharts(currentRuleSetIndex, calculatedData, selectedPhysicians, arrayDates) {
		
		gMode = gMode || (arrayDates.length > 1 ? "tracking" : "snapshot");
		gCalculatedData = calculatedData;
		gSelectedPhysicians = selectedPhysicians;
		gArrayDates = arrayDates;
		gCurrentRuleSetIndex = currentRuleSetIndex;
		gCurrentRuleSetName = reportRules.ruleList[currentRuleSetIndex].name;
				
		clearCanvas();
				
		if (gCalculatedData == undefined) {
			console.log("no calculated data!");
			return;
		}
		
		if ($("#settings").children().length === 0) {
			addUserInterface();
		}
		
		if (gMode === "snapshot") {
			//calculatedData = calculatedData[0];
			//$("#dropdownIndicators").hide();
			generateSnapshot(0);
		} else {
			var isEmpty = true;
			for (var i = 0; i < gCalculatedData.length; i++) {
				if (gCalculatedData[i].length>0) {
					isEmpty = false;
				} else {
					gCalculatedData.splice(i, 1);
					gArrayDates.splice(i, 1);
				}
			}
			
			if (!isEmpty) {
				//By default, select first item in dropdown
				$("#dropdownIndicators").show();
								
				generateTracking();
			} else {
				alert("No data found in these files for the " + $("#dropdownRules").val() + " rule set");
			}
		}
		
		addIndicatorEditor();
		updateDropdownMode();
	};
	
	function generateSnapshot(selectedDate){

		var snapshotData = gCalculatedData[selectedDate];

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
			
			//If the description is really long then insert a newline.
			var desc = snapshotData[i]["desc"];
			if (desc.length > 32 && desc.substr(32).indexOf(" ") > -1) {
				desc = desc.replaceAt(desc.substr(32).indexOf(" ")+32, "\n");
			}
			arrayDesc.push(desc);
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
			
		gCanvas.selectAll(".tickline")
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
		gCanvas.append("text")
			.attr("class", "xAxisLabel")
			.attr("x", DEFAULT_GRAPH_WIDTH_SNAPSHOT_MODE / 2)
			.attr("y", DEFAULT_GRAPH_HEIGHT_SNAPSHOT_MODE + 40)
			.attr("text-anchor", "middle")
			.style("font-weight", "bold")
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.text("% of Patients");
			
		// Add y axis label
		gCanvas.append("text")
			.attr("class", "yAxisLabel")
			.attr("transform", "rotate(-90)")
			.attr("x", -DEFAULT_GRAPH_HEIGHT_SNAPSHOT_MODE / 2)
			.attr("y", -DEFAULT_PADDING_LEFT_SNAPSHOT_MODE / 2 - 125)
			.attr("text-anchor", "middle")
			.style("font-weight", "bold")
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.text( (function() {
				return reportRules.ruleList[gCurrentRuleSetIndex].name + " Measure"; 
			}));
		
		// Graph title text
		gCanvas.append("text")
			.attr("class", "graphTitle")
			.attr("x", DEFAULT_GRAPH_WIDTH_SNAPSHOT_MODE / 3.5)
			.attr("y", -DEFAULT_PADDING_TOP_SNAPSHOT_MODE / 2 + 10)
			.attr("text-anchor", "middle")
			.style("font-size", "14px")
			.style("font-weight", "bold")
			.text(function() {
				var arraySelectedOnly = [];

				for (var doc in gSelectedPhysicians) {
					if (gSelectedPhysicians[doc] == true)
						arraySelectedOnly.push(doc);
				}
				
				if (arraySelectedOnly.length == 0) {
					return "No Doctors Selected";
				}
				
				//Use this instead to remove global?
				//ruleSet = $("#dropdownRules").val();
				
				var title = gCurrentRuleSetName + " Report for Doctor";
				
				if (arraySelectedOnly.length > 1) title += "s ";
				else title += " ";
				for (var i = 0; i < arraySelectedOnly.length; i++) {
					if (i == arraySelectedOnly.length - 2)
						title += arraySelectedOnly[i] + " and ";
					else if (i == arraySelectedOnly.length - 1)	
						title += arraySelectedOnly[i];
					else title += arraySelectedOnly[i] + ", ";
				}
				title += " as of " + gArrayDates[selectedDate].toString().substring(4, 15);
				title += " (n = " + snapshotData[0]["total"] + ")";
				gReportTitle = title;
				return title;
			});
		
		//Translate graph into center of page
		gCanvas.append("g")
			.attr("transform", "translate(0, " + DEFAULT_GRAPH_HEIGHT_SNAPSHOT_MODE + ")")
			.style("font-family", "Arial")
			.style("font-size", "14px")
			.call(xAxis);
			
		gCanvas.append("g")
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
		gCanvas.selectAll("onTargetBar")
			.data(arrayData)
			.enter().append("rect")
				.attr("class", "onTargetBar")
				.attr("width", function(d) { return xScale(d); })
				.attr("height", yScale.rangeBand())
				.attr("y", function (d, i) { return yScale(arrayDesc[i]); })
				.attr("fill", DEFAULT_COLOURS[gCurrentRuleSetIndex])
				.attr("data-ruleindex", function (d, i) { return i.toString(); }) //used to select/modify current rule
				.on("click", function(d, i) {
					handleBarClick(i, this.getAttribute("y"));
					return false;
				})
				.style("stroke", "black")
				.style("stroke-width", "1px")
				.attr("shape-rendering", "crispEdges");

		// Add bars for patients not within criteria
		gCanvas.selectAll("offTargetBar")
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
				.on("click", function(d, i) {
					handleBarClick(i, this.getAttribute("y"));
					return false;
				});
		
		//Labels for each bar
		gCanvas.selectAll("onTargetLabel")
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
		
		gCanvas.selectAll("offTargetLabel")
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
	
	function handleBarClick(i, y) {
		$(".onTargetBar")
			.attr("fill", DEFAULT_COLOURS[gCurrentRuleSetIndex]);
		var thisBar = $(".onTargetBar[y="+y+"]");
		thisBar.attr("fill", HIGHLIGHT_COLOURS[gCurrentRuleSetIndex]);
		gCurrentIndicator = i;
		
		currentRule = reportRules.ruleList[gCurrentRuleSetIndex].rules[getInternalRuleIndex()];
		if (currentRule.hasOwnProperty("modifiable")) {
			addIndicatorEditor();
		} else {
			removeIndicatorEditor();
		}
	}
	
	function generateTracking() {
		var arrayDates = gArrayDates;

		var arrayData = [];
		var arrayDesc = [];
		for (var i=0; i < gCalculatedData.length; i++) {
			arrayData.push([]);
			arrayDesc.push([]);
			for (var j=0; j < gCalculatedData[i].length; j++) {
				if (gCalculatedData[i][j]["total"] == 0) {
					continue;
				}
				arrayData[i].push(gCalculatedData[i][j]["passed"] / gCalculatedData[i][j]["total"] * 100);
				arrayDesc[i].push(gCalculatedData[i][j]["desc"]);
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
		gCanvas.selectAll(".xTickLine")
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
		gCanvas.selectAll(".yTickLine")
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
		
		// Append xAxis to the gCanvas
		gCanvas.append("g")
			.attr("class", "xAxis")
			.attr("transform", "translate(0, " + DEFAULT_GRAPH_HEIGHT_TRACKING_MODE + ")")
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.call(xAxis);
					
		// Append yAxis to the gCanvas
		gCanvas.append("g")
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
		gCanvas.selectAll(".dataPointConnector")
			.data(new Array(arrayData.length - 1))
			.enter().append("line")
				.attr("class", "dataPointConnector")
				.attr("x1", function (d, i) { return xScale(arrayDates[i]); })
				.attr("x2", function (d, i) { return xScale(arrayDates[i + 1]); })
				.attr("y1", function (d, i) { return yScale(arrayData[i][gCurrentIndicator]); })
				.attr("y2", function (d, i) { return yScale(arrayData[i + 1][gCurrentIndicator]); })
				.attr("stroke", DEFAULT_COLOURS[gCurrentRuleSetIndex])
				.attr("stroke-width", 2);
		
		// Append data points
		gCanvas.selectAll(".dataPoint")
			.data(arrayData)
			.enter().append("circle")
				.attr("class", "dataPoint")
				.attr("cx", function (d, i) { return xScale(arrayDates[i]); })
				.attr("cy", function(d, i) { return yScale(arrayData[i][gCurrentIndicator]); })
				.attr("r", 5)
				.attr("fill", DEFAULT_COLOURS[gCurrentRuleSetIndex])
				.on("mouseover", function(d) {
					d3.select(this)
						.attr("r", 7)
						.style("fill", HIGHLIGHT_COLOURS[gCurrentRuleSetIndex]);
				})
				.on("mouseout", function(d) {
					d3.select(this)
						.attr("r", 5)
						.style("fill", DEFAULT_COLOURS[gCurrentRuleSetIndex]);
				})
				.on("click", function(d, i) {
					// To do: generate graph underneath for the date clicked
					//document.getElementById("canvasContainer_extra").removeChild(document.getElementById("canvasSVG"));
					d3.select(this)
						.attr("r", 7)
						.style("fill", HIGHLIGHT_COLOURS[gCurrentRuleSetIndex]);
					gMode = "snapshot";
					clearCanvas();
					//$("#dropdownIndicators").hide();
					generateSnapshot(i);
				});
				
		// Add x axis label
		gCanvas.append("text")
			.attr("class", "xAxisLabel")
			.attr("x", DEFAULT_GRAPH_WIDTH_TRACKING_MODE / 2)
			.attr("y", DEFAULT_GRAPH_HEIGHT_TRACKING_MODE + 40)
			.attr("text-anchor", "middle")
			.style("font-weight", "bold")
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.text("Date");
		
		// Add y axis label
		gCanvas.append("text")
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
		gCanvas.append("text")
			.attr("class", "graphTitle")
			.attr("x", DEFAULT_GRAPH_WIDTH_TRACKING_MODE / 2)
			.attr("y", -DEFAULT_PADDING_TOP_TRACKING_MODE / 2)
			.attr("text-anchor", "middle")
			.style("font-size", "14px")
			.style("font-family", "sans-serif")
			.style("font-weight", "bold")
			.text(function() {
				var indicator = gCalculatedData[0][gCurrentIndicator].desc;
				var title = indicator + " for Doctor";
				var arraySelectedOnly = [];

				for (var doc in gSelectedPhysicians) {
					if (gSelectedPhysicians[doc] == true)
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
				gReportTitle = title;
				return title;
			});
		
		// Add labels for data points
		gCanvas.selectAll(".dataLabel")
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
							if (arrayData[1][0] >= arrayData[i][gCurrentIndicator])
								return yScale(arrayData[i][gCurrentIndicator]) + 25;
							else return yScale(arrayData[i][gCurrentIndicator]) - 15;
						}
						// For last point, compare with second last point
						else if (i == arrayData.length - 1) {
							if (arrayData[arrayData.length - 2][0] >= arrayData[i][gCurrentIndicator])
								return yScale(arrayData[i][gCurrentIndicator]) + 25;
							else return yScale(arrayData[i][gCurrentIndicator]) - 15;
						}
						// Else all points in between, check both sides
						else {
							// If both adjacent points are above, place below
							if (arrayData[i - 1][0] >= arrayData[i][gCurrentIndicator] && arrayData[i + 1][0] >= arrayData[i][gCurrentIndicator])
								return yScale(arrayData[i][gCurrentIndicator]) + 25;
							// Else if both are below, place above	
							else if (arrayData[i - 1][0] < arrayData[i][gCurrentIndicator] && arrayData[i + 1][0] < arrayData[i][gCurrentIndicator])
								return yScale(arrayData[i][gCurrentIndicator]) - 15;
							// Else just place above
							else return yScale(arrayData[i][gCurrentIndicator]) - 15;
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
						if (arrayData[i][gCurrentIndicator] == 0)
							return (arrayData[i][gCurrentIndicator]).toFixed(0) + "%";
						else 
							return (arrayData[i][gCurrentIndicator]).toFixed(1) + "%";
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

			if (gMode === "snapshot") {
				var snapshotData = gCalculatedData[0];
			
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
			
				gCanvas.selectAll("onTargetLabel")
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
				
				gCanvas.selectAll("offTargetLabel")
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

				for (var i=0; i < gCalculatedData.length; i++) {
					arrayData.push([]);
					arrayDesc.push([]);
					for (var j=0; j < gCalculatedData[i].length; j++) {
						if (gCalculatedData[i][j]["total"] == 0) {
							continue;
						}
						arrayData[i].push(gCalculatedData[i][j]["passed"] / gCalculatedData[i][j]["total"] * 100);
						arrayDesc[i].push(gCalculatedData[i][j]["desc"]);
					}
				}
				if (arrayData.length == 0) {
					return;
				}
								
				gCanvas.selectAll(".dataLabel")
					.data(arrayData)
					.enter().append("text")
						.attr("class", "dataLabel")
						.attr("x", function(d, i) { return xScale(gArrayDates[i]); })
						.attr("y", function(d, i) { return yScale(arrayData[i][gCurrentIndicator]) - 15; }) // 15 pixels above data point
						.attr("text-anchor", "middle")
						.style("fill", "black")
						.style("font-size", "13px")
						.style("font-family", "Arial")
						.text(function(d, i) { 
							if ((arrayData[i][gCurrentIndicator]) == 0)
								return (arrayData[i][gCurrentIndicator]).toFixed(0) + "%";
							else 
							return (arrayData[i][gCurrentIndicator]).toFixed(1) + "%";
						});
			}
		}
	};
	
	return {
		generateCharts: generateCharts,
		clearCanvas: clearCanvas
	};
	
})();
