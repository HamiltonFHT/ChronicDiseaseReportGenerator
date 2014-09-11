/*
	Chronic Disease Report Generator - Web based reports on quality of care standards
    Copyright (C) 2014  Brice Wong, Tom Sitter, Kevin Lin - Hamilton Family Health Team

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
var mdsViewer = (function() {

	//Member variables to store data and state
	var mCanvas = d3.select("#canvasContainer").select("#canvasSVG");
	var mCanvasExtra = null;
	
	var mMode = ""; //either "snapshot" or "tracking"
	var mDataLabels = true; //either true or false (not currently used)
	var mReportTitle = "";
	var mCalculatedData = null; // indicator result data set from mdsIndicators
	var mSelectedPhysicians = {}; // selected physicians object [{docnumber: true/false}, ...]
	var mArrayDates = null; //array of dates [date, date, ...]
	var mTotalPatients = null; //# of patient records in file
	var mCurrentIndSetIndex = 0; // current rule set index
	var mCurrentIndSetName = ""; // current rule set name
	var mCurrentIndicator = 0;       // current indicator
	var mCurrentDateIndex = 0; //current selected date when in tracking mode
	var xScale, yScale, xAxis, yAxis;
	

	//Static variables to handle graph dimensions and colors
	var DEFAULT_CANVAS_WIDTH = 940;
	var mCanvasScale = 1;
	var mCanvasWidth = DEFAULT_CANVAS_WIDTH * mCanvasScale;  		// pixels
	var DEFAULT_CANVAS_HEIGHT = 480;    	// pixels

	
	var DEFAULT_PADDING_LEFT_SNAPSHOT = 300;
	var mSnapshotPaddingLeft = DEFAULT_PADDING_LEFT_SNAPSHOT * mCanvasScale;
	var DEFAULT_PADDING_TOP_SNAPSHOT = 50;
	
	var DEFAULT_GRAPH_WIDTH_SNAPSHOT = DEFAULT_CANVAS_WIDTH - DEFAULT_PADDING_LEFT_SNAPSHOT - 25;
	var mGraphWidthSnapshot = DEFAULT_GRAPH_WIDTH_SNAPSHOT * mCanvasScale;
	var DEFAULT_GRAPH_HEIGHT_SNAPSHOT = DEFAULT_CANVAS_HEIGHT - (2 * DEFAULT_PADDING_TOP_SNAPSHOT);
	
	var DEFAULT_PADDING_LEFT_TRACKING = 75;
	var mTrackingPaddingLeft = DEFAULT_PADDING_LEFT_TRACKING * mCanvasScale;
	var DEFAULT_PADDING_TOP_TRACKING = 50;
	
	var DEFAULT_GRAPH_WIDTH_TRACKING = DEFAULT_CANVAS_WIDTH - (2 * DEFAULT_PADDING_LEFT_TRACKING);
	var mGraphWidthTracking = DEFAULT_GRAPH_WIDTH_TRACKING * mCanvasScale;
	var DEFAULT_GRAPH_HEIGHT_TRACKING = DEFAULT_CANVAS_HEIGHT - (2 * DEFAULT_PADDING_TOP_TRACKING);
	
	
	var DEFAULT_YAXIS_CHAR_LENGTH = 25;
	var DEFAULT_XAXIS_CHAR_LENGTH = 8;
	var mYAxisCharLength = DEFAULT_YAXIS_CHAR_LENGTH * mCanvasScale;
	var mXAxisCharLength = DEFAULT_XAXIS_CHAR_LENGTH;
	
	
	var DEFAULT_COLOURS = ["firebrick", "steelblue", "yellowgreen", "mediumpurple", "cadetblue",
							"sandybrown", "forestgreen", "firebrick", "goldenrod", "darkslateblue",
							 "palevioletred", "sienna", "bisque"];
							
	var HIGHLIGHT_COLOURS = ["lightcoral", "#90B4D2", "#CCE698", "#DFD4F4", "#AFCED0",
							 "#FAD2B0", "#90C590", "lightcoral"];

	var MONTH_NAMES = [ "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December" ];
    var MONTH_NAMES_SHORT = [ "Jan", "Feb", "Mar", "Apr", "May", "June",
    "July", "Aug", "Sept", "Oct", "Nov", "Dec" ];

	//Used when displaying axis titles
	/*
	String.prototype.replaceAt=function(index, character) {
	    return this.substr(0, index) + character + this.substr(index+character.length);
	};
	*/
	
	var resizeTimer;
	window.onresize = function(){
	    if (resizeTimer){
	        clearTimeout(resizeTimer);
	    } 
	    resizeTimer = setTimeout(function(){
	        updateCanvasSize(true);
	        }, 250);
	};
	
	
	//First time an extra canvas is generated, automatically scroll to it to show user the location
	//then disable the feature
	var mFirstScrollView = true;
	
	//Scroll until element is completely in view
	$.fn.scrollView = function () {
	  return this.each(function () {
	    $('html, body').animate({
	      scrollTop: $(this).offset().top
	    }, 1000);
	  });
	};
	
	//If element is less than 1/3 (approximately) in view then return true 
	//(only works if element is below current viewing window)
	$.fn.inViewport = function () {
		return $("#canvasContainer_extra").position().top + $("#canvasContainer_extra").height()/3 
				< (window.innerHeight || document.documentElement.clientHeight) + $(window).scrollTop();
	};

	//Check if two objects have the same keys
	function isEquivalent(a, b) {
	    // Create arrays of property names
	    var aProps = Object.keys(a);
	    var bProps = Object.keys(b);

	    // If number of properties is different,
	    // objects are not equivalent
	    if (aProps.length != bProps.length) {
	        return false;
	    }

	    for (var i = 0; i < aProps.length; i++) {
	        var propName = aProps[i];

	        // If b does not have property
	        // objects are not equivalent
	        if (!b.hasOwnProperty(propName)) {
	        	return false
	        }
	    }

	    // If we made it this far, objects
	    // are considered equivalent
	    return true;
	}
	/* 
	 * Called by mdsReader
	 * Removes and reinitializes UI elements and chart
	 * Calls appropriate graphing function based on mode
	 */
	function generateCharts(currentRuleSetIndex, calculatedData, selectedPhysicians, arrayDates, totalPatients) {
		
		//mMode = mMode || (arrayDates.length > 1 ? "tracking" : "snapshot");
		mMode = (arrayDates.length > 1 ? "tracking" : "snapshot");
		mCurrentIndSetIndex = currentRuleSetIndex;
		mCalculatedData = calculatedData;
		
		//If the selected phyisicians objects have different keys (i.e. docs) then this is
		//a new file and we have to update the physician list in the action bar
		var isNewFile = !isEquivalent(mSelectedPhysicians, selectedPhysicians);
		
		mSelectedPhysicians = selectedPhysicians;
		mArrayDates = arrayDates;
		mTotalPatients = totalPatients;
		mCurrentIndSetName = mdsIndicators.ruleList[currentRuleSetIndex].name;
		mCurrentIndicator = 0;
				
		clearCanvas();
		updateCanvasSize();
		
		$("#canvasContainer_extra").empty();

		if (mCalculatedData == undefined) {
			console.log("no calculated data!");
			return;
		}
		
		if ($("#settings").children().length === 0) {
			addUserInterface();
		} else if (isNewFile) {
			addPhysicianList();
		}
		
		if (mArrayDates.length == 1 && $('#dropdownMode').length) {
			$("#dropdownMode").prop("disabled", true);
		} else {
			$("#dropdownMode").prop("disabled", false);
		}
		
		if (mMode === "snapshot") {
			//calculatedData = calculatedData[0];
			//$("#dropdownIndicators").hide();
			generateSnapshot(0);
		} else {
			var isEmpty = true;
			for (var i = 0; i < mCalculatedData.length; i++) {
				if (mCalculatedData[i].length>0) {
					isEmpty = false;
				} else {
					mCalculatedData.splice(i, 1);
					mArrayDates.splice(i, 1);
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
		
		$("#dropdownRules").val(getCurrentIndSetName());
	};


	/*
	 * Remove graph and user interface elements
	 * Called when chart needs to be refreshed or cleared
	 */
	function clearCanvas() {
		
		$("#canvasContainer").empty();
				
		mCanvas = d3.select("#canvasContainer").append("svg")
					.attr("id", "canvasSVG")
					.attr("width", mCanvasWidth)
					.attr("height", DEFAULT_CANVAS_HEIGHT)
					.style("border", "1px solid lightgray")
						.append("g")
							.attr("class", "g_main")
							.attr("transform", function() {
								switch (mMode) {
									case "snapshot":
										return "translate(" + mSnapshotPaddingLeft + ", " + DEFAULT_PADDING_TOP_SNAPSHOT + ")";
									break;
									case "tracking":
										return "translate(" + DEFAULT_PADDING_LEFT_TRACKING + ", " + DEFAULT_PADDING_TOP_TRACKING + ")";
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
	
	function getCurrentIndSetName(){
		return mdsIndicators.ruleList[mCurrentIndSetIndex].name;
	}
	
	function getIndicator(){
		if (arguments.length === 0) {
			return mdsIndicators.ruleList[mCurrentIndSetIndex].rules[mCurrentIndicator];
		} else {
			return mdsIndicators.ruleList[mCurrentIndSetIndex].rules[arguments[0]];
		}
		
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
		
		addPhysicianList();

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
		
		if(mMode === "snapshot") {
			$("#dropdownMode").val("Snapshot");
		} else {
			$("#dropdownMode").val("Tracking");
		}
		
		$("#dropdownMode").change(function() {
			mMode = $(this).find(':selected').data('mode');
			updateCharts();
		});
		
		if (mArrayDates.length == 1) {
			$("#dropdownMode").prop("disabled", true);
		} else {
			$("#dropdownMode").prop("disabled", false);
		}
		
		/*
		 * Rule set dropdown
		 */
		var dropdownRules = ['<select id="dropdownRules" class="settingsDropdown">'];
		
		// Add dropdown to switch between rule sets
		for (var i=0; i<mdsIndicators.ruleList.length;i++) {
			dropdownRules.push('<option>' + mdsIndicators.ruleList[i].name + '</option>');
		}
		dropdownRules.push('</div>');
		
		$("#settings").append(dropdownRules.join('\n'));
		
		$("#dropdownRules").change(function() {
			mCurrentIndSetIndex = this.selectedIndex;
			mCurrentIndSetName = this.value;
			mCurrentIndicator = 0;
			
			mdsReader.reCalculate(mCurrentIndSetIndex, mSelectedPhysicians);
			updateDropdownIndicators();
		});
		
		$("#dropdownRules").val(getCurrentIndSetName());
		
		/*
		 * Indicator set dropdown
		 */
		updateDropdownIndicators();	
	};

	function addPhysicianList() {

		$("#selectPhysicians").empty();

		$("#selectPhysicians").append('<li id="mainSelector" class="physicianListItem selected"><span class="checkmark">\u2714</span>Select All</li>');
		// Loop through 'arrayUniquePhysicians' and create a list item for each element. These will be the physician filters that will appear in the side
		// panel. There will also be a filter for "All Selected Physicians"
		//for (var i = 0; i < Object.keys(mSelectedPhysicians).length; i++) {
		for (doc in mSelectedPhysicians) {
			$("#selectPhysicians").append('<li class="physicianListItem selected" data-docnumber="'+doc+'"><span class="checkmark">\u2714</span> Doctor Number ' + doc + '</li>');
		}
		
		//}
		
		$(".physicianListItem").click( function(){ 
			if (mCalculatedData == undefined) { 
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
				for (doc in mSelectedPhysicians) {
					if (mSelectedPhysicians.hasOwnProperty(doc)) {
						//negate the isSelected status to select/deselect the option
						mSelectedPhysicians[doc] = !isSelected;
					}
				}
				$(".physicianListItem").removeClass("selected notSelected").addClass(className);
			}
			// Otherwise, clicked on an individual doctor
			else {
				var doc = $(this).data('docnumber');//.innerHTML.substring(this.innerHTML.indexOf("Doctor") + 14, this.innerHTML.length - 7);
				mSelectedPhysicians[doc] = !isSelected;
				$(this).toggleClass('selected notSelected');
				if(allEqual(true, mSelectedPhysicians)) {
					$("#mainSelector").removeClass("selected notSelected").addClass("selected");
				} else {
					$("#mainSelector").removeClass("selected notSelected").addClass("notSelected");
				}
			}
			
			mdsReader.reCalculate(mCurrentIndSetIndex, mSelectedPhysicians);
			return false; 
	  	});
	}
	
	function updateDropdownMode() {
		if(mMode === "snapshot") {
			$("#dropdownMode").val("Snapshot");
		} else {
			$("#dropdownMode").val("Tracking");
		}
	}
	
	function saveFile(fileType) {
		
	    updateCanvasSize(true);
		
		// Append canvas to the document
		var canvasString = '<canvas id="outputCanvas" width="' + mCanvasWidth + '" height="' + DEFAULT_CANVAS_HEIGHT +
							'" style="border: 1px solid black; display:none;"></canvas>';
		
		$("#outputCanvas").remove();
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
			var splitTitle = doc.splitTextToSize(mReportTitle, 180);
			doc.text(15, 20, splitTitle);
			doc.addImage(outputURL, 'JPEG', 15, 60, 180, 100);
			
			// save() to download automatically, output() to open in a new tab
			//doc.save(mReportTitle);
			doc.output('save', mReportTitle.concat('.pdf'));
		} else {
			// Retrieve data string of the canvas and append to the hidden img element
			var outputURL = output.toDataURL();
			$("#outputImg").src = outputURL;
			// Modify attributes of hidden elements and simulate file download
			$("#outputA").download = mReportTitle;
			$("#outputA").href = outputURL;
			$("#outputA").click();
			
			output.toBlob(function(blob) {
				saveAs(blob, mReportTitle.concat('.png'));
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

		//currentRule = mdsIndicators.ruleList[mCurrentIndSetIndex].rules[currentIndicator];
		currentIndicator = getIndicator();
		if (!currentIndicator.hasOwnProperty("modifiable")) {
			return false;
		}

		var items = [];
		
		//items.push('<div id="indicatorEditor" class="pure-g">');
		items.push('<div class="pure-u-1 indicatorTitle">Modify Indicator Targets</div>');
				
		$.each(currentIndicator.modifiable, function(i, item) {
			var itemName = mdsIndicators.lookupVarNameTable[item];
			if (typeof itemName === 'undefined') {
				itemName = capitalize(item);
			}
			
			items.push('<div class="pure-u-1"><label for="' + item + '">' + itemName + '</label>');
			items.push('<br/><input id="' + item + '" class="indicatorValue" value="' + currentIndicator[item] + '"></div>'); 
		});
		
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
		for (var i = 0; i < mCalculatedData[0].length; i++) {
			if (getIndicator(i).hasOwnProperty('modifiable')) {
				dropdownIndicators.push('<option>' + mCalculatedData[0][i]["desc"] + '</option>');
			} else {
				dropdownIndicators.push('<option disabled>' + mCalculatedData[0][i]["desc"] + '</option>');
			}
		}
		dropdownIndicators.push('</select>');
		
		$("#indicatorEditor").prepend(dropdownIndicators.join('\n'));
		
		$("#dropdownIndicators")[0].selectedIndex = mCurrentIndicator;
		
		$("#dropdownIndicators").change(function() {
			clearCanvas();
			
			mCurrentIndicator = this.selectedIndex;
			addIndicatorEditor(getInternalRuleIndex());
						
 			updateCharts();
		});
	}
	
	function updateIndicator() {
		var params_updated = 0;
		
		var currentIndicator = getInternalRuleIndex();
		
		$('.indicatorValue').each(function() {
			if (isNaN(Number(this.value))) {
				mdsIndicators.ruleList[mCurrentIndSetIndex].rules[currentIndicator][this.id] = 0;
			} else {
				mdsIndicators.ruleList[mCurrentIndSetIndex].rules[currentIndicator][this.id] = this.value; 
			}
			params_updated++;
		});
		
		if (params_updated === $('.indicatorValue').length) {
			
			addIndicatorElements();
		}
	}
	
	function resetIndicator() {
		var currentIndicator = getInternalRuleIndex();
		
		mdsIndicators.resetToDefault(mdsIndicators.ruleList[mCurrentIndSetIndex].rules[currentIndicator]);
		
		addIndicatorElements();
	}
	
	function resetAllIndicators() {
		//Loop through all rules and Reset if they have a 'defaults' property			
		for (var i = 0; i < mdsIndicators.ruleList[mCurrentIndSetIndex].rules.length; i++){
			if (mdsIndicators.ruleList[mCurrentIndSetIndex].rules[i].hasOwnProperty('defaults')) {
				mdsIndicators.resetToDefault(mdsIndicators.ruleList[mCurrentIndSetIndex].rules[i]);
			}
		}
		addIndicatorElements();
	}
	
	function addIndicatorElements(){
		updateDropdownIndicators();
		
		currentIndicator = mCurrentIndicator;
		mdsReader.reCalculate(mCurrentIndSetIndex, mSelectedPhysicians);
		mCurrentIndicator = currentIndicator;
		
		addIndicatorEditor();
	}
	
	function removeIndicatorEditor(ruleIndex) {
		$("#indicatorEditor").empty();
		$("#indicatorEditor").css("display", "none");
	}
	
	function updateCharts() {
		clearCanvas();
		
		$("#canvasContainer_extra").empty();
		
		if (mMode === "tracking") {
			generateTracking();			
		} else {
			generateSnapshot(0);
		}
		addIndicatorEditor();
	}
	
	function getInternalRuleIndex() {
		if (mCalculatedData[0].length > 0) {
			return mCalculatedData[0][mCurrentIndicator].index;
		} else {
			return 0;
		}
	}
	
		
	function updateCanvasSize(redraw) {
		var prevScale = mCanvasScale;
		if (window.innerWidth >= 1024) {
			mCanvasScale = 1;
		} else if (window.innerWidth < 1024 && window.innerWidth >= 501) {
			mCanvasScale = 0.8;
		} else if (window.innerWidth < 501) {
			mCanvasScale = 0.6;
		}
		
		
		if (prevScale != mCanvasScale) {
			mCanvasWidth = Math.floor(DEFAULT_CANVAS_WIDTH*mCanvasScale);
			mGraphWidthSnapshot = Math.floor(DEFAULT_GRAPH_WIDTH_SNAPSHOT*mCanvasScale);
			mGraphWidthTracking = Math.floor(DEFAULT_GRAPH_WIDTH_TRACKING*mCanvasScale);
			mSnapshotPaddingLeft = Math.floor(DEFAULT_PADDING_LEFT_SNAPSHOT*mCanvasScale);
			mYAxisCharLength = Math.floor(DEFAULT_YAXIS_CHAR_LENGTH*mCanvasScale);
			
			if (mCanvasScale == 0.6) {
				mXAxisCharLength = 3;
			} else {
				mXAxisCharLength = 8;
			}
			
			if (redraw) {
				//$("#canvasSVG").prop("width", mCanvasWidth);
				clearCanvas();
				if (mMode === 'snapshot') {
					generateSnapshot(0);
				} else {
					generateTracking();
				}
			}
		}
	}
	
	
	function generateSnapshot(selectedDate, extraCanvas){

		//updateCanvasSize();
		
		canvas = (typeof extraCanvas !== 'undefined' ? mCanvasExtra : mCanvas);

		var data = mCalculatedData[selectedDate];

		// Add rectangles for percentage of patients within criteria
		var arrayData = [];
		var arrayDesc = [];
		var arrayTooltip = [];
		var arrayLabels = [];
		
		if (typeof(data) === undefined || data.length == 0) {
			return;
		}
		for (var i=0; i < data.length; i++) {
			if (data[i]["total"] == 0) {
				arrayLabels.push("0% (0/0)");
				continue;
			}
			var percent = data[i]["passed"] / data[i]["total"] * 100;
			var label = Math.round(percent) + "% (" + data[i]["passed"] + "/" + data[i]["total"]+ ")";
			arrayData.push(percent);
			arrayLabels.push(label);
			//If the description is really long then insert a newline.
			var desc = data[i]["desc"];
			var tooltip = data[i]["tooltip"] || "";
			/*
			if (desc.length > 32 && desc.substr(32).indexOf(" ") > -1) {
				desc = desc.replaceAt(desc.substr(32).indexOf(" ")+32, "\n");
			}
			*/
			arrayDesc.push(desc);
			arrayTooltip.push(tooltip);
		}

		xScale = d3.scale.linear()
			.domain([0, 100])
			.range([0, mGraphWidthSnapshot]);
			
		xAxis = d3.svg.axis()
			.scale(xScale)
			.orient("bottom")
			.tickFormat(function(d) { return d + "%"; });
		
		yScale = d3.scale.ordinal()
			.domain(arrayDesc)
			.rangeRoundBands([0, DEFAULT_GRAPH_HEIGHT_SNAPSHOT], 0.1);
			
		yAxis = d3.svg.axis()
			.scale(yScale)
			.orient("left");
			
		canvas.selectAll(".tickline")
			.data(xScale.ticks(10))
			.enter().append("line")
				.attr("x1", xScale)
				.attr("x2", xScale)
				.attr("y1", 0)
				.attr("y2", DEFAULT_GRAPH_HEIGHT_SNAPSHOT)
				.style("stroke", "#ccc")
				.style("stroke-width", 1)
				.style("opacity", 0.7);
			
		// Add x axis label
		canvas.append("text")
			.attr("class", "xAxisLabel")
			.attr("x", mGraphWidthSnapshot / 2)
			.attr("y", DEFAULT_GRAPH_HEIGHT_SNAPSHOT + 40)
			.attr("text-anchor", "middle")
			.style("font-weight", "bold")
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.text("% of Patients");
			
		// Add y axis label
		canvas.append("text")
			.attr("class", "yAxisLabel")
			.attr("transform", "rotate(-90)")
			.attr("x", -DEFAULT_GRAPH_HEIGHT_SNAPSHOT / 2)
			.attr("y", -mSnapshotPaddingLeft / 2 - (125 * mCanvasScale))
			.attr("text-anchor", "middle")
			.style("font-weight", "bold")
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.text( (function() {
				return getCurrentIndSetName() + " Measure"; 
			}));
		
	
		// Graph title text
		canvas.append("text")
			.attr("class", "graphTitle")
			.attr("x", mGraphWidthSnapshot / 2)
			.attr("y", -DEFAULT_PADDING_TOP_SNAPSHOT / 2 + 10)
			.attr("text-anchor", "middle")
			.style("font-size", "14px")
			.style("font-weight", "bold")
			.text(function() {
				var arraySelectedOnly = [];

				for (var doc in mSelectedPhysicians) {
					if (mSelectedPhysicians[doc] == true)
						arraySelectedOnly.push(doc);
				}
				
				if (arraySelectedOnly.length == 0) {
					return "No Doctors Selected";
				}
				
				var title = mCurrentIndSetName + " Report for Doctor";
				
				if (arraySelectedOnly.length > 1) title += "s ";
				else title += " ";
				for (var i = 0; i < arraySelectedOnly.length; i++) {
					if (i == arraySelectedOnly.length - 2)
						title += arraySelectedOnly[i] + " and ";
					else if (i == arraySelectedOnly.length - 1)	
						title += arraySelectedOnly[i];
					else title += arraySelectedOnly[i] + ", ";
				}
				var date = mArrayDates[selectedDate];
				title += " as of " + MONTH_NAMES_SHORT[date.getMonth()] + " " + date.getDate() + " " + date.getFullYear();
				title += " (n = " + mTotalPatients[selectedDate] + ")";
				//store for when saving file
				mReportTitle = title;
				return title;
			});
		
		
		//Translate graph into center of page
		canvas.append("g")
			.attr("transform", "translate(0, " + DEFAULT_GRAPH_HEIGHT_SNAPSHOT + ")")
			.style("font-family", "Arial")
			.style("font-size", "14px")
			.call(xAxis);
			
		canvas.append("g")
			.style("font-family", "Arial")
			.style("font-size", "14px")
			.attr("id", "yaxis")
			.call(yAxis);
		
	
	    canvas.selectAll('g#yaxis g text').each(function (d) {
        	var el = d3.select(this);
        	var words = d3.select(this).text();
        	var splitRegex = new RegExp(".{" + mYAxisCharLength + "}\\S*\\s+", "g");
        	var words = words.replace(splitRegex, "$&@").split(/\s+@/);
        
        	el.text('');
        	var length = 0;
        	var line = '';
	        for (var i = 0; i < words.length; i++) {
				var tspan = el.append('tspan').text(words[i]);
				if (i > 0) {
				    //Then pull all of the label up 4 units to recenter
				    el.attr('y', -10*(words.length-1));
	      			tspan.attr('x', 0).attr('y', (i)*'12').attr('dx', '-10');
	      		}
	  		}

    	});

    	/*canvas.append('foreignObject').attr('x',-150).attr('y',0)
    		.attr('width',130).attr('height', 100).append("xhtml:body")
    		.html('<div style="width:130px;">This is some information about whatever</div>');*/
				
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
		canvas.selectAll("onTargetBar")
			.data(arrayData)
			.enter().append("rect")
				.attr("class", "onTargetBar")
				.attr("width", function(d) { return xScale(d); })
				.attr("height", yScale.rangeBand())
				.attr("y", function (d, i) { return yScale(arrayDesc[i]); })
				.attr("fill", DEFAULT_COLOURS[mCurrentIndSetIndex])
				.attr("data-ruleindex", function (d, i) { return i.toString(); }) //used to select/modify current rule
				.on("click", function(d, i) {
					handleBarClick(i, this.getAttribute("y"));
					return false;
				})
				.style("stroke", "black")
				.style("stroke-width", "1px")
				.attr("shape-rendering", "crispEdges")
				.append("svg:title")
					.text(function(d, i) { return arrayTooltip[i]; });

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
				.attr("shape-rendering", "crispEdges")
				.on("click", function(d, i) {
					handleBarClick(i, this.getAttribute("y"));
					return false;
				})
				.append("svg:title")
					.text(function(d, i) { return arrayTooltip[i]; });
		
		//Labels for each bar
		canvas.selectAll("onTargetLabel")
			.data(arrayData)
			.enter().append("text")
				.attr("class", "dataLabel")
				.attr("x", function(d, i) { 
											if (d<15) { return xScale(d+10); } 
											else { return xScale(d/2);	} 
										  })
				.attr("y", function(d, i) { return yScale(arrayDesc[i]) + (yScale.rangeBand()/2); })
				.attr("text-anchor", "middle")
				.style("font-family", "Arial")
				.style("font-size", "13px")
				.attr("dy", ".35em")
				.style("fill", function(d, i) { 
												if (d<15) { return "black"; } 
												else { return "white";	} 
											  })
				.text(function(d, i) { return arrayLabels[i]; });
				
		
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
	};
	
	function handleBarClick(i, y) {
		$(".onTargetBar")
			.attr("fill", DEFAULT_COLOURS[mCurrentIndSetIndex]);
		var thisBar = $(".onTargetBar[y="+y+"]");
		thisBar.attr("fill", HIGHLIGHT_COLOURS[mCurrentIndSetIndex]);
		mCurrentIndicator = i;
		
		//var currentRule = mdsIndicators.ruleList[mCurrentIndSetIndex].rules[getInternalRuleIndex()];
		var currentIndicator = getIndicator();
		if (currentIndicator.hasOwnProperty("modifiable")) {
			addIndicatorEditor();
		} else {
			removeIndicatorEditor();
		}
	}
	
	function generateTracking() {
		var arrayDates = mArrayDates;

		var arrayData = [];
		var arrayDesc = [];
		var arrayLabels = [];
		
		for (var i=0; i < mCalculatedData.length; i++) {
			arrayData.push([]);
			arrayDesc.push([]);
			arrayLabels.push([]);
			for (var j=0; j < mCalculatedData[i].length; j++) {
				if (mCalculatedData[i][j]["total"] == 0) {
					arrayLabels[i].push("0% (0/0)");
					continue;
				}
				var percent = mCalculatedData[i][j]["passed"] / mCalculatedData[i][j]["total"] * 100;
				var label = Math.round(percent) + "% (" + mCalculatedData[i][j]["passed"] + "/" + mCalculatedData[i][j]["total"]+ ")";

				arrayData[i].push(percent);
				arrayLabels[i].push(label);
				arrayDesc[i].push(mCalculatedData[i][j]["desc"]);
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
		
		
		// Create the scale for the X axis
		xScale = d3.time.scale()
			.domain([minDate, maxDate])
			.range([0, mGraphWidthTracking]);
			
		// To do: better date format
		xAxis = d3.svg.axis()
			.scale(xScale)
			.orient("bottom")
			.tickFormat(d3.time.format("%b %Y"));
	
		// Create Y Axis scale
		yScale = d3.scale.linear()
			.domain([0, 100])
			.range([DEFAULT_GRAPH_HEIGHT_TRACKING, 0]);
			
		yAxis = d3.svg.axis()
			.scale(yScale)
			.orient("left");
			
		// Create and append ticklines for the xAxis
		mCanvas.selectAll(".xTickLine")
			.data(arrayData)
			.enter().append("line")
				.attr("class", "tickLine xTickLine")
				.attr("x1", function (d, i) { return xScale(arrayDates[i]); })
				.attr("x2", function (d, i) { return xScale(arrayDates[i]); })
				.attr("y1", 0)
				.attr("y2", DEFAULT_GRAPH_HEIGHT_TRACKING)
				.style("opacity", 0.7)
				.style("stroke", "#cccccc")
				.style("stroke-width", "1px");
	
		// Create and append ticklines for the yAxis
		mCanvas.selectAll(".yTickLine")
			.data(yScale.ticks(10))
			.enter().append("line")
				.attr("class", "tickLine yTickLine")
				.attr("x1", 0)
				.attr("x2", mGraphWidthTracking)
				.attr("y1", yScale)
				.attr("y2", yScale)
				.style("opacity", 0.7)
				.style("stroke", "#cccccc")
				.style("stroke-width", "1px");
		
		// Append xAxis to the mCanvas
		mCanvas.append("g")
			.attr("class", "xAxis")
			.attr("transform", "translate(0, " + DEFAULT_GRAPH_HEIGHT_TRACKING + ")")
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.call(xAxis);
			
		var insertLinebreaks = function (d) {
        	var el = d3.select(this);
        	var words = d3.select(this).text();
        	var splitRegex = new RegExp(".{" + mXAxisCharLength + "}\\S*\\s+", "g");
        	var words = words.replace(splitRegex, "$&@").split(/\s+@/);
        
        	el.text('');
        	var length = 0;
        	var line = '';
	        for (var i = 0; i < words.length; i++) {
				var tspan = el.append('tspan').text(words[i]);
				if (i > 0)
	      			tspan.attr('x', 0).attr('dy', '15');
	  		}
    	};
	
	    mCanvas.selectAll('g.xAxis g text').each(insertLinebreaks);
					
		// Append yAxis to the mCanvas
		mCanvas.append("g")
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
		mCanvas.selectAll(".dataPointConnector")
			.data(new Array(arrayData.length - 1))
			.enter().append("line")
				.attr("class", "dataPointConnector")
				.attr("x1", function (d, i) { return xScale(arrayDates[i]); })
				.attr("x2", function (d, i) { return xScale(arrayDates[i + 1]); })
				.attr("y1", function (d, i) { return yScale(arrayData[i][mCurrentIndicator]); })
				.attr("y2", function (d, i) { return yScale(arrayData[i + 1][mCurrentIndicator]); })
				.attr("stroke", DEFAULT_COLOURS[mCurrentIndSetIndex])
				.attr("stroke-width", 2);
		
		// Append data points
		mCanvas.selectAll(".dataPoint")
			.data(arrayData)
			.enter().append("circle")
				.attr("class", "dataPoint")
				.attr("cx", function (d, i) { return xScale(arrayDates[i]); })
				.attr("cy", function(d, i) { return yScale(arrayData[i][mCurrentIndicator]); })
				.attr("r", 5)
				.attr("fill", DEFAULT_COLOURS[mCurrentIndSetIndex])
				.on("mouseover", function(d) {
					d3.select(this)
						.attr("r", 7)
						.style("fill", HIGHLIGHT_COLOURS[mCurrentIndSetIndex]);
				})
				.on("mouseout", function(d) {
					d3.select(this)
						.attr("r", 5)
						.style("fill", DEFAULT_COLOURS[mCurrentIndSetIndex]);
				})
				.on("click", function(d, i) {
					d3.selectAll(".dataPoint")
						.attr("class", "dataPoint")
						.attr("r", 5)
						.style("fill", DEFAULT_COLOURS[mCurrentIndSetIndex])
						.on("mouseout", function(d) {
							d3.select(this)
								.attr("r", 5)
								.style("fill", DEFAULT_COLOURS[mCurrentIndSetIndex]);
						});
					d3.select(this).attr("class", "dataPoint selected")
									.attr("r", 7)
									.style("fill", HIGHLIGHT_COLOURS[mCurrentIndSetIndex])
									.on("mouseout", function() {});
									
					mCurrentDateIndex = i;
					generateExtraCanvas();
				});
				
		// Add x axis label
		mCanvas.append("text")
			.attr("class", "xAxisLabel")
			.attr("x", mGraphWidthTracking / 2)
			.attr("y", DEFAULT_GRAPH_HEIGHT_TRACKING + 40)
			.attr("text-anchor", "middle")
			.style("font-weight", "bold")
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.text("Date");
		
		// Add y axis label
		mCanvas.append("text")
			.attr("class", "yAxisLabel")
			.attr("transform", "rotate(-90)")
			.attr("x", -DEFAULT_GRAPH_HEIGHT_TRACKING / 2)
			.attr("y", -DEFAULT_PADDING_LEFT_TRACKING / 2)
			.attr("text-anchor", "middle")
			.style("font-weight", "bold")
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.text("% of patients");
			
		// Add graph title
		mCanvas.append("text")
			.attr("class", "graphTitle")
			.attr("x", mGraphWidthTracking / 2)
			.attr("y", -DEFAULT_PADDING_TOP_TRACKING / 2)
			.attr("text-anchor", "middle")
			.style("font-size", "14px")
			.style("font-family", "sans-serif")
			.style("font-weight", "bold")
			.text(function() {
				var indicator = mCalculatedData[0][mCurrentIndicator].desc;
				var title = indicator + " for Doctor";
				var arraySelectedOnly = [];

				for (var doc in mSelectedPhysicians) {
					if (mSelectedPhysicians[doc] == true)
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
				mReportTitle = title;
				return title;
			});
		
		// Add labels for data points
		mCanvas.selectAll(".dataLabel")
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
							if (arrayData[1][0] >= arrayData[i][mCurrentIndicator])
								return yScale(arrayData[i][mCurrentIndicator]) + 25;
							else return yScale(arrayData[i][mCurrentIndicator]) - 15;
						}
						// For last point, compare with second last point
						else if (i == arrayData.length - 1) {
							if (arrayData[arrayData.length - 2][0] >= arrayData[i][mCurrentIndicator])
								return yScale(arrayData[i][mCurrentIndicator]) + 25;
							else return yScale(arrayData[i][mCurrentIndicator]) - 15;
						}
						// Else all points in between, check both sides
						else {
							// If both adjacent points are above, place below
							if (arrayData[i - 1][0] >= arrayData[i][mCurrentIndicator] && arrayData[i + 1][0] >= arrayData[i][mCurrentIndicator])
								return yScale(arrayData[i][mCurrentIndicator]) + 25;
							// Else if both are below, place above	
							else if (arrayData[i - 1][0] < arrayData[i][mCurrentIndicator] && arrayData[i + 1][0] < arrayData[i][mCurrentIndicator])
								return yScale(arrayData[i][mCurrentIndicator]) - 15;
							// Else just place above
							else return yScale(arrayData[i][mCurrentIndicator]) - 15;
						}
					}
				}) 
				.attr("text-anchor", "middle")
				.style("fill", "black")
				.style("font-size", "13px")
				.style("font-family", "Arial")
				.text(function(d, i) { 
					return arrayLabels[i][mCurrentIndicator];
				});
				
		if (mCanvasExtra != null) {
			generateExtraCanvas();
		}
	};
	
	function generateExtraCanvas() {
		
		var canvas = $("#canvasContainer_extra");
		//Empty the extra canvas
		canvas.empty();
		
		//Recreate the extra canvas
		mCanvasExtra = d3.select("#canvasContainer_extra").append("svg")
			.attr("id", "canvasSVGExtra")
			.attr("width", mCanvasWidth)
			.attr("height", DEFAULT_CANVAS_HEIGHT)
			.style("border", "1px solid lightgray")
				.append("g")
					.attr("class", "g_main")
					.attr("transform", "translate(" + mSnapshotPaddingLeft + ", " + DEFAULT_PADDING_TOP_SNAPSHOT + ")");

		//mMode = "snapshot";
		//clearCanvas();
		//$("#dropdownIndicators").hide();
		//Add the snapshot graph to the extra canvas
		generateSnapshot(mCurrentDateIndex, true); //todo need this and "this"
		
		//Scroll to the new canvas
		if (!canvas.inViewport() && mFirstScrollView) {
			canvas.scrollView();
			mFirstScrollView = false;
		}
		//	$("#canvasContainer_extra").scrollView();
	}
	
	function toggleDataLabels() {
			// Find data labels
		if (d3.selectAll(".dataLabel")[0].length > 0) 
			d3.selectAll(".dataLabel").remove();
		else {
			
			var arrayData = [];
			var arrayDesc = [];
			var arrayLabels = [];

			if (mMode === "snapshot") {
				var data = mCalculatedData[0];
			
				for (var i=0; i < data.length; i++) {
					if (data[i]["total"] == 0) {
						arrayLabels.push("0% (0/0)");
						continue;
					}
					var percent = data[i]["passed"] / data[i]["total"] * 100;
					arrayData.push(percent);
					
					var label = Math.round(percent) + "% (" + data[i]["passed"] + "/" + data[i]["total"]+ ")";
					arrayLabels.push(label);
					
					arrayDesc.push(data[i]["desc"]);
				}
				if (arrayData.length == 0) {
					return;
				}
			
				mCanvas.selectAll("onTargetLabel")
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
						.text(function(d, i) { return arrayLabels[i]; });
				
				mCanvas.selectAll("offTargetLabel")
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

				for (var i=0; i < mCalculatedData.length; i++) {
					arrayData.push([]);
					arrayDesc.push([]);
					arrayLabels.push([]);
					
					for (var j=0; j < mCalculatedData[i].length; j++) {
						if (mCalculatedData[i][j]["total"] == 0) {
							arrayLabels[i].push("0% (0/0)");
							continue;
						}
						var percent = Math.round(mCalculatedData[i][j]["passed"] / mCalculatedData[i][j]["total"] * 100);
						arrayData[i].push(percent);
						
						var label = Math.round(percent) + "% (" + mCalculatedData[i][j]["passed"] + "/" + mCalculatedData[i][j]["total"]+ ")";
						arrayLabels[i].push(label);
						
						arrayDesc[i].push(mCalculatedData[i][j]["desc"]);
					}
				}
				if (arrayData.length == 0) {
					return;
				}
								
				mCanvas.selectAll(".dataLabel")
					.data(arrayData)
					.enter().append("text")
						.attr("class", "dataLabel")
						.attr("x", function(d, i) { return xScale(mArrayDates[i]); })
						.attr("y", function(d, i) { return yScale(arrayData[i][mCurrentIndicator]) - 15; }) // 15 pixels above data point
						.attr("text-anchor", "middle")
						.style("fill", "black")
						.style("font-size", "13px")
						.style("font-family", "Arial")
						.text(function(d, i) { 
							return arrayLabels[i][mCurrentIndicator];
						});
			}
		}
	};
	
	return {
		generateCharts: generateCharts,
		clearCanvas: clearCanvas,
		mode: mMode
	};
	
})();
