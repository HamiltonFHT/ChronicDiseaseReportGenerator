/*
 * Using Prototypes
 

var CDRG_Data = function() {
	this.PhysicianList = new Array(new Array, new Array);
};


CDRG.prototype.getPhysicians = function() {
	return this.PhysicianList;
};


*/
//Single Object that holds all data variables and data manipulation functions
var reportData = (function() {
	var dataSource = [];
	
	var DEFAULT_DATE_FORMAT = d3.time.format("%b %d, %Y");
	var DEFAULT_CURR_DATE_FORMAT = d3.time.format("%d/%m/%Y");

	// Default column numbers for diabetic measures, which are based on the PSS search titled "DM-Patients"
	// NOTE: If new columns are added or columns are rearranged, these values MUST reflect those changes.
	// TO CHANGE: Column numbers and variable for other searches for patient populations
	// **TPS: One array for each possible chronic condition?
	var DEFAULT_COLUMN_PATIENT_NUMBER = 0;
	var DEFAULT_COLUMN_PATIENT_AGE = 1;
	var DEFAULT_COLUMN_PATIENT_SEX = 2;
	var DEFAULT_COLUMN_DOCTOR_NUMBER = 3;
	var DEFAULT_COLUMN_DM_MONTHS = 4;
	var DEFAULT_COLUMN_A1C = 5;
	var DEFAULT_COLUMN_A1C_DATE = 6;
	var DEFAULT_COLUMN_SYSTOLIC_BP = 7;
	var DEFAULT_COLUMN_SYSTOLIC_BP_DATE = 8;
	var DEFAULT_COLUMN_LDL = 9;
	var DEFAULT_COLUMN_LDL_DATE = 10;
	var DEFAULT_COLUMN_CHOL = 11;
	var DEFAULT_COLUMN_CHOL_DATE = 12;
	var DEFAULT_COLUMN_ACR = 13;
	var DEFAULT_COLUMN_ACR_DATE = 14;
	var DEFAULT_COLUMN_EGFR = 15;
	var DEFAULT_COLUMN_EGFR_DATE = 16;
	var DEFAULT_COLUMN_RISK = 17;
	var DEFAULT_COLUMN_DIASTOLIC_BP = 18;
	var DEFAULT_COLUMN_DIASTOLIC_BP_DATE = 19;
	var DEFAULT_COLUMN_RETINOPATHY = 20;
	var DEFAULT_COLUMN_FOOT_CHECK = 21;
	var DEFAULT_COLUMN_SELF_MANAGEMENT = 22;
	var DEFAULT_COLUMN_CURRENT_DATE = 23;
	var DEFAULT_COLUMN_PRIVACY = 24;

	var physicianList = [];
	var selectedPhysicianList = []
	var rawData = [];
	var parsedData = [];
	var filteredData = [];
	var calculatedData = [];
	var arrayLastModifiedDate = [];
	var arrayDates = [];
	var mode = "";
	var cleanedData = [];
	
	function readFiles(files) {
		
		dataSource = files;
		
		// If there are files imported, read them, starting from index 0
		// To do: Perform file validation to check whether they have .txt file extension
		if (files.length > 0) {
			
			console.log("Reading " + files.length + " files...");
			
			mode = (files.length == 1) ? "snapshot" : "tracking";
			
			console.log("Current mode: " + mode);
			
			// Read the first file in the FileList
			readSingleFile(0, mode);
		}
		
		
		//TODO get arrayPhysicians here
		
		
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
				
				//TODO untangle this mess
				//addSidePanels(arrayPhysicians, mode);
				clean();
				getPhysicianList();
				filter();
				
				console.log("Calling addSidePanels");
				reportViewer.addSidePanels();
				
				calculate();
				

				
				// different data manipulation and visualization functions depending on the mode selected
				//TPS: changed code block to call this function again which was functionally equivalent
				//TODO pass appropriate data to this function to pass along to others.
				//calculateAndGenerate(mode);
	
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
					parsedData.push(d3.csv.parseRows(unparsed));
					
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
	
	function clean() {
		console.log("Cleaning parsed data...");
		
		// Loops through each imported file in 'this.parsedData'
		for (var i = 0; i < parsedData.length; i++) {
			
			// Remove first row
			parsedData[i] = parsedData[i].slice(1);
			
			// For the current file, loop through each row in the file
			for (var j = 0; j < parsedData[i].length; j++) {
				
				// Last column empty, exported directly from PSS
				// Else last column not empty, would be a manually modified csv file
				if (parsedData[i][j][parsedData[i][j].length - 1] == "") {
					
					// Remove the last element
					parsedData[i][j] = parsedData[i][j].slice(0, parsedData[i][j].length - 1);
					
					// If there is no "Current Date" column, retrieve value from 'arrayLastModifiedDate' and populate it
					if (parsedData[i][j][DEFAULT_COLUMN_CURRENT_DATE] == undefined) {
						
						// If header row, label it "Current Date", otherwise retrieve value from 'arrayLastModifiedDate'
						// using index of 'i'
						if (j == 0)	parsedData[i][j][DEFAULT_COLUMN_CURRENT_DATE] = "Current Date";
						else parsedData[i][j][DEFAULT_COLUMN_CURRENT_DATE] = arrayLastModifiedDate[i];
					}
					
					// Else there IS a "Current Date" column, check for formatting
					else {
						
						// Ignore header
						if (j > 0) {
						
							// Convert "%d/%m/%Y" format to "%b %d, %Y"
							if (DEFAULT_DATE_FORMAT.parse(parsedData[i][j][DEFAULT_COLUMN_CURRENT_DATE]) == null) {
								
								parsedData[i][j][DEFAULT_COLUMN_CURRENT_DATE] = DEFAULT_DATE_FORMAT(DEFAULT_CURR_DATE_FORMAT.parse(parsedData[i][j][DEFAULT_COLUMN_CURRENT_DATE]));
							}
						}
					}
				}
			}
		}
		console.log("Finished cleaning parsed data.");
	}
	function getPhysicianList() {
		
		for (i = 0; i < parsedData.length; i++) {
		
			// Loop through each row in the file. Do not look at headers, so start at row j = 1
			for (var j = 1; j < parsedData[i].length; j++) {

				// If 'arrayUniquePhysicians' does not already contain that "Doctor Number", add it to the array
				//if (!arrayUniquePhysicians.contains(this.parsedData[i][j][DEFAULT_COLUMN_DOCTOR_NUMBER]))
				//	arrayUniquePhysicians.push(this.parsedData[i][j][DEFAULT_COLUMN_DOCTOR_NUMBER]);

				if (physicianList.length == 0) {
					physicianList.push(parsedData[i][j][DEFAULT_COLUMN_DOCTOR_NUMBER]);
					continue;
				}

				if (!physicianList.contains(parsedData[i][j][DEFAULT_COLUMN_DOCTOR_NUMBER]))
					physicianList.push(parsedData[i][j][DEFAULT_COLUMN_DOCTOR_NUMBER]);
			}
		}
		// Sort 'arrayUniquePhysicians' so the number displayed in ascending order
		physicianList.sort(function(a, b) { return a[0] > b[0]; });
		selectedPhysicianList = physicianList;
	}
	function filter() {
		console.log("Filtering data...");
		
		// Loop through each CSV file imported
		for (var i = 0; i < parsedData.length; i++) {
		
			// Push an empty array into 'filteredData' and push the header row into it
			filteredData.push(new Array());
			filteredData[i].push(parsedData[i][0]);
		
			// Loop through each row of data in the file, start at row 1
			for (var j = 1; j < parsedData[i].length; j++) {
			
				// Get doctor number
				var docNum = parsedData[i][j][DEFAULT_COLUMN_DOCTOR_NUMBER];
				
				// Get index of doctor number from arrayUniquePhysicians
				//var docIndex = physicianList.getArrayIndex(docNum);
				
				// Use index to see if doctor is selected in the side panel
				//var docSelected = selectedPhysicianList[docIndex];
				
				// If selected, push row into 'filteredData'
				if (selectedPhysicianList.contains(docNum))
					filteredData[i].push(parsedData[i][j]);
			}
		}
	}
	function calculate() {
		if (mode == "snapshot") {
			calcSnapshotData();
			reportViewer.clearCanvas();
			reportViewer.genVisSnapshot();
		} else {
			calcTrackingData();
			reportViewer.clearCanvas();
			reportViewer.genVisTracking();
		}
	}
	function calcSnapshotData() {

		console.log("Calculating patient counts for Snapshot Mode...");
		
		// Initialize array for calculated data
		calculatedData = [];
		
		// Initialize and set counts for diabetic measures
		var countDiabeticAssessment = reportRules.calculateCountDiabeticMeasure(0, reportRules.DEFAULT_INDEX_DIABETIC_ASSESSMENT),
			countA1CMeasured = reportRules.calculateCountDiabeticMeasure(0, reportRules.DEFAULT_INDEX_A1C_MEASURED),
			countA1CCompared = reportRules.calculateCountDiabeticMeasure(0, reportRules.DEFAULT_INDEX_A1C_COMPARED),
			countBPMeasured = reportRules.calculateCountDiabeticMeasure(0, reportRules.DEFAULT_INDEX_BP_MEASURED),
			countBPCompared = reportRules.calculateCountDiabeticMeasure(0, reportRules.DEFAULT_INDEX_BP_COMPARED),
			countLDLMeasured = reportRules.calculateCountDiabeticMeasure(0, reportRules.DEFAULT_INDEX_LDL_MEASURED),
			countLDLCompared = reportRules.calculateCountDiabeticMeasure(0, reportRules.DEFAULT_INDEX_LDL_COMPARED),
			countACRMeasured = reportRules.calculateCountDiabeticMeasure(0, reportRules.DEFAULT_INDEX_ACR_MEASURED),
			countACRComparedMale = reportRules.calculateCountDiabeticMeasure(0, reportRules.DEFAULT_INDEX_ACR_MALE_COMPARED),
			countACRComparedFemale = reportRules.calculateCountDiabeticMeasure(0, reportRules.DEFAULT_INDEX_ACR_FEMALE_COMPARED),
			countEGFRMeasured = reportRules.calculateCountDiabeticMeasure(0, reportRules.DEFAULT_INDEX_EGFR_MEASURED),
			countEGFRCompared = reportRules.calculateCountDiabeticMeasure(0, reportRules.DEFAULT_INDEX_EGFR_COMPARED),
			countRetinopathy = reportRules.calculateCountDiabeticMeasure(0, reportRules.DEFAULT_INDEX_NUM_RETINOPATHY),
			//countFootChecks = reportRules.calculateCountDiabeticMeasure(0, reportRules.DEFAULT_INDEX_NUM_FOOT_CHECKS),
			countSelfManagement = reportRules.calculateCountDiabeticMeasure(0, reportRules.DEFAULT_INDEX_NUM_SELF_MANAGEMENT),
			countCurrentSmokers = reportRules.calculateCountDiabeticMeasure(0, reportRules.DEFAULT_INDEX_NUM_CURRENT_SMOKERS);
		
		// Denominator
		var numFilteredPatients = filteredData[0].length - 1;
		
		// Push labels and values into calculated array
		calculatedData.push([	"Diabetic Assessment in past " + reportRules.DEFAULT_VALUE_DIABETIC_ASSESSMENT + " months",
									"A1C measured in past " + reportRules.DEFAULT_VALUE_A1C_MEASURED + " months",
									"A1C \u2264 " + reportRules.EFAULT_VALUE_A1C_COMPARED + " in past " + reportRules.DEFAULT_VALUE_A1C_MEASURED + " months",
									"BP measured in past " + reportRules.DEFAULT_VALUE_BP_MEASURED + " months",
									"BP < " + reportRules.DEFAULT_VALUE_BP_SYS_COMPARED + "/" + reportRules.DEFAULT_VALUE_BP_DIAS_COMPARED + " in past " + reportRules.DEFAULT_VALUE_BP_MEASURED + " months",
									"LDL measured in past " + reportRules.DEFAULT_VALUE_LDL_MEASURED + " months",
									"LDL \u2264 " + reportRules.DEFAULT_VALUE_LDL_COMPARED + " in past " + reportRules.DEFAULT_VALUE_LDL_MEASURED + " months",
									"ACR measured in past " + reportRules.DEFAULT_VALUE_ACR_MEASURED + " months",
									//"ACR Male < " + DEFAULT_VALUE_ACR_MALE_COMPARED + " in past " + DEFAULT_VALUE_ACR_MEASURED + " months",
									//"ACR Female < " + DEFAULT_VALUE_ACR_FEMALE_COMPARED + " in past " + DEFAULT_VALUE_ACR_MEASURED + " months",
									"eGFR measured in past " + reportRules.DEFAULT_VALUE_EGFR_MEASURED + " months",
									"eGFR > " + reportRules.DEFAULT_VALUE_EGFR_COMPARED + " in past " + reportRules.DEFAULT_VALUE_EGFR_MEASURED + " months",
									"Retinopathy",
									//"Foot Checks",
									"Self-Management",
									"Current Smokers"]);
									
		calculatedData.push([	countDiabeticAssessment/numFilteredPatients*100,
									countA1CMeasured/numFilteredPatients*100,
									countA1CCompared/numFilteredPatients*100,
									countBPMeasured/numFilteredPatients*100,
									countBPCompared/numFilteredPatients*100,
									countLDLMeasured/numFilteredPatients*100,
									countLDLCompared/numFilteredPatients*100,
									countACRMeasured/numFilteredPatients*100,
									//countACRComparedMale/numFilteredPatients*100,
									//countACRComparedFemale/numFilteredPatients*100,
									countEGFRMeasured/numFilteredPatients*100,
									countEGFRCompared/numFilteredPatients*100,
									countRetinopathy/numFilteredPatients*100,
									//countFootChecks/numFilteredPatients*100,
									countSelfManagement/numFilteredPatients*100,
									countCurrentSmokers/numFilteredPatients*100]);	
	
	}
	
	
	
	/*
	* calculateDataTrackingMode:
	* - Calculates data for Tracking mode
	* - Retrieves index of diabetic measures drop down menu and create array of counts for that measure
	*
	*/
	function calcTrackingData() {
	
		console.log("Calculating patient counts for Tracking Mode...");
	
		arrayDates = [];
		calculatedData = [];
		
		// Retrieve index of diabetic measures drop down menu, use index to calculate data for graphing
		var measureIndex = document.getElementById("dropdownDiabeticMeasures").selectedIndex;
		
		// Loop through each CSV file imported of the filtered data
		for (var i = 0; i < filteredData.length; i++) {
		
			if (filteredData[i].length > 1) {
			
				// Push date into dates array. Call from parsed array because filtered array might not have date for that file
				arrayDates.push(new Date(DEFAULT_DATE_FORMAT.parse(parsedData[i][1][DEFAULT_COLUMN_CURRENT_DATE])));
				
				// Push empty array for current file, will store date for sorting, and value of diabetic measure
				calculatedData.push(new Array());
				
				// Reset the count, and set to calculate count based on measure index
				var count = 0;
				count = reportRules.calculateCountDiabeticMeasure(i, measureIndex);
				
				// Denominator
				var numFilteredPatients = filteredData[i].length - 1;
				
				// Finish calculating all diabetic measure for this CSV file
				// Insert date as first element, for sorting. Insert percentages into array 0.XX
				calculatedData[calculatedData.length - 1].push(parsedData[i][1][DEFAULT_COLUMN_CURRENT_DATE]); // Date - index 0
				calculatedData[calculatedData.length - 1].push(count / numFilteredPatients);
	
			}
		}
		
		// Sort by date
		calculatedData.sort(function(a, b) {
			a = new Date(DEFAULT_DATE_FORMAT.parse(a[0]));
			b = new Date(DEFAULT_DATE_FORMAT.parse(b[0]));
			return a < b ? - 1 : a > b ? 1 : 0; 
		});
		
		// Sort by date
		arrayDates.sort(function(a,b) {
			return a < b ? - 1 : a > b ? 1 : 0; 
		});
		
		// For each file, splice out the date
		for (var i = 0; i < calculatedData.length; i++) {
			calculatedData[i] = calculatedData[i].splice(1);
		}
	
	}
	function getCalculatedData() {
		return calculatedData;
	}
	function getMode() {
		return mode;
	}
	function getArrayDates() {
		return arrayDates;
	}
	console.log("Finished instantiating reportData");
	
	return {
		readFiles: readFiles,
		physicianList: physicianList,
		selectedPhysicianList: selectedPhysicianList,
		filteredData: filteredData,
		calculatedData: getCalculatedData,
		calculate: calculate,
		filter: filter,
		mode: getMode,
		arrayDates: getArrayDates,
	};

})();


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
};


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
};


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
};

