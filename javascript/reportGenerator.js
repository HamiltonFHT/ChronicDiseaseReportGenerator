// **************************************************************************************************************************************************
// @author Brice Wong
// Copyright 2014 Hamilton Family Health Team
//
// reportGenerator.js
// 
// This document contains the constants, global variables, and functions that are associated with the Report Generator. It also contains functions to
// read and parse files that are imported by the user.
//
// **************************************************************************************************************************************************


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Declaring and initializing constants and global variables
// 
// This section contains the declaration and initialization of global variables that are used throughout the Report Generator. It also contains 
// constant variables such as default comparison values for diabetic measures, default colours for multi-series data, default date formats, etc.
// 
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Default colours to use for multi-series data, such as tracking multiple physicians or mulitple lines on the graph. Add new colours to the array as
// needed.
var DEFAULT_COLOURS = [	"firebrick", "steelblue", "yellowgreen", "mediumpurple", "cadetblue",
						"sandybrown", "slategray", "goldenrod", "darkslateblue", "palevioletred",
						"forestgreen", "sienna", "bisque"];
							
							
// Default date format from PSS search output:
// A function in d3.js which takes a string in a particular format. Call the parse() function and pass in the string to retrieve a Date object, or 
// use it as a function and pass a Date object as a parameter to retrieve the date as a String.
//
// E.g. 
// > new Date(DEFAULT_DATE_FORMAT.parse("Jun 29, 2013"))
// Sat Jun 29 2013 00:00:00 GMT-0400 (Eastern Daylight Time)
// 
// > DEFAULT_DATE_FORMAT(new Date())
// "Jun 30, 2013"
var DEFAULT_DATE_FORMAT = d3.time.format("%b %d, %Y");
var DEFAULT_CURR_DATE_FORMAT = d3.time.format("%d/%m/%Y");


// Default column numbers for diabetic measures, which are based on the PSS search titled "DM-Patients"
// NOTE: If new columns are added or columns are rearranged, these values MUST reflect those changes.
// TO CHANGE: Column numbers and variable for other searches for patient populations
// **TPS: One array for each possible chronic condition?
var DEFAULT_COLUMN_PATIENT_NUMBER = 0,
	DEFAULT_COLUMN_PATIENT_AGE = 1,
	DEFAULT_COLUMN_PATIENT_SEX = 2,
	DEFAULT_COLUMN_DOCTOR_NUMBER = 3,
	DEFAULT_COLUMN_DM_MONTHS = 4,
	DEFAULT_COLUMN_A1C = 5,
	DEFAULT_COLUMN_A1C_DATE = 6,
	DEFAULT_COLUMN_SYSTOLIC_BP = 7,
	DEFAULT_COLUMN_SYSTOLIC_BP_DATE = 8,
	DEFAULT_COLUMN_LDL = 9,
	DEFAULT_COLUMN_LDL_DATE = 10,
	DEFAULT_COLUMN_CHOL = 11,
	DEFAULT_COLUMN_CHOL_DATE = 12,
	DEFAULT_COLUMN_ACR = 13,
	DEFAULT_COLUMN_ACR_DATE = 14,
	DEFAULT_COLUMN_EGFR = 15,
	DEFAULT_COLUMN_EGFR_DATE = 16,
	DEFAULT_COLUMN_RISK = 17,
	DEFAULT_COLUMN_DIASTOLIC_BP = 18,
	DEFAULT_COLUMN_DIASTOLIC_BP_DATE = 19,
	DEFAULT_COLUMN_RETINOPATHY = 20,
	DEFAULT_COLUMN_FOOT_CHECK = 21,
	DEFAULT_COLUMN_SELF_MANAGEMENT = 22,
	DEFAULT_COLUMN_CURRENT_DATE = 23,
	DEFAULT_COLUMN_PRIVACY = 24;	
		
		
// Default comparison values for diabetic measures, based on Clinical Practice Guidelines and what we are asked to tracked in the report generator.
// NOTE: These are the DEFAULT values for comparison. There will be a settings menu to allow the user to modify these comparison values based on 
// their clinical judgement and what they want to track.
// TO CHANGE: Other chronic conditions will have other constant values
var DEFAULT_VALUE_DIABETIC_ASSESSMENT = 12,		// months
	DEFAULT_VALUE_A1C_MEASURED = 3,				// months
	DEFAULT_VALUE_A1C_COMPARED = 0.07,			// less than or equal to
	DEFAULT_VALUE_BP_MEASURED = 6,				// months
	DEFAULT_VALUE_BP_SYS_COMPARED = 130,		// less than
	DEFAULT_VALUE_BP_DIAS_COMPARED = 80,		// less than
	DEFAULT_VALUE_LDL_MEASURED = 12,			// months
	DEFAULT_VALUE_LDL_COMPARED = 2,				// less than or equal to
	DEFAULT_VALUE_ACR_MEASURED = 12,			// months
	DEFAULT_VALUE_ACR_MALE_COMPARED = 2.0,		// less than
	DEFAULT_VALUE_ACR_FEMALE_COMPARED = 2.8,	// less than
	DEFAULT_VALUE_EGFR_MEASURED = 12,			// months
	DEFAULT_VALUE_EGFR_COMPARED = 60;			// greater than
		
		
// Default canvas size. The size of the SVG container.
// **TPS: Can work on the following
// To do: To take into account the user resizing their browser window (or mobile devices), dynamic canvas measurements will be implemented in the near 
// future. Adjust these based on a percentage of window.innerWidth and window.innerHeight
var DEFAULT_CANVAS_WIDTH = 960,					// pixels
	DEFAULT_CANVAS_HEIGHT = 480;				// pixels
		
		
// Array variables that will store data	and information about the data
// 
// arrayParsedData: Stores the data that is read from each imported CSV file
// 
// arrayDateModified: Stores the modified date from each imported CSV file. The date used for tracking over time will fall back to this value if a
//					  "Current Date" column is not found in the file.
//TODO Make these non-global
var	arrayParsedData;
var arrayLastModifiedDate;


/*
* readFiles:
* - Called when there is a change event fired from the file input field in the document.
* 
* @param files A FileList object containing the files that are selected for import
*/ 
function readFiles(files) {
	
	
	// Reset all data
	var arrayParsedData = [];
	var arrayLastModifiedDate = [];
		
	// If there are files imported, read them, starting from index 0
	// To do: Perform file validation to check whether they have .txt file extension
	if (files.length > 0) {
		
		console.log("Reading " + files.length + " files...");
		
		var mode = (files.length == 1) ? "snapshot" : "tracking";
		
		console.log("Current mode: " + mode);
		
		// Read the first file in the FileList
		readSingleFile(0, mode);
	}
	
	/*
	* readSingleFile: 
	* - Inner function that reads a single file at a time.
	*
	* @param index The index of the file in the FileList
	* @param mode The current mode : "Snapshot", "Tracking"
	*/
	function readSingleFile(index, mode) {
	
		// When finished reading all files, execute the following functions, which will clean and parse the imported
		// data, add user interface elements to the document, filter data based on user interaction, and generate the
		// visualization based on the selected filters
		if (index >= files.length) {
			
			console.log("Finished reading " + files.length + " files.");
			
			console.log("Current mode: " + mode);
			
			//TODO untangle this mess
			arrayCleanedData = cleanParsedData(arrayParsedData);
			addSidePanels(arrayCleanedData, mode);
			arrayParsedData = filterData(arrayCleanedData);
			
			// different data manipulation and visualization functions depending on the mode selected
			//TPS: changed code block to call this function again which was functionally equivalent
			//TODO pass appropriate data to this function to pass along to others.
			calculateAndGenerate(mode);

		}
		
		// Declare and initialize a FileReader object for this file
		// Get the file from the FileList based on the index value
		var reader = new FileReader();
		var f = files[index];
		
		// When the FileReader object is loaded, pass in the imported file as a parameter to this function
		reader.onload = (function(theFile) {
					
			return function(e) {
				
				console.log("Reading file " + (index + 1) + ": " + theFile.name + "...");
				
				// Retrieve and parse the contents of the imported file and push it into 'arrayParsedData'
				var unparsed = e.target.result;
				arrayParsedData.push(d3.csv.parseRows(unparsed));
				
				// Retrieve the last modified date of the imported file and push it into 'arrayLastModifiedDate' 
				// Parse the date using the default date format
				var d = new Date(theFile.lastModifiedDate);
				arrayLastModifiedDate.push(DEFAULT_DATE_FORMAT(d));
				
				// Increment the index counter and read the next file
				index++;
				readSingleFile(index, mode);
			};
		})(f);
		
		// Read the current file as text format
		reader.readAsText(f);
	}
}			
		
		
/*
* cleanParsedData:
* - Removes the first row in each file and last element of each row, which is whitespace created by PSS when exporting
* 	search results.
* - Inserts a "Current Date" column if it doesn't already have one, uses the date from 'arrayLastModifiedDate' to 
* 	populate the column.
*/ 
function cleanParsedData(arrayParsedData) {
	
	console.log("Cleaning parsed data...");
	
	// Loops through each imported file in 'arrayParsedData'
	for (var i = 0; i < arrayParsedData.length; i++) {
		
		// Remove first row
		arrayParsedData[i] = arrayParsedData[i].slice(1);
		
		// For the current file, loop through each row in the file
		for (var j = 0; j < arrayParsedData[i].length; j++) {
			
			// Last column empty, exported directly from PSS
			// Else last column not empty, would be a manually modified csv file
			if (arrayParsedData[i][j][arrayParsedData[i][j].length - 1] == "") {
				
				// Remove the last element
				arrayParsedData[i][j] = arrayParsedData[i][j].slice(0, arrayParsedData[i][j].length - 1);
				
				// If there is no "Current Date" column, retrieve value from 'arrayLastModifiedDate' and populate it
				if (arrayParsedData[i][j][DEFAULT_COLUMN_CURRENT_DATE] == undefined) {
					
					// If header row, label it "Current Date", otherwise retrieve value from 'arrayLastModifiedDate'
					// using index of 'i'
					if (j == 0)	arrayParsedData[i][j][DEFAULT_COLUMN_CURRENT_DATE] = "Current Date";
					else arrayParsedData[i][j][DEFAULT_COLUMN_CURRENT_DATE] = arrayLastModifiedDate[i];
				}
				
				// Else there IS a "Current Date" column, check for formatting
				else {
					
					// Ignore header
					if (j > 0) {
					
						// Convert "%d/%m/%Y" format to "%b %d, %Y"
						if (DEFAULT_DATE_FORMAT.parse(arrayParsedData[i][j][DEFAULT_COLUMN_CURRENT_DATE]) == null) {
							
							arrayParsedData[i][j][DEFAULT_COLUMN_CURRENT_DATE] = DEFAULT_DATE_FORMAT(DEFAULT_CURR_DATE_FORMAT.parse(arrayParsedData[i][j][DEFAULT_COLUMN_CURRENT_DATE]));
						}
					}
				}
			}
		}
	}
	
	console.log("Finished cleaning parsed data.");
	
	return arrayParsedData;
}	
		
		
		

