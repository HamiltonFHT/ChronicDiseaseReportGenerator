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
var reportData = function(dataSource) {
	this.dataSource = dataSource;
	this.cleanData = reportData.clean(
								reportData.parse(
									reportData.readFiles(dataSource)));
};


reportData.prototype = {
	files: new Array(),
	arrayPhysicians: new Array(new Array, new Array),
	arrayRawData: new Array(),
	arrayParsedData: new Array(),
	arrayCleanedData: new Array(),
	arrayLastModifiedDate: new Array(),
	mode: "",
	readFiles: function(files) {
		if (files.length > 0) {
			console.log("Reading " + files.length + " files...");
			
			this.mode = (files.length == 1) ? "snapshot" : "tracking";
			
			console.log("Current mode: " + this.mode);
			
			// Read the first file in the FileList
			this.readSingleFile(0);
		}
	},
	readSingleFile: function(index) { //, mode
				// When finished reading all files, execute the following functions, which will clean and parse the imported
		// data, add user interface elements to the document, filter data based on user interaction, and generate the
		// visualization based on the selected filters
		if (index >= files.length) {
			
			console.log("Finished reading " + files.length + " files.");
			
			console.log("Current mode: " + mode);
			
			//TODO untangle this mess
			this.arrayCleanedData = this.cleanParsedData;
			this.arrayPhysicians = this.getPhysicianList;
			ReportChart.addSidePanels(this.arrayPhysicians, this.mode);
			this.arrayFilteredData = this.filterData;
			
			// different data manipulation and visualization functions depending on the mode selected
			//TPS: changed code block to call this function again which was functionally equivalent
			//TODO pass appropriate data to this function to pass along to others.
			this.calculateAndGenerate(mode);

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
	},
	getPhysicianList: function() {
		
		// Loop through each row in the file. Do not look at headers, so start at row j = 1
		for (var j = 1; j < this.arrayParsedData[i].length; j++) {
		
			// If 'arrayUniquePhysicians' does not already contain that "Doctor Number", add it to the array
			//if (!arrayUniquePhysicians.contains(arrayParsedData[i][j][DEFAULT_COLUMN_DOCTOR_NUMBER]))
			//	arrayUniquePhysicians.push(arrayParsedData[i][j][DEFAULT_COLUMN_DOCTOR_NUMBER]);
			
			if (this.arrayPhysicians.length == 0) {
				this.arrayPhysicians.push([this.arrayParsedData[i][j][DEFAULT_COLUMN_DOCTOR_NUMBER], true]);
				continue;
			}
			
			if (!this.arrayPhysicians[0].contains(this.arrayParsedData[i][j][DEFAULT_COLUMN_DOCTOR_NUMBER]))
				this.arrayPhysicians[0].push(this.arrayParsedData[i][j][DEFAULT_COLUMN_DOCTOR_NUMBER]);
				this.arrayPhysicians[1].push(true);
		}
		// Sort 'arrayUniquePhysicians' so the number displayed in ascending order
		this.arrayPhysicians.sort(function(a, b) { return a[0] > b[0]; });
	},
	clean: function(parsedData) { //arrayParsedData
	
		console.log("Cleaning parsed data...");
		
		// Loops through each imported file in 'arrayParsedData'
		for (var i = 0; i < this.parsedData.length; i++) {
			
			// Remove first row
			this.parsedData[i] = this.parsedData[i].slice(1);
			
			// For the current file, loop through each row in the file
			for (var j = 0; j < this.parsedData[i].length; j++) {
				
				// Last column empty, exported directly from PSS
				// Else last column not empty, would be a manually modified csv file
				if (this.parsedData[i][j][this.parsedData[i][j].length - 1] == "") {
					
					// Remove the last element
					this.parsedData[i][j] = this.parsedData[i][j].slice(0, this.parsedData[i][j].length - 1);
					
					// If there is no "Current Date" column, retrieve value from 'arrayLastModifiedDate' and populate it
					if (this.parsedData[i][j][DEFAULT_COLUMN_CURRENT_DATE] == undefined) {
						
						// If header row, label it "Current Date", otherwise retrieve value from 'arrayLastModifiedDate'
						// using index of 'i'
						if (j == 0)	this.parsedData[i][j][DEFAULT_COLUMN_CURRENT_DATE] = "Current Date";
						else this.parsedData[i][j][DEFAULT_COLUMN_CURRENT_DATE] = this.arrayLastModifiedDate[i];
					}
					
					// Else there IS a "Current Date" column, check for formatting
					else {
						
						// Ignore header
						if (j > 0) {
						
							// Convert "%d/%m/%Y" format to "%b %d, %Y"
							if (DEFAULT_DATE_FORMAT.parse(this.arrayParsedData[i][j][DEFAULT_COLUMN_CURRENT_DATE]) == null) {
								
								this.arrayParsedData[i][j][DEFAULT_COLUMN_CURRENT_DATE] = DEFAULT_DATE_FORMAT(DEFAULT_CURR_DATE_FORMAT.parse(this.arrayParsedData[i][j][DEFAULT_COLUMN_CURRENT_DATE]));
							}
						}
					}
				}
			}
		}
		console.log("Finished cleaning parsed data.");
	},
	filter: function() { 	//arrayPhysicians, arrayCleanedData
	
		console.log("Filtering data...");
		
		// Loop through each CSV file imported
		for (var i = 0; i < this.arrayCleanedData.length; i++) {
		
			// Push an empty array into 'arrayFilteredData' and push the header row into it
			this.arrayFilteredData.push(new Array());
			this.arrayFilteredData[i].push(this.arrayCleanedData[i][0]);
		
			// Loop through each row of data in the file, start at row 1
			for (var j = 1; j < this.arrayCleanedData[i].length; j++) {
			
				// Get doctor number
				var docNum = this.arrayCleanedData[i][j][DEFAULT_COLUMN_DOCTOR_NUMBER];
				
				// Get index of doctor number from arrayUniquePhysicians
				var docIndex = this.arrayPhysicians[0].getArrayIndex(docNum);
				
				// Use index to see if doctor is selected in the side panel
				var docSelected = this.arrayPhysicians[1][docIndex];
				
				// If selected, push row into 'arrayFilteredData'
				if (docSelected)
					this.arrayFilteredData[i].push(this.arrayCleanedData[i][j]);
			}
		}
		
		//return arrayFilteredData;
	},
	calculateAndGenerate: function() { //mode
		console.log("calculateAndGenerate Called!");

		if (this.mode == "snapshot") {
		
			this.calculateDataSnapshotMode;
			ReportChart.clearCanvas("canvasContainer", this.mode);
			ReportChart.generateVisualizationSnapshotMode("canvasContainer");
		}
		
		else {
		
			this.calculateDataTrackingMode;
			ReportChart.clearCanvas("canvasContainer", this.mode);
			ReportChart.generateVisualizationTrackingMode("canvasContainer");
			
		}
	},
	//Auxillary Function
	fillArray: function(value, len) {
		  var arr = [];
	  for (var i = 0; i < len; i++) {
	    arr.push(value);
	  };
	  return arr;
	}
};