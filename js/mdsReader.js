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

/* mdsReader is a variable that handles the reading and parsing
 * of text files into a useable format and also filters data elements
 * based on user input in mdsViewer. 
 * This variable also calls mdsIndicators and mdsViewer in order to
 * apply the indicator rules and display the results
 * 
*/

var mdsReader = (function() {

	var mSelectedPhysicians = {};
	var mFilteredData = [];
	var mParsedData = [];
	var mCurrentIndSetIndex;
	var holder = document.getElementById('canvasContainer');


	holder.ondragover = function () { return false; };
	holder.ondragend = function () { return false; };
	holder.ondrop = function (e) {
		var fileReaderAvailable = false;

		if (typeof window.FileReader === 'undefined') {
		   return;
		}

		this.className = '';
		e.preventDefault();

		readFiles(e.dataTransfer.files);
		return false;
	};

	/*
	 * Called by index.html when a file is uploaded by the user.
	 * Parses files and sorts by date and the calls calculate() to 
	 * apply indicators and display chart
	 */
	function readFiles(files) {

	   filesLeftToRead = files.length;
	   mdsViewer.mode = "";
	   
	   if (files.length == 0) {
	   		return;
	   }

		mSelectedPhysicians = {};
		mParsedData = [];
	      
		for (i = 0; i < files.length; i++) {
			var f = files[i]; 
			
			if (!f) {
			   alert("Failed to load file");
			   throw new Error("Failed to load file");
			} else if (!f.type.match(/^text*/) && !f.type.match(/vnd\.ms-excel/g)) {
			    alert(f.name + " is not a valid text or csv file.");
				throw new Error(f.name + " is not a valid text or csv file.");
			} else {
			 	var r = new FileReader();
			  	r.onload = (function(f) { 
			  		return function(e) { 
			    		var contents = e.target.result;
			    		mParsedData.push(parseToObject(f, contents));
			    		//TODO replace with Promise pattern
			    		--filesLeftToRead;
			    		if (filesLeftToRead == 0) {
							function compare(a,b) {
							  if (a.fileLastModified < b.fileLastModified)
							    return -1;
							  if (a.fileLastModified > b.fileLastModified)
							    return 1;
							  return 0;
							}
							
							//Check if patient records were found				
							var empty = true;
							for (var i=0; i < mParsedData.length; i++) {
								if (mParsedData[i]["num_elements"] == 0) {
								 	mParsedData.splice(i, 1);
								} else {
									empty = false;
								}
							}
							if (empty) {
								alert("No patient records found in files");
								mdsViewer.clearCanvas();
								throw new Error("No patient records found in files");
							}
							
							mParsedData.sort(compare);
							calculate();
			    		}
			 		};
			 	})(f);
			 }
			 r.readAsText(f);
		}
	};

	/*
	 * Takes a raw string and converts it to a JS object
	 * that is easier to work with.
	 */
	function parseToObject(f, unparsed) {

		csvObject = {};
		csvObject['fileName'] = f.name;
		csvObject['fileLastModified'] = f.lastModifiedDate;
	
		arrData = CSVToArray(unparsed);
		
		if (arrData[0].length == 0) {
			arrData.shift();
		}
		
		if (arrData[arrData.length-1] == "") {
			arrData.pop();
		}
		
		var csvHeaders = arrData.shift();
		
		mCurrentIndSetIndex = mdsIndicators.getCurrentRuleSet(csvHeaders);
		
		for (var rowIndex = 0; rowIndex < arrData.length; rowIndex++) {
			var rowArray = arrData[rowIndex];
			for (var propIndex = 0; propIndex < rowArray.length; ++propIndex) {
				if (csvObject[csvHeaders[propIndex]] == undefined) {
					csvObject[csvHeaders[propIndex]] = [];
				}
				// Convert DD/MM/YYYY to YYYY-MM-DD
				if (/^[0-9]{2}\/[0-9]{2}\/[0-9]{4}/.test(rowArray[propIndex])) {
					rowArray[propIndex] = parseDate(rowArray[propIndex]);
				}

				csvObject[csvHeaders[propIndex]].push(rowArray[propIndex]);

			}
		}
		

		csvObject["num_elements"] = arrData.length;

		//PSS include a blank column
		if (csvObject.hasOwnProperty("")) {
			delete csvObject[""];
		}
		if (!csvObject.hasOwnProperty("Current Date")) {
			csvObject["Current Date"] = repeat(csvObject["fileLastModified"], arrData.length);
		}
		
		return csvObject;
	};

	// Converts DD/MM/YYYY to YYYY-MM-DD string
	function parseDate(date) {
		if (date != "") {
			var parsedDate = date.split("/");
			return parsedDate[2].concat("-", parsedDate[1], "-", parsedDate[0]);
		} else
		return 0;
	};
	
	/* 
	 * Converts a CSV formatted string into array of arrays
	 */
	function CSVToArray( strData, strDelimiter ){
	    // Check to see if the delimiter is defined. If not,
	    // then default to comma.
	    strDelimiter = (strDelimiter || ",");
	    // Create a regular expression to parse the CSV values.
	    var objPattern = new RegExp(
	        (
	            // Delimiters.
	            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
	            // Quoted fields.
	            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
	            // Standard fields.
	            "([^\"\\" + strDelimiter + "\\r\\n]*))"
	        ),
	        "gi"
	        );
	
	    // Create an array to hold our data. Give the array
	    // a default empty first row.
	    var arrData = [[]];
	    // Create an array to hold our individual pattern
	    // matching groups.
	    var arrMatches = null;
	
	    // Keep looping over the regular expression matches
	    // until we can no longer find a match.
	    while (arrMatches = objPattern.exec( strData )){
	
	        // Get the delimiter that was found.
	        var strMatchedDelimiter = arrMatches[ 1 ];
	        // Check to see if the given delimiter has a length
	        // (is not the start of string) and if it matches
	        // field delimiter. If id does not, then we know
	        // that this delimiter is a row delimiter.
	        if (
	            strMatchedDelimiter.length &&
	            (strMatchedDelimiter != strDelimiter)
	            ){
	            // Since we have reached a new row of data,
	            // add an empty row to our data array.
	            arrData.push( [] );
	        }
	
	        // Now that we have our delimiter out of the way,
	        // let's check to see which kind of value we
	        // captured (quoted or unquoted).
	        if (arrMatches[ 2 ]){
	            // We found a quoted value. When we capture
	            // this value, unescape any double quotes.
	            var strMatchedValue = arrMatches[ 2 ].replace(
	                new RegExp( "\"\"", "g" ),
	                "\""
	                );
	
	        } else {
	            // We found a non-quoted value.
	            var strMatchedValue = arrMatches[ 3 ];
	        }
	        // Now that we have our value string, let's add
	        // it to the data array.
	        arrData[ arrData.length - 1 ].push( strMatchedValue );
	    }
	    // Return the parsed data.
	    return( arrData );
	};
	
		
	/*
	 * Filter all records from physicians that are not currently selected
	 * If mSelectedPhysicians is undefined it creates the variable and defaults
	 * to all physicians selected
	 */
	function filterData() {
		
		
		function uniqueDocs(value, pos, self) {
			return self.indexOf(value) === pos;
		}
		
		//uses global parsedDate
		
		var uniquePhysicians = [];
		// Loop through each CSV file imported
		for (var i = 0; i < mParsedData.length; i++) {
			//array of array of unique physicians
			uniquePhysicians.push(mParsedData[i]["Doctor Number"].filter(uniqueDocs));
		}
		
		//If mSelectedPhysicians is uninitialized, add all physicians and set to true
		if (Object.keys(mSelectedPhysicians).length == 0) {
			//Flatten and filter for only unique docs
			//array of all unique physicians
			flatUniquePhysicians = [].concat.apply([], uniquePhysicians).filter(uniqueDocs);
			for (var j = 0; j < flatUniquePhysicians.length; j++) {
				mSelectedPhysicians[flatUniquePhysicians[j]] = true;
			}
		}
		
		mFilteredData = [];
		for (var i = 0; i < mParsedData.length; i++) {
			
			//push new object for each file
			mFilteredData.push({});
			
			//For each column in the file
			for (var key in mParsedData[i]) {
				
				//If this is a data element (i.e. an array) and not a property element (i.e. a file name)
				if (mParsedData[i][key] instanceof Array) {
					
					//array per column
					//Add the key to mFilteredData if it doesn't have it
					if (!mFilteredData[i].hasOwnProperty(key)) {
						mFilteredData[i][key] = [];
					}
						
					//Add the element from mParsedData if the user selected it (i.e. it's index is in the physicianList)
					for (var j = 0; j < mParsedData[i][key].length; j++) {
						var docNum = mParsedData[i]["Doctor Number"][j];
						if (mSelectedPhysicians[docNum] == true) {
							mFilteredData[i][key].push(mParsedData[i][key][j]);
						}
					}
				}
			}
			if (!("Current Date" in mFilteredData[i])) {
				mFilteredData[i]["Current Date"] = repeat(mParsedData[i]["fileLastModified"], mFilteredData[i][0].length);
			}

			// If socialHistory is a column, then need to parse out smoking status
			if ("socialHistory" in mFilteredData[i]) {
				parseSocialHistory(i);
			}

			// If prevention_type is a column, then convert data into proper format
			if ("prevention_type" in mFilteredData[i]) {
				convertPreventions(i);
			}

			// Add a new column listing the patients who are on medication for ADHD
			if ("onMedication" in mFilteredData[i]) {
				identifyADHD(i);
			}
		}
	};

	/*
	 * Parse out smoking status from socialHistory
	 */
	function parseSocialHistory(x) {

		// Loop through and find the indices of the ones with a socialHistory and store it in hasSocialHistory
		var hasSocialHistory = [];
		var socialHistory = mFilteredData[x]["socialHistory"];

		for (var i=0; i<socialHistory.length; i++) {
			if (socialHistory[i] != "")
				hasSocialHistory.push(i);
		}

		// Split the socialHistory by "\n" and only take the ones with however they code smoking status 
		var temp = [];
		var smoke = /smk|skst|smok/i;
		var noSmoke = /no|ex|quit|stopped|never/i;

		for (var i=0; i<hasSocialHistory.length; i++) {
			temp = socialHistory[hasSocialHistory[i]].split("\\n");

			// Filter entries to only keep the ones that deal with smoking
			for (var j=temp.length-1; j>=0; j--) {
				if (!smoke.test(temp[j]))
					temp.splice(j,1);
			}

			// Save only the latest entry
			socialHistory[hasSocialHistory[i]] = temp[temp.length-1];

			// If the entry is not in var noSmoke, replace it with "yes"
			if (!noSmoke.test(socialHistory[hasSocialHistory[i]]) && typeof socialHistory[hasSocialHistory[i]] !== 'undefined') {
				socialHistory[hasSocialHistory[i]] = "yes";
			} else if (typeof socialHistory[hasSocialHistory[i]] === 'undefined') {
				socialHistory[hasSocialHistory[i]] = "";
			}
		}

		// Add a "Risk Factors" object to mFilteredData and copy socialHistory to it
		mFilteredData[x]["Risk Factors"] = mFilteredData[x]["socialHistory"];
		
	};


	/*
	 * Pull out each prevention into their own columns
	 */
	function convertPreventions(x) {

		// Create a new array of unique patient #s
		mFilteredData[x]["unique patients"] = [];
		for (var i = 0; i < mFilteredData[x]["Patient #"].length; i++) {
        	if ((jQuery.inArray(mFilteredData[x]["Patient #"][i], mFilteredData[x]["unique patients"])) == -1) {
           		mFilteredData[x]["unique patients"].push(mFilteredData[x]["Patient #"][i]);
        	}
   		}

   		// Delete Ages for repeated patients
   		var tempAge = [];
   		for (var i=0; i<mFilteredData[x]["unique patients"].length; i++) {
   			tempAge.push(mFilteredData[x]["Age"][mFilteredData[x]["Patient #"].indexOf(mFilteredData[x]["unique patients"][i])]);
   		}
   		mFilteredData[x]["Age"] = tempAge;

		// Patient #,Doctor Number,Age,height date,weight date,measles,diphtheria,varicella,rotavirus,polio,haemophilus b conjugate,pneumococcal conjugate,meningococcal conjugate,Current Date
		// Add a "height date" and a "weight date" object to mFilteredData
		mFilteredData[x]["height date"] = [];
		mFilteredData[x]["weight date"] = [];

		// Split dateObserved column into height date and weight date
		var measurements = mFilteredData[x]["measurements"];
		var alreadyDone = [];

		for (var i=0; i<measurements.length; i++) {
			if (measurements[i] != "" && alreadyDone.indexOf(mFilteredData[x]["Patient #"][i]) == -1) {
				var splitMeasurements = measurements[i].split("|");
				var splitDateObserved = mFilteredData[x]["dateObserved"][i].split("|");
				for (var j=0; j<splitMeasurements.length; j++) {
					switch (splitMeasurements[j]) {
						case "HT":
							mFilteredData[x]["height date"].push(splitDateObserved[j]);
							break;
						case "WT":
							mFilteredData[x]["weight date"].push(splitDateObserved[j]);
							break;
					}
				}
			alreadyDone.push(mFilteredData[x]["Patient #"][i]);
			
			if (!mFilteredData[x]["height date"][alreadyDone.length-1]) mFilteredData[x]["height date"][alreadyDone.length-1] = "";
			if (!mFilteredData[x]["weight date"][alreadyDone.length-1]) mFilteredData[x]["weight date"][alreadyDone.length-1] = "";
			} else if (measurements[i] == "" && alreadyDone.indexOf(mFilteredData[x]["Patient #"][i]) == -1) {
				alreadyDone.push(mFilteredData[x]["Patient #"][i]);
				if (!mFilteredData[x]["height date"][alreadyDone.length-1]) mFilteredData[x]["height date"][alreadyDone.length-1] = "";
				if (!mFilteredData[x]["weight date"][alreadyDone.length-1]) mFilteredData[x]["weight date"][alreadyDone.length-1] = "";
			}
		}

		// Create an array of new columns to add and initialize them
		var preventionTypes = mFilteredData[x]["prevention_type"];
		var newColumns = ["measles", "measles date", "diphtheria", "diphtheria date", "varicella", "varicella date",
						  "rotavirus", "rotavirus date", "polio", "polio date", "haemophilus b conjugate", "haemophilus b conjugate date",
						  "pneumococcal conjugate", "pneumococcal conjugate date", "meningococcal conjugate", "meningococcal conjugate date"];

		for (var i=0; i<newColumns.length; i++) {
			mFilteredData[x][newColumns[i]] = repeat(0,mFilteredData[x]["unique patients"].length);
		}

		// Set the number of times done to the appropriate columns
		for (var i=0; i<preventionTypes.length; i++) {
			if (preventionTypes[i] != "") {
				// diphtheria
				if (/dt.*/i.test(preventionTypes[i]) || /td.*/i.test(preventionTypes[i]) || /dpt.*/i.test(preventionTypes[i])) {
					mFilteredData[x]["diphtheria"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])] += Number(mFilteredData[x]["Times Done"][i]);
					if (mFilteredData[x]["diphtheria date"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])] == 0
						|| new Date(mFilteredData[x]["Last Done"][i]) > new Date(mFilteredData[x]["diphtheria date"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])])) 
						mFilteredData[x]["diphtheria date"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])] = new Date(mFilteredData[x]["Last Done"][i]);
				}
				// measles
				if (/mm?r.?\w?/i.test(preventionTypes[i])) {
					mFilteredData[x]["measles"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])] += Number(mFilteredData[x]["Times Done"][i]);
					if (mFilteredData[x]["measles date"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])] == 0
						|| new Date(mFilteredData[x]["Last Done"][i]) > new Date(mFilteredData[x]["measles date"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])]))
						mFilteredData[x]["measles date"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])] = new Date(mFilteredData[x]["Last Done"][i]);
				}
				// haemophilus b conjugate
				if (/.*hib.*/i.test(preventionTypes[i])) {
					mFilteredData[x]["haemophilus b conjugate"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])] += Number(mFilteredData[x]["Times Done"][i]);
					if (mFilteredData[x]["haemophilus b conjugate date"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])] == 0
						|| new Date(mFilteredData[x]["Last Done"][i]) > new Date(mFilteredData[x]["haemophilus b conjugate date"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])]))
						mFilteredData[x]["haemophilus b conjugate date"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])] = new Date(mFilteredData[x]["Last Done"][i]);
				}
				// polio
				if (preventionTypes[i] != "HPV Vaccine" && (/.*pv.*/i.test(preventionTypes[i]) || preventionTypes[i] == "DPT POLIO")) {
					mFilteredData[x]["polio"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])] += Number(mFilteredData[x]["Times Done"][i]);
					if (mFilteredData[x]["polio date"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])] == 0
						|| new Date(mFilteredData[x]["Last Done"][i]) > new Date(mFilteredData[x]["polio date"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])]))
						mFilteredData[x]["polio date"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])] = new Date(mFilteredData[x]["Last Done"][i]);
				}
				// varicella
				if (preventionTypes[i] == "VZ" || preventionTypes[i] == "MMRV") {
					mFilteredData[x]["varicella"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])] += Number(mFilteredData[x]["Times Done"][i]);
					if (mFilteredData[x]["varicella date"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])] == 0
						|| new Date(mFilteredData[x]["Last Done"][i]) > new Date(mFilteredData[x]["varicella date"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])]))
						mFilteredData[x]["varicella date"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])] = new Date(mFilteredData[x]["Last Done"][i]);
				}
				// meningococcal conjugate
				if (preventionTypes[i] == "MenC-C" || preventionTypes[i] == "MEN-CONJ-ACWY") {
					mFilteredData[x]["meningococcal conjugate"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])] += Number(mFilteredData[x]["Times Done"][i]);
					if (mFilteredData[x]["meningococcal conjugate date"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])] == 0
						|| new Date(mFilteredData[x]["Last Done"][i]) > new Date(mFilteredData[x]["meningococcal conjugate date"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])]))
						mFilteredData[x]["meningococcal conjugate date"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])] = new Date(mFilteredData[x]["Last Done"][i]);
				}
				// pneumococcal conjugate
				if (preventionTypes[i] == "Pneu-C") {
					mFilteredData[x]["pneumococcal conjugate"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])] += Number(mFilteredData[x]["Times Done"][i]);
					if (mFilteredData[x]["pneumococcal conjugate date"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])] == 0
						|| new Date(mFilteredData[x]["Last Done"][i]) > new Date(mFilteredData[x]["pneumococcal conjugate date"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])]))
						mFilteredData[x]["pneumococcal conjugate date"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])] = new Date(mFilteredData[x]["Last Done"][i]);
				}
				// rotavirus
				if (preventionTypes[i] == "Rot") {
					mFilteredData[x]["rotavirus"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])] += Number(mFilteredData[x]["Times Done"][i]);
					if (mFilteredData[x]["rotavirus date"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])] == 0
						|| new Date(mFilteredData[x]["Last Done"][i]) > new Date(mFilteredData[x]["rotavirus date"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])]))
						mFilteredData[x]["rotavirus date"][mFilteredData[x]["unique patients"].indexOf(mFilteredData[x]["Patient #"][i])] = new Date(mFilteredData[x]["Last Done"][i]);
				}
			}
		}

		mFilteredData[x]["Patient #"] = mFilteredData[x]["unique patients"];

	};

	/*
	 * Creates a new column to show which patients are ADHD patients on medication
	 */
	function identifyADHD(x) {
		var newList = [];
		for (var i=0; i<mFilteredData[x]["Patient #"].length; i++) {
			if (mFilteredData[x]["onMedication"][i] == "yes" && mFilteredData[x]["ADHD"][i] != "") {
				newList.push(mFilteredData[x]["Patient #"][i]);
			}
		}
		mFilteredData[x]["Filtered Patients"] = newList;
	};

	/*
	 * Return the date that each report was generated in an array
	 */
	function getDateArray() {
		
		var arrayDates = [];
		
		if (mParsedData.length > 0) {
			for (var i=0; i<mParsedData.length; i++) {
				if (mParsedData[i].hasOwnProperty("Current Date")) {
					if (mParsedData[i]["Current Date"].length > 0) {
						var fileDate = "";
						var currentDate = mParsedData[i]["Current Date"][0];
						if (currentDate.toString().match(/\d{2}[/-]\d{2}[/-]\d{4}/)){
			 				var parsedDate = currentDate.split(new RegExp("[-/]"));
			 				fileDate = new Date(parsedDate[2], parsedDate[1]-1, parsedDate[0]);
			 			} else if (currentDate.toString().match(/\d{4}-\d{2}-\d{2}/)){
			 				var parsedDate = currentDate.split("-");
			 				fileDate = new Date(parsedDate[0], parsedDate[1]-1, parsedDate[2]);
			 			} else {
			 				fileDate = new Date(currentDate + " EST");
			 			}
						
						arrayDates.push(fileDate);
					} else {
						arrayDates.push(mParsedData[i]['fileLastModified']);
					}
				} else {
					arrayDates.push(mParsedData[i]['fileLastModified']);
				}
			}
		}
		return arrayDates;
	};
	
	function getPatientCounts() {
		var arrayPatientCounts = [];
		if (mParsedData.length > 0) {
			for (var i=0; i<mParsedData.length; i++) {
				arrayPatientCounts.push(mParsedData[i]["num_elements"]);
			}
		}
		return arrayPatientCounts;
	}
	

	/*
	 * Get filtered data
	 * Apply indicator sets to filtered data
	 * Pass necessary data to mdsViewer to display chart
	 */
	function calculate() {
		
		filterData();
		
		mdsViewer.generateCharts(
				mCurrentIndSetIndex, //selected Rule List
				mdsIndicators.applyRules(mCurrentIndSetIndex, mFilteredData),
			 	mSelectedPhysicians,
			 	getDateArray(),
			 	getPatientCounts()
			 	);
	};
	
	/*
	 * Same as calculate above but passed updated information from mdsViewer
	 * based on user interaction
	 */
	function reCalculate(currentRuleSetIndex, selectedPhysicians) {
		//This function is called from mdsViewer when the user deselects/reselects
		//physicians, hence the selectedPhysicians from mdsViewer is used in GenerateCharts
		mSelectedPhysicians = selectedPhysicians;
		mCurrentIndSetIndex = currentRuleSetIndex;
		
		calculate();
	};
	
	/*
	 * Expose readFiles to index.html
	 * Expose reCalculate to mdsViewer when user makes changes 
	 * 		to selectedPhysicians or current indicator set
	 */
	return {
		readFiles: readFiles,
		reCalculate: reCalculate,
		getmFilteredData: function() { return mFilteredData; }
	};
	
})();


/*

Array.prototype.indicesOfElementsInArrayIndex = function(arr) {
	var index = [];
	for (i=0; i<this.length; i++) {
		if (arr.indexOf(this[i]) != -1) {
			index.push(i);
		}
	}
	return index;
};

*/


/*
 * Repeat a value L times
 * Used to populate an array of identical elements
 * (Silly, I know)
 */
repeat = function(what, L){
	var arr = [];
	while(L) arr[--L]= what;
	return arr;
};
