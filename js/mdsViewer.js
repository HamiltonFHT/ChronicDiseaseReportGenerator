/*
	Chronic Disease Report Generator - Web based reports on quality of care standards
    Copyright (C) 2015  Brice Wong, Tom Sitter, Kevin Lin - Hamilton Family Health Team

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
	var mCanvasSnapshot = d3.select("#canvasContainer_snapshot").select("#canvasSVG");;
	
	var mMode = ""; //either "snapshot" or "tracking"
	var mDataLabels = true; //either true or false (not currently used)
	var mShowAverages = true; //LHIN Averages
	var mShowHFHTAverages = true; //HFHT Averages
	var mShowTargets = true; //HFHT Targets
	var mReportTitle = ""; //Main chart title - used when saving images or PDFs
	var mCalculatedData = null; // indicator result data set from mdsIndicators
	var mSelectedPhysicians = {}; // selected physicians object [{docnumber: true/false}, ...]
	var mArrayDates = null; //array of dates [date, date, ...]
	var mTotalPatients = null; //# of patient records in file
	var mCurrentIndSetIndex = 0; // current rule set index
	var mCurrentIndSetName = ""; // current rule set name
	var mCurrentIndicator = 0;       // current indicator
	var mCurrentDateIndex = 0; //current selected date when in tracking mode
	var xScaleSnapshot, yScaleSnapshot, xAxisSnapshot, yAxisSnapshot;
	var xScaleTracking, yScaleTracking, xAxisTracking, yAxisTracking;

	//Static variables to handle graph dimensions and colors
	var DEFAULT_CANVAS_WIDTH = 940;
	var IMAGE_CANVAS_WIDTH = 752;
	var mCanvasScale = 1;
	var mCanvasWidth = DEFAULT_CANVAS_WIDTH * mCanvasScale;  		// pixels
	var DEFAULT_CANVAS_HEIGHT = 480;    	// pixels
	var mCanvasHeight = DEFAULT_CANVAS_HEIGHT;

	
	var DEFAULT_PADDING_LEFT_SNAPSHOT = 250;
	var mSnapshotPaddingLeft = DEFAULT_PADDING_LEFT_SNAPSHOT * mCanvasScale;
	var DEFAULT_PADDING_TOP_SNAPSHOT = 50;
	
	var DEFAULT_GRAPH_WIDTH_SNAPSHOT = DEFAULT_CANVAS_WIDTH - DEFAULT_PADDING_LEFT_SNAPSHOT - 25;
	var DEFAULT_BAR_WIDTH = 50;
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
							"sandybrown", "forestgreen", "goldenrod", "darkslateblue", "firebrick",
							 "palevioletred", "sienna", "bisque"];
							
	var HIGHLIGHT_COLOURS = ["lightcoral", "#90B4D2", "#CCE698", "#DFD4F4", "#AFCED0",
							 "#FAD2B0", "#90C590", "lightcoral","steelblue" , "lightcoral"];

	var MONTH_NAMES = [ "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December" ];
    var MONTH_NAMES_SHORT = [ "Jan", "Feb", "Mar", "Apr", "May", "June",
    "July", "Aug", "Sept", "Oct", "Nov", "Dec" ];

    //Whether the file has a "Rostered" field, 
    //used to check whether to make a "Rostered Patients Only" checkbox
	var hasRosteredField = false;    
	var mRosteredOnly = true;

	var resizeTimer;
	
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
		return $(this).position().top + $(this).height()/3 
				< (window.innerHeight || document.documentElement.clientHeight) + $(window).scrollTop();
	};

	//Check if two objects have the same keys and values
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
	        	return false;
	        }
	        if (!(b[propName] === a[propName])) {
	        	return false;
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
		//mCurrentIndicator = 0;
				

		$("#canvasContainer_snapshot").empty();
		$("#canvasContainer_histogram").empty();

		if (mCalculatedData == undefined) {
			console.log("no calculated data!");
			return;
		}
		
		if ($("#settings").children().length === 0) {
			//addUserInterface();   TPS
		} else if (isNewFile) {
			addPhysicianList();
			mCurrentDateIndex = 0;
		}


		clearCanvas();
		updateCanvasSize();
		addUserInterface();
		if ($('#indicatorEditor').is(':empty')) {
			addIndicatorEditor();
		}

		if (mMode === "snapshot") {
			//calculatedData = calculatedData[0];
			//$("#dropdownIndicators").hide();
			generateSnapshot(0);
			histogram();
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
				addIndicatorEditor();
								
				generateTracking();
			} else {
				alert("No data found in these files for the " + $("#dropdownRules").val() + " rule set");
			}
		}
		
		
		
		$("#dropdownRules").val(getCurrentIndSetName());


		//Turn on canvas resizing
		window.onresize = function(){
		    if (resizeTimer){
		        clearTimeout(resizeTimer);
		    } 
		    resizeTimer = setTimeout(function(){
		        updateCanvasSize(true);
		        }, 250);
		};
	};

	/*
	 * Remove graph and user interface elements
	 * Called when chart needs to be refreshed or cleared
	 */
	function clearCanvas() {
		//Only applies to snapshot mode
		mCanvasHeight = Math.floor(DEFAULT_BAR_WIDTH * mCalculatedData[mCurrentDateIndex].length  + (2*DEFAULT_PADDING_TOP_SNAPSHOT))

		$("#canvasContainer").empty();
				
		mCanvas = d3.select("#canvasContainer").append("svg")
					.attr("id", "canvasSVG")
					.attr("width", mCanvasWidth)
					.attr("height", mMode == 'snapshot' ? mCanvasHeight : DEFAULT_CANVAS_HEIGHT)
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
			return mdsIndicators.ruleList[mCurrentIndSetIndex].rules[getInternalRuleIndex()];
		} else {
			return mdsIndicators.ruleList[mCurrentIndSetIndex].rules[arguments[0]];
		}
	}

	function getIndicatorSet(){
		if (arguments.length === 0) {
			return mdsIndicators.ruleList[mCurrentIndSetIndex].rules;
		} else {
			return mdsIndicators.ruleList[arguments[0]].rules;
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
		$("#settings").empty();
	
		// Adding a panel section for selecting physicians
		$("#settings").append('<ul id="selectPhysicians"></ul>' +
							  '<div id="dropdowns"></div>' +
							  '<div id="actionButtons"></div>');
		
		addPhysicianList();

		// Save to PNG
		var btnSaveImage = '<button class="pure-button actionButton" id="btnSaveImage"><i class="fa fa-file-image-o"></i> Save as image</button>';
		$("#actionButtons").append(btnSaveImage);
		$("#btnSaveImage").unbind();
		$("#btnSaveImage").click(function() { saveFile('image'); });
		

		var btnSavePDF = '<button class="pure-button actionButton" id="btnSavePDF"><i class="fa fa-file-pdf-o"></i> Save as PDF</button>';
		$("#actionButtons").append(btnSavePDF);
		$("#btnSavePDF").unbind();
		$("#btnSavePDF").click(function() {	saveFile('pdf'); });
				

		var btnDownloadPatients = '<button class="pure-button actionButton" id="btnDownloadPatients"><i class="fa fa-file-text"></i> Download Patient Info</button>'
		$("#actionButtons").append(btnDownloadPatients);
		$("#btnDownloadPatients").unbind();
		$("#btnDownloadPatients").click(function() {
			var indicator = getIndicator();
			var cols = indicator.col.slice();
			
			//Remove current date from indicator columns
			var hasCurrentDate = $.inArray("Current Date", cols);
			if (hasCurrentDate >= 0) {
				cols.splice(hasCurrentDate, 1 );
			}
			
			//get the data
			var data = mdsReader.getData()[mCurrentDateIndex];

			//store it once in a variable
			var currentDate = data["Current Date"][0];

			//Add patient ID to patient list
			var patientList = {}
			patientList['PatientID'] = data['Patient #'];

						
			for (var i in cols) {
				patientList[cols[i]] = data[cols[i]];
			}


			var patientsIndex = mCalculatedData[mCurrentDateIndex][mCurrentIndicator].passedIndex;

			var csvPatientList = [];

			for (var r=0; r < patientsIndex.length; r++) {
				//Skip patients who are meeting criteria
				if (patientsIndex[r] === true)
					continue

				//Store information for patients not meeting criteria
				var row = [];
				row.push(patientList["PatientID"][r]);
				for (var i in cols) {
					// Remove any commas in text such as dates
					row.push(patientList[cols[i]][r].replace(",", ""));
				}
				csvPatientList.push([row.join(", ")]);
			}

			var message = [];
			message.push(indicator.desc());
			message.push("Data Extracted On: " + currentDate);
			var header = ["Patient ID"];
			for (var h in cols) {
				header.push(cols[h]);
			}
			message.push(header.join(", "));

			for (var p in csvPatientList) {
				message.push(csvPatientList[p].toString());
			}

			var text = new Blob([message.join("\n")], {type:'text/plain'});

			saveAs(text, 'patientList.csv');
		});

		// Toggle data labels
		var btnToggleLabels = '<button class="pure-button actionButton" id="btnToggleLabels"><i class="fa fa-check-square-o"></i> Toggle data labels</button>';
		$("#actionButtons").append(btnToggleLabels);
		$("#btnToggleLabels").unbind();
		$("#btnToggleLabels").click(function() {
			toggleDataLabels();
			$(this).find("i").toggleClass("fa-check-square-o fa-square-o");
			return false;
		});


		/*
		 * Rule set dropdown
		 */
		var dropdownRules = ['<select id="dropdownRules" class="settingsDropdown">'];
		
		// Add dropdown to switch between rule sets
		for (var i=0; i<mdsIndicators.ruleList.length;i++) {
			dropdownRules.push('<option>' + mdsIndicators.ruleList[i].name + '</option>');
		}
		dropdownRules.push('</div>');
		
		$("#dropdowns").append(dropdownRules.join('\n'));
		
		$("#dropdownRules").change(function() {
			mCurrentIndSetIndex = this.selectedIndex;
			mCurrentIndSetName = this.value;
			mCurrentIndicator = 0;
			
			mdsReader.reCalculate(mCurrentIndSetIndex, mSelectedPhysicians);
			addIndicatorEditor();
		});
		
		$("#dropdownRules").val(getCurrentIndSetName());
		
		/*
		 * Indicator set dropdown
		 */
		//updateDropdownIndicators();	

		// Add dropdown for EMR
		var dropdownEMR = '<select id="dropdownEMR">' +
					'<option value="PSS">PSS</option>' +
					'<option value="Oscar">Oscar</option>' +
					'</select>';
		$("#dropdowns").append(dropdownEMR);

		// Create change function
		$("#dropdownEMR").change(function() {
			mdsIndicators.setEMR(this.value);
			mdsReader.reCalculate(mCurrentIndSetIndex, mSelectedPhysicians);
		});


		//Set the selected EMR in the dropdown based on which is selected
		$("#dropdownEMR").val(mdsIndicators.getEMR());

		//Add a checkbox to allow user to filter only rostered patients if that column exists.
		//mdsReader has public variable that records whether this column exists
		//If checked, tell mdsIndicators that the user only wants rostered patients
		if (hasRosteredField) {
			var rostered = ' <input type="checkbox" id="rostered">' +
							'Rostered Patients Only' +
							'</input>';
			$("#dropdowns").append(rostered);
			$("#rostered").prop("checked", mRosteredOnly);

			$("#rostered").change(function() {
				mRosteredOnly = $(this).is(':checked');
				mdsReader.reCalculate(mCurrentIndSetIndex, mSelectedPhysicians);
			});
		}
	};

	function addPhysicianList() {

		$("#selectPhysicians").empty();

		var selected = allEqual(true, mSelectedPhysicians) ? "selected" : "notSelected";

		$("#selectPhysicians").append('<li id="mainSelector" class="physicianListItem ' + selected + '"><span class="checkmark">\u2714</span>Select All</li>');
		// Loop through 'arrayUniquePhysicians' and create a list item for each element. These will be the physician filters that will appear in the side
		// panel. There will also be a filter for "All Selected Physicians"
		//for (var i = 0; i < Object.keys(mSelectedPhysicians).length; i++) {
		for (doc in mSelectedPhysicians) {
			var selected = mSelectedPhysicians[doc] == true ? "selected" : "notSelected";
			$("#selectPhysicians").append('<li class="physicianListItem ' + selected + '" data-docnumber="'+doc+'"><span class="checkmark">\u2714</span> Doctor Number ' + doc + '</li>');
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
				var doc = $(this).data('docnumber');
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

	/**
	 * Saves current chart to either PDF or PNG
	 * @param  {String} fileType Either 'pdf' or 'image'
	 * @return {boolean}         Always false - required for jQuery callback
	 */
	function saveFile(fileType) {
		
		//Second true means that we are forcing it to be "MEDIUM" sized
	    updateCanvasSize(true, "MEDIUM");
		
		// Append canvas to the document
		var canvasHeight = (mMode == 'snapshot' ? mCanvasHeight : DEFAULT_CANVAS_HEIGHT)

		var canvasString = '<canvas id="outputCanvas" width="' + IMAGE_CANVAS_WIDTH + '" height="' + canvasHeight +
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
			var titleSpacing;
			if (splitTitle[0].length >= 55) {
				titleSpacing = 10;
			} else {
				titleSpacing = 60-(splitTitle[0].length/2);
			}
			doc.text(titleSpacing, 20, splitTitle);
			
			//doc.addImage(outputURL, 'JPEG', 15, 60, 180, 100);
			doc.addImage(outputURL, 'JPEG', 15, 60, mCanvasWidth*0.2, canvasHeight*0.2);
			
			// save() to download automatically, output() to open in a new tab
			//doc.save(mReportTitle.concat('.pdf'));
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
		
		//Restore canvas to previous size (if it changed)
		updateCanvasSize(true);

		//For jQuery callback
		return false;
	}
	
	function addIndicatorEditor() {

		function capitalize(s){
			return s.toLowerCase().replace( /\b./g, function(a){ return a.toUpperCase(); } );
		};
			
		//Reset indicator editor bar
		removeIndicatorEditor();

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
		
		items.push('<div style="padding-top:15px;" class="pure-u-1-2"><button id="applybtn" class="pure-button actionButton">Apply Changes</button></div>');
		items.push('<div class="pure-u-1-2" style="padding-top:15px;"><button style="float:right" id="resetbtn" class="pure-button actionButton">Reset</button></div>');
		items.push('<div class="pure-u-1"><button id="resetallbtn" class="pure-button actionButton">Reset All</button></div>');
		$("#indicatorEditor").append(items.join(''));
		
		
		$("#indicatorEditor .indicatorValue").bind('keypress', function(e) {
			var code = e.keyCode || e.which;
			if(code == 13) {
				updateIndicator();
			}
		});
		
		$("#applybtn").unbind("click")
						.click( function() { updateIndicator();} );
		
		$("#resetbtn").unbind("click")
						.click( function() { resetIndicator();} );
		
		$("#resetallbtn").unbind("click")
							.click( function() { resetAllIndicators();} );
			
		$("#indicatorEditor").css("display", "block");
		
		updateDropdownIndicators();
	}

	//Remove and re-add indicator dropdown using indicators in mCalculatedData
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
			if (getIndicator(getInternalRuleIndex(i)).hasOwnProperty('modifiable')) {
				dropdownIndicators.push('<option>' + mCalculatedData[0][i]["desc"] + '</option>');
			} else {
				dropdownIndicators.push('<option disabled>' + mCalculatedData[0][i]["desc"] + '</option>');
			}
		}
		dropdownIndicators.push('</select>');
		
		$("#indicatorEditor").prepend(dropdownIndicators.join('\n'));
		
		$("#dropdownIndicators")[0].selectedIndex = mCurrentIndicator;
		
		$("#dropdownIndicators").change(function() {
			mCurrentIndicator = this.selectedIndex;
			updateCharts();
		});
	}
	
	// Update indicators with values from indicator editor
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
			
			recalculateIndicators();
		}
	}
	
	//Call reset on the currently selected indicator
	function resetIndicator() {
		//var currentIndicator = getInternalRuleIndex();
		
		mdsIndicators.resetToDefault(getIndicator());
		
		recalculateIndicators();
	}
	
	function resetAllIndicators() {

		var indicators = getIndicatorSet();
		//Loop through all rules and Reset if they have a 'defaults' property			
		for (var i = 0; i < indicators.length; i++){
			if (indicators[i].hasOwnProperty('defaults')) {
				mdsIndicators.resetToDefault(indicators[i]);
			}
		}
		recalculateIndicators();
	}

	//Re-add dropdown with indicators
	//Recalculate graph, preserving currently selected indicator
	//Re-add indicator editor
	function recalculateIndicators(){

		var currentIndicator = mCurrentIndicator;
		mdsReader.reCalculate(mCurrentIndSetIndex, mSelectedPhysicians);
		mCurrentIndicator = currentIndicator;
		
		addIndicatorEditor();
	}
	
	function removeIndicatorEditor() {
		$("#indicatorEditor").empty();
		$("#indicatorEditor").css("display", "none");
	}
	
	function updateCharts() {
		clearCanvas();
		
		$("#canvasContainer_snapshot").empty();
		$("#canvasContainer_histogram").empty();
		
		if (mMode === "tracking") {
			generateTracking();			
		} else {
			generateSnapshot(0);
			histogram();
		}
		addIndicatorEditor();
	}
	
	function getInternalRuleIndex() {
		if (mCalculatedData[0].length > 0 && mCurrentIndicator < mCalculatedData[0].length) {
			return mCalculatedData[0][mCurrentIndicator].index;
		} else {
			return 0;
		}
	}
		
	/**
	 * Updates dimensions of drawing canvas based on window size or 
	 * input parameters and redraws it
	 * @param  {boolean} redraw     	Clears and redraws canvas if true
	 * @param  {boolean} canvasSize 	One of ["SMALL", "MEDIUM", "LARGE"] to set canvas size manually
	 * @return 							Nothing
	 */
	function updateCanvasSize(redraw, canvasSize) {
		var prevScale = mCanvasScale;
		var small = 0.6;
		var medium = 0.8;
		var large = 1;

		if (arguments.length === 2) {
			switch(canvasSize){
				case "LARGE":
					mCanvasScale = large;
					break;
				case "MEDIUM":
					mCanvasScale = medium;
					break;
				case "SMALL":
					mCanvasScale = small;
					break;
				default:
					mCanvasScale = medium;
			}	
		}
		else {
			if (window.innerWidth >= 960) {
			mCanvasScale = large;
			} else if (window.innerWidth < 960 && window.innerWidth >= 780) {
				mCanvasScale = medium;
			} else if (window.innerWidth < 780) {
				mCanvasScale = small;
			}
		}
		
		if (prevScale != mCanvasScale) {
			mCanvasWidth = Math.floor(DEFAULT_CANVAS_WIDTH*mCanvasScale);
			mGraphWidthSnapshot = Math.floor(DEFAULT_GRAPH_WIDTH_SNAPSHOT*mCanvasScale);
			mGraphWidthTracking = Math.floor(DEFAULT_GRAPH_WIDTH_TRACKING*mCanvasScale);
			mSnapshotPaddingLeft = Math.floor(DEFAULT_PADDING_LEFT_SNAPSHOT*mCanvasScale);
			mYAxisCharLength = Math.floor(DEFAULT_YAXIS_CHAR_LENGTH*mCanvasScale);
			
			if (redraw) {
				clearCanvas();
				if (mMode === 'snapshot') {
					generateSnapshot(0);
					histogram();
				} else {
					generateTracking();
				}
			}
		}
	}


	function splitText(textElement, lineLength, title) {
		var isTitle = typeof title !== 'undefined' ? true : false;

    	var text = textElement.text();
    	var splitRegex = new RegExp(".{" + lineLength + "}\\S*\\s+", "g");
    	var splitText= text.replace(splitRegex, "$&@").split(/\s+@/);
    
    	var numLines = splitText.length;

    	textElement.text('').attr('y', '0');
    	for (var i = 0; i < splitText.length; i++) {
			var tspan = textElement.append('tspan').text(splitText[i]);
			if (isTitle) {
			    textElement.attr('y', -25);
  				tspan.attr('y', '-8').attr('x',mCanvasWidth/2 - splitText[i].length).attr("style","text-anchor:middle");
  			} else {
  				switch (splitText.length) {
  					case 2:
  						if (i==0) {tspan.attr('x', 0).attr('y', -6).attr('dx', '-10');}
  						else {tspan.attr('x', 0).attr('y', 12).attr('dx', '-10');}
  						break;
					case 3:
						if (i==0) {tspan.attr('x', 0).attr('y', -14).attr('dx', '-10');}
						else if (i==1) {tspan.attr('x', 0).attr('y', 4).attr('dx', '-10');}
						else {tspan.attr('x', 0).attr('y', 18).attr('dx', '-10');}
						break;
					default:
						tspan.attr('x', 0).attr('dx', '-10');
  				}
  			}
  		}
	}
	

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
	

	/**
	 * Creates a bar chart for a report file
	 * @param  {numeric} selectedDate	Index into array of file dates, used to select which file to create the barchart. 0 for one file.
	 * @param  {boolean} extraCanvas  	true if the bar chart should go in the secondary canvas, false or undefined to go into the main canvas
	 */
	function generateSnapshot(selectedDate, extraCanvas){

		var selectedDate = selectedDate || 0;
		var canvas = (typeof extraCanvas === "undefined" ? mCanvas : mCanvasSnapshot);

		var data = mCalculatedData[selectedDate];

		if (data.length === 0) {
			removeIndicatorEditor();
			return;
		}

		var mGraphHeight = DEFAULT_BAR_WIDTH * data.length;

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
				arrayData.push(0)
			} else {
				var percent = data[i]["passed"] / data[i]["total"] * 100;
				var label = Math.round(percent) + "% (" + data[i]["passed"] + "/" + data[i]["total"]+ ")";
				arrayData.push(percent);
				arrayLabels.push(label);
			}
			
			//If the description is really long then insert a newline.
			var desc = data[i]["desc"];
			var tooltip = data[i]["tooltip"] || "";

			arrayDesc.push(desc);
			arrayTooltip.push(tooltip);
		}

		xScaleSnapshot = d3.scale.linear()
			.domain([0, 100])
			.range([0, mGraphWidthSnapshot]);
			
		xAxisSnapshot = d3.svg.axis()
			.scale(xScaleSnapshot)
			.orient("bottom")
			.tickFormat(function(d) { return d + "%"; });
		
		yScaleSnapshot = d3.scale.ordinal()
			.domain(arrayDesc)
			.rangeRoundBands([0, mGraphHeight], 0.1);
			
		yAxisSnapshot = d3.svg.axis()
			.scale(yScaleSnapshot)
			.orient("left");
			
		canvas.selectAll(".tickline")
			.data(xScaleSnapshot.ticks(10))
			.enter().append("line")
				.attr("x1", xScaleSnapshot)
				.attr("x2", xScaleSnapshot)
				.attr("y1", 0)
				.attr("y2", mGraphHeight)
				.style("stroke", "#ccc")
				.style("stroke-width", 1)
				.style("opacity", 0.7);
			
		// Add x axis label
		canvas.append("text")
			.attr("class", "xAxisLabel")
			.attr("x", mGraphWidthSnapshot / 2)
			.attr("y", mGraphHeight + 40)
			.attr("text-anchor", "middle")
			.style("font-weight", "bold")
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.text("% of Patients");
			
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
				//title += " (n = " + mTotalPatients[selectedDate] + ")";
				//store for when saving file
				mReportTitle = title;
				return title;
			});
		
	
		//Translate graph into center of page
		canvas.append("g")
			.attr("transform", "translate(0, " + mGraphHeight + ")")
			.style("font-family", "Arial")
			.style("font-size", "14px")
			.call(xAxisSnapshot);
			
		//Y axis labels
		canvas.append("g")
			.attr("class", "indicatorLabel")
			.style("font-family", "Arial")
			.style("font-size", "14px")
			.attr("id", "yaxis")
			.call(yAxisSnapshot);

    	canvas.selectAll('g#yaxis g text').each(function () { splitText(d3.select(this), mYAxisCharLength); });
				
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
				.attr("width", function(d) { return xScaleSnapshot(d); })
				.attr("height", yScaleSnapshot.rangeBand())
				.attr("y", function (d, i) { return yScaleSnapshot(arrayDesc[i]); })
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
				.attr("width", function(d) { return xScaleSnapshot(100 - d); })
				.attr("height", yScaleSnapshot.rangeBand())
				.attr("x", function(d) { return xScaleSnapshot(d); })
				.attr("y", function(d, i) { return yScaleSnapshot(arrayDesc[i]); })
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


		//Display LHIN 4 Average for this indicator (if available)
		if (mShowHFHTAverages) {

			var yScaleAverages = d3.scale.linear()
				.domain([0, 100])
				.range([0, mGraphHeight]);

			var indexes = [];
			for (var i in data){
				indexes.push(data[i].index);
			}

			
			var indicatorSet = getIndicatorSet();

			var hfhtaverages = [];
			for (var i in indexes) {
				if (indicatorSet[indexes[i]].hasOwnProperty("hfhtaverage")) {
					hfhtaverages.push({"index": +i, 
										"hfhtavg": +indicatorSet[indexes[i]].hfhtaverage });
				}
			}
		
			canvas.selectAll("HFHTaverageLine")
				.data(hfhtaverages)
				.enter().append("line")
					.attr("class", "HFHTaverageLine")
					.attr("x1", function(d) { return xScaleSnapshot(100*d.hfhtavg); })
					.attr("x2", function(d) { return xScaleSnapshot(100*d.hfhtavg); })
					.attr("y1", function (d, i) { return yScaleSnapshot(arrayDesc[d.index]); })
					.attr("y2", function (d, i) { return yScaleSnapshot(arrayDesc[d.index])+yScaleSnapshot.rangeBand(); })
					.attr("stroke-width", 2)
                    .attr("stroke", "silver")
                    .append("svg:title")
						.text("HFHT Average");


			/* Continued after labels are inserted!! */
		}



		//Display LHIN 4 Average for this indicator (if available)
		if (mShowAverages) {

			var yScaleAverages = d3.scale.linear()
				.domain([0, 100])
				.range([0, mGraphHeight]);

			var indexes = [];
			for (var i in data){
				indexes.push(data[i].index);
			}

			
			var indicatorSet = getIndicatorSet();

			var averages = [];
			for (var i in indexes) {
				if (indicatorSet[indexes[i]].hasOwnProperty("average")) {
					averages.push({"index": +i, 
									"avg": +indicatorSet[indexes[i]].average });
				}
			}
		
			canvas.selectAll("averageLine")
				.data(averages)
				.enter().append("line")
					.attr("class", "averageLine")
					.attr("x1", function(d) { return xScaleSnapshot(100*d.avg); })
					.attr("x2", function(d) { return xScaleSnapshot(100*d.avg); })
					.attr("y1", function (d, i) { return yScaleSnapshot(arrayDesc[d.index]); })
					.attr("y2", function (d, i) { return yScaleSnapshot(arrayDesc[d.index])+yScaleSnapshot.rangeBand(); })
					.attr("stroke-width", 2)
                    .attr("stroke", "gold")
                    .append("svg:title")
						.text("LHIN 4 Average");


			/* Continued after labels are inserted!! */
		}


		//Display HFHT Targets for this indicator (if available)
		if (mShowTargets) {

			var yScaleAverages = d3.scale.linear()
				.domain([0, 100])
				.range([0, mGraphHeight]);

			var indexes = [];
			for (var i in data){
				indexes.push(data[i].index);
			}

			
			var indicatorSet = getIndicatorSet();

			var targets = [];
			for (var i in indexes) {
				if (indicatorSet[indexes[i]].hasOwnProperty("goal")) {
					targets.push({"index": indexes[i], 
									"goal": +indicatorSet[indexes[i]].goal });
				}
			}
		
			canvas.selectAll("targetLine")
				.data(targets)
				.enter().append("line")
					.attr("class", "targetLine")
					.attr("x1", function(d) { return xScaleSnapshot(100*d.goal); })
					.attr("x2", function(d) { return xScaleSnapshot(100*d.goal); })
					.attr("y1", function (d, i) { return yScaleSnapshot(arrayDesc[d.index]); })
					.attr("y2", function (d, i) { return yScaleSnapshot(arrayDesc[d.index])+yScaleSnapshot.rangeBand(); })
					.attr("stroke-width", 2)
                    .attr("stroke", "#CD7F32")
                    .append("svg:title")
						.text("HFHT Target");

			/* Continued after labels are inserted!! */
		}


		
		//Labels for each bar
		canvas.selectAll("onTargetLabel")
			.data(arrayData)
			.enter().append("text")
				.attr("class", "dataLabelSnapshot")
				.attr("x", function(d, i) { 
											if (d<20) { return xScaleSnapshot(d+2); } 
											else { return xScaleSnapshot(d/2);	} 
										  })
				.attr("y", function(d, i) { return yScaleSnapshot(arrayDesc[i]) + (yScaleSnapshot.rangeBand()/2); })
				.attr("text-anchor", function(d) {
											if (d<20) { return "start"; }
											else { return "middle"; } 
				})
				.style("font-family", "Arial")
				.style("font-size", "13px")
				.attr("dy", ".35em")
				.style("fill", function(d, i) { 
												if (d<20) { return "black"; } 
												else { return "white";	} 
											  })
				.text(function(d, i) { return arrayLabels[i]; });

		//Rectangles are added here so that they lay on top of the labels
		if (mShowAverages) {
						//For tooltip
			canvas.selectAll("averageRect")
				.data(averages)
				.enter().append("rect")
					.attr("class", "averageRect")
					.attr("width", xScaleSnapshot(5))
					.attr("height", yScaleSnapshot.rangeBand())
					.attr("x", function (d, i) { 
						return xScaleSnapshot(100*d.avg - 2.5); })
					.attr("y", function (d, i) { 
						return yScaleSnapshot(arrayDesc[d.index]); })
					.attr("fill", "rgba(0, 0, 0, 0)")
					.append("svg:title")
						.text("LHIN 4 Average");

		}

				//Rectangles are added here so that they lay on top of the labels
		if (mShowHFHTAverages) {
						//For tooltip
			canvas.selectAll("HFHTaverageRect")
				.data(hfhtaverages)
				.enter().append("rect")
					.attr("class", "HFHTaverageRect")
					.attr("width", xScaleSnapshot(5))
					.attr("height", yScaleSnapshot.rangeBand())
					.attr("x", function (d, i) { 
						return xScaleSnapshot(100*d.hfhtavg - 2.5); })
					.attr("y", function (d, i) { 
						return yScaleSnapshot(arrayDesc[d.index]); })
					.attr("fill", "rgba(0, 0, 0, 0)")
					.append("svg:title")
						.text("HFHT Average");

		}

		//Rectangles are added here so that they lay on top of the labels
		if (mShowTargets) {
						//For tooltip
			canvas.selectAll("targetRect")
				.data(targets)
				.enter().append("rect")
					.attr("class", "targetRect")
					.attr("width", xScaleSnapshot(5))
					.attr("height", yScaleSnapshot.rangeBand())
					.attr("x", function (d, i) { 
						return xScaleSnapshot(100*d.goal - 2.5); })
					.attr("y", function (d, i) { 
						return yScaleSnapshot(arrayDesc[d.index]); })
					.attr("fill", "rgba(0, 0, 0, 0)")
					.append("svg:title")
						.text("HFHT Targets");

		}

	}; // End of generateSnapshot
	 
	function handleBarClick(i, y) {
		var thisBar = $(".onTargetBar[y="+y+"]");
		
		var isSelected = (thisBar.attr("data-selected") == "true")
		
		$(".onTargetBar")
			.attr("fill", DEFAULT_COLOURS[mCurrentIndSetIndex])
			.attr("data-selected", "false");
			
		thisBar.attr("data-selected", "true");
		
		if (isSelected) {
			thisBar.attr("fill", DEFAULT_COLOURS[mCurrentIndSetIndex])
					.attr("data-selected", "false");
		} else {
			thisBar.attr("fill", HIGHLIGHT_COLOURS[mCurrentIndSetIndex])
					.attr("data-selected", "true");
		}
		
		mCurrentIndicator = i;
		
		histogram();

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
		xScaleTracking = d3.time.scale()
			.domain([minDate, maxDate])
			.range([0, mGraphWidthTracking]);
			
		// To do: better date format
		xAxisTracking = d3.svg.axis()
			.scale(xScaleTracking)
			.orient("bottom")
			.tickFormat(d3.time.format("%b %Y"));
	
		// Create Y Axis scale
		yScaleTracking = d3.scale.linear()
			.domain([0, 100])
			.range([DEFAULT_GRAPH_HEIGHT_TRACKING, 0]);
			
		yAxisTracking = d3.svg.axis()
			.scale(yScaleTracking)
			.orient("left");
			
		// Create and append ticklines for the xAxis
		mCanvas.selectAll(".xTickLine")
			.data(arrayData)
			.enter().append("line")
				.attr("class", "tickLine xTickLine")
				.attr("x1", function (d, i) { return xScaleTracking(arrayDates[i]); })
				.attr("x2", function (d, i) { return xScaleTracking(arrayDates[i]); })
				.attr("y1", 0)
				.attr("y2", DEFAULT_GRAPH_HEIGHT_TRACKING)
				.style("opacity", 0.7)
				.style("stroke", "#cccccc")
				.style("stroke-width", "1px");
	
		// Create and append ticklines for the yAxis
		mCanvas.selectAll(".yTickLine")
			.data(yScaleTracking.ticks(10))
			.enter().append("line")
				.attr("class", "tickLine yTickLine")
				.attr("x1", 0)
				.attr("x2", mGraphWidthTracking)
				.attr("y1", yScaleTracking)
				.attr("y2", yScaleTracking)
				.style("opacity", 0.7)
				.style("stroke", "#cccccc")
				.style("stroke-width", "1px");
		
		// Append xAxis to the mCanvas
		mCanvas.append("g")
			.attr("class", "xAxis")
			.attr("transform", "translate(0, " + DEFAULT_GRAPH_HEIGHT_TRACKING + ")")
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.call(xAxisTracking);
			
	    mCanvas.selectAll('g.xAxis g text').each(insertLinebreaks);
					
		// Append yAxis to the mCanvas
		mCanvas.append("g")
			.attr("class", "yAxis")
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.call(yAxisTracking);
		
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
				.attr("x1", function (d, i) { return xScaleTracking(arrayDates[i]); })
				.attr("x2", function (d, i) { return xScaleTracking(arrayDates[i + 1]); })
				.attr("y1", function (d, i) { return yScaleTracking(arrayData[i][mCurrentIndicator]); })
				.attr("y2", function (d, i) { return yScaleTracking(arrayData[i + 1][mCurrentIndicator]); })
				.attr("stroke", DEFAULT_COLOURS[mCurrentIndSetIndex])
				.attr("stroke-width", 2);
		
		// Append data points
		mCanvas.selectAll(".dataPoint")
			.data(arrayData)
			.enter().append("circle")
				.attr("class", "dataPoint")
				.attr("cx", function (d, i) { return xScaleTracking(arrayDates[i]); })
				.attr("cy", function(d, i) { return yScaleTracking(arrayData[i][mCurrentIndicator]); })
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
					var scroll = $(window).scrollTop();
					generateExtraCanvas();
					histogram();
					$(window).scrollTop(scroll);
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

		mCanvas.selectAll('.graphTitle').each(function () { splitText(d3.select(this), 180, true); });
		

		var m = mCurrentIndicator;
		// Add labels for data points
		mCanvas.selectAll(".dataLabelTracking")
			.data(arrayData)
			.enter().append("text")
				.attr("class", "dataLabelTracking")
				.attr("x", function(d, i) { return xScaleTracking(arrayDates[i]); })
				.attr("y", function(d, i) { 
					// If small value, place label above point
					if ((arrayData[i][m]) < 10)
						return yScaleTracking(arrayData[i][m]) - 15;
					// Else	
					else {
						// For first data point
						if (i == 0) {
							// If adjacent point is above, place label below, vice versa
							if (arrayData[1][m] >= arrayData[i][m])
								return yScaleTracking(arrayData[i][m]) + 25;
							else return yScaleTracking(arrayData[i][m]) - 15;
						}
						// For last point, compare with second last point
						else if (i == arrayData.length - 1) {
							if (arrayData[arrayData.length - 2][m] >= arrayData[i][m])
								return yScaleTracking(arrayData[i][m]) + 25;
							else return yScaleTracking(arrayData[i][m]) - 15;
						}
						// Else all points in between, check both sides
						else {
							// If both adjacent points are above, place below
							if (arrayData[i - 1][m] >= arrayData[i][m] && arrayData[i + 1][m] >= arrayData[i][m])
								return yScaleTracking(arrayData[i][m]) + 25;
							// Else if both are below, place above	
							else if (arrayData[i - 1][m] < arrayData[i][m] && arrayData[i + 1][m] < arrayData[i][m])
								return yScaleTracking(arrayData[i][m]) - 15;
							// Else just place above
							else return yScaleTracking(arrayData[i][m]) - 15;
						}
					}
				}) 
				.attr("text-anchor", "middle")
				.style("fill", "black")
				.style("font-size", "13px")
				.style("font-family", "Arial")
				.text(function(d, i) { 
					return arrayLabels[i][m];
				});
				
		if (mCanvasSnapshot != null) {
			generateExtraCanvas();
		}
	};
	
	function generateExtraCanvas() {
		
		$("#canvasContainer_histogram").empty();
		$("#canvasContainer_snapshot").empty();

		//Recreate the extra canvas
		mCanvasSnapshot = d3.select("#canvasContainer_snapshot").append("svg")
			.attr("id", "canvasSVGExtra")
			.attr("width", mCanvasWidth)
			.attr("height", mCanvasHeight)
			.style("border", "1px solid lightgray")
				.append("g")
					.attr("class", "g_main")
					.attr("transform", "translate(" + mSnapshotPaddingLeft + ", " + DEFAULT_PADDING_TOP_SNAPSHOT + ")");

		//Add the snapshot graph to the extra canvas
		if (mMode == "tracking") {
			generateSnapshot(mCurrentDateIndex, true);
			histogram();
		}

		//Scroll to the new canvas
		if (!$("#canvasContainer_snapshot").inViewport() && mFirstScrollView) {
			$("#canvasContainer_snapshot").scrollView();
			mFirstScrollView = false;
		}
		//	$("#canvasContainer_extra").scrollView();
	}
	
	function toggleDataLabels() {

		var arrayData = [];
		var arrayDesc = [];
		var arrayLabels = [];

		if (mMode === "snapshot") {
			if (d3.selectAll(".dataLabelSnapshot")[0].length > 0) {
				d3.selectAll(".dataLabelSnapshot").remove();
				return;
			} else {
				var data = mCalculatedData[0];
			
				for (var i=0; i < data.length; i++) {
					if (data[i]["total"] == 0) {
						arrayLabels.push("0% (0/0)");
						arrayData.push(0);
						arrayDesc.push(data[i]["desc"]);
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
						.attr("class", "dataLabelSnapshot")
						.attr("x", function(d, i) { 
											if (d<20) { return xScaleSnapshot(d+2); } 
											else { return xScaleSnapshot(d/2);	} 
										  })
						.attr("y", function(d, i) { return yScaleSnapshot(arrayDesc[i]) + (yScaleSnapshot.rangeBand()/2); })
						.attr("text-anchor", function(d) {
											if (d<20) { return "start"; }
											else { return "middle"; } 
						})
						.style("font-family", "Arial")
						.style("font-size", "13px")
						.attr("dy", ".35em")
						.style("fill", function(d, i) { 
												if (d<20) { return "black"; } 
												else { return "white";	} 
											  })
						.text(function(d, i) { return arrayLabels[i]; });

			}
		} else {
			if (d3.selectAll(".dataLabelTracking")[0].length > 0) {
				d3.selectAll(".dataLabelTracking").remove();
				return;
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
						var percent = mCalculatedData[i][j]["passed"] / mCalculatedData[i][j]["total"] * 100;
						arrayData[i].push(percent);
						
						var label = Math.round(percent) + "% (" + mCalculatedData[i][j]["passed"] + "/" + mCalculatedData[i][j]["total"]+ ")";
						arrayLabels[i].push(label);
						
						arrayDesc[i].push(mCalculatedData[i][j]["desc"]);
					}
				}
				if (arrayData.length == 0) {
					return;
				}
								
				var m = mCurrentIndicator;
				mCanvas.selectAll(".dataLabelTracking")
					.data(arrayData)
					.enter().append("text")
						.attr("class", "dataLabelTracking")
						.attr("x", function(d, i) { return xScaleTracking(mArrayDates[i]); })
						.attr("y", function(d, i) { 
							//Algorithm to decide whether to place the labels above or below the point
							//Essentially, if they point is less than the previous one, place the label below
							//Otherwise place it above (unless the point is very small -- ie not enough room below for label)


							// If small value, place label above point
							if ((arrayData[i][m]) < 10)
								return yScaleTracking(arrayData[i][m]) - 15;
							// Else	
							else {
								// For first data point
								if (i == 0) {
									// If adjacent point is above, place label below, vice versa
									if (arrayData[1][m] >= arrayData[i][m])
										return yScaleTracking(arrayData[i][m]) + 25;
									else return yScaleTracking(arrayData[i][m]) - 15;
								}
								// For last point, compare with second last point
								else if (i == arrayData.length - 1) {
									if (arrayData[arrayData.length - 2][m] >= arrayData[i][m])
										return yScaleTracking(arrayData[i][m]) + 25;
									else return yScaleTracking(arrayData[i][m]) - 15;
								}
								// Else all points in between, check both sides
								else {
									// If both adjacent points are above, place below
									if (arrayData[i - 1][m] >= arrayData[i][m] && arrayData[i + 1][m] >= arrayData[i][m])
										return yScaleTracking(arrayData[i][m]) + 25;
									// Else if both are below, place above	
									else if (arrayData[i - 1][m] < arrayData[i][m] && arrayData[i + 1][m] < arrayData[i][m])
										return yScaleTracking(arrayData[i][m]) - 15;
									// Else just place above
									else return yScaleTracking(arrayData[i][m]) - 15;
								}
							}
						}) 
						.attr("text-anchor", "middle")
						.style("fill", "black")
						.style("font-size", "13px")
						.style("font-family", "Arial")
						.text(function(d, i) { 
							return arrayLabels[i][m];
						});
			}
		}

	}; //end toggleDataLabels
	


	function histogram() {

		//data contains an array of values and axis label(s)
		//[ [values], label]
		//label can be an array of [x-label, y-label] or just a x-label for histograms
		//values can be 1d for histogram or 2d for a scatter plot [ [x-values], [y-values]]
		var data = mdsIndicators.getPlotData(getIndicator(), mCurrentDateIndex);

		if (data === null) {
			$("#canvasContainer_histogram").empty();
			return;
		}

		var values = data[0];
		var label = data[1];

		var svg = $("#canvasContainer_histogram");
		//Empty the extra canvas
		svg.empty();
		
		//Recreate the extra canvas
		svg = d3.select("#canvasContainer_histogram").append("svg")
			.attr("id", "canvasSVGExtra")
			.attr("width", mCanvasWidth)
			.attr("height", DEFAULT_CANVAS_HEIGHT)
			.style("border", "1px solid lightgray")
			.append("g")
				.attr("class", "g_main")
				.attr("transform", "translate(" + DEFAULT_PADDING_LEFT_TRACKING + ", " + DEFAULT_PADDING_TOP_TRACKING + ")");		
			    

		// A formatter for counts.
		var formatCount = d3.format(",.0f");

		var xScale = d3.scale.linear()
		    .domain(d3.extent(values))
		    .range([0, mGraphWidthTracking])
		    .nice();

		var xAxis = d3.svg.axis()
		    .scale(xScale)
		    .orient("bottom");

		// Generate a histogram using twenty uniformly-spaced bins.
		var histdata = d3.layout.histogram()
		    .bins(xScale.ticks(20))
		    (values);

		var yScale = d3.scale.linear()
		    .domain([0, d3.max(histdata, function(d) { return d.y; })])
		    .range([DEFAULT_GRAPH_HEIGHT_TRACKING, 0]);

		var yAxis = d3.svg.axis()
			.scale(yScale)
			.orient("left")
			.ticks(10)
			.tickFormat(d3.format("d"))
			.tickSubdivide(0);

		// Add x axis label
		svg.append("text")
			.attr("class", "xaxis xAxisLabel")
			.attr("x", mGraphWidthTracking / 2)
			.attr("y", DEFAULT_GRAPH_HEIGHT_TRACKING + 40)
			.attr("text-anchor", "middle")
			.style("font-weight", "bold")
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.text(label);
		
		// Add y axis label
		svg.append("text")
			.attr("class", "yAxisLabel")
			.attr("transform", "rotate(-90)")
			.attr("x", -DEFAULT_GRAPH_HEIGHT_TRACKING / 2)
			.attr("y", -DEFAULT_PADDING_LEFT_TRACKING / 2)
			.attr("text-anchor", "middle")
			.style("font-weight", "bold")
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.text("# of Patients");

		var date = mArrayDates[mCurrentDateIndex];
		formattedDate = MONTH_NAMES_SHORT[date.getMonth()] + " " + date.getDate() + " " + date.getFullYear();

		// Add graph title
		svg.append("text")
			.attr("class", "graphTitle")
			.attr("x", mGraphWidthTracking / 2)
			.attr("y", -DEFAULT_PADDING_TOP_TRACKING / 2)
			.attr("text-anchor", "middle")
			.style("font-size", "14px")
			.style("font-family", "sans-serif")
			.style("font-weight", "bold")
			.text(getIndicator().desc() + " as of " + formattedDate);

		//Add xaxis
	    svg.append("g")
	    	.attr("class", "xaxis")
			.attr("transform", "translate(0, " + DEFAULT_GRAPH_HEIGHT_TRACKING + ")")
			.call(xAxis);

		var barWidth = (mGraphWidthTracking / histdata.length) - 4

		// Align xaxis labels with center of bar (opposed to lefthand side)
		// This is accomplished by moving them by 1/2 the bar width
		svg.selectAll(".xaxis text")
			.attr("dx", barWidth / 2);


		//Add yaxis
		svg.append("g")
			.attr("class", "yaxis")
			.call(yAxis);

		var bar = svg.selectAll(".bar")
		    .data(histdata)
		  .enter().append("g")
		    .attr("class", "bar")
		    .attr("transform", function(d) { return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")"; });

		bar.append("rect")
			    .attr("x", 1)
			    .attr("fill", DEFAULT_COLOURS[mCurrentIndSetIndex])
				.attr("width", barWidth)
			    //.attr("width", x(data[0].dx) - 1)
			    .attr("height", function(d) { return DEFAULT_GRAPH_HEIGHT_TRACKING - yScale(d.y); })
			    .style("stroke", "black")
				.style("stroke-width", "1px")
				.attr("shape-rendering", "crispEdges");

		// Add styling and attributes for axes paths
		var paths = document.getElementsByClassName("domain");
		for (var i = 0; i < paths.length; i++) {
			paths[i].setAttribute("style", "fill:none; stroke:black");
			paths[i].setAttribute("shape-rendering", "crispEdges");
		}

	}; //end histogram


	return {
		generateCharts: generateCharts,
		clearCanvas: clearCanvas,
		mode: mMode,
		histogram: histogram,
		setHasRosteredField: function(x) { hasRosteredField = x; },
		hasRosteredField: function() { return hasRosteredField; },
		rosteredOnly: function() { return mRosteredOnly; }
	};
	
})();
