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
			} else if (!f.type.match(/^text*/)) {
			    alert(f.name + " is not a valid text file.");
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
		var csvHeaders = arrData.shift();
		
		mCurrentIndSetIndex = mdsIndicators.getCurrentRuleSet(csvHeaders);
		
		for (var rowIndex = 0; rowIndex < arrData.length; rowIndex++) {
			var rowArray = arrData[rowIndex];
			for (var propIndex = 0; propIndex < rowArray.length; ++propIndex) {
				if (csvObject[csvHeaders[propIndex]] == undefined) {
					csvObject[csvHeaders[propIndex]] = [];
				}
				csvObject[csvHeaders[propIndex]].push(rowArray[propIndex]);

			}
		}
		
		if (arrData[arrData.length-1] == "") {
			arrData.pop();
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
		}
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
						if (currentDate.toString().match(/\d{2}\/\d{2}\/\d{4}/)){
			 				var parsedDate = currentDate.split("/");
			 				fileDate = new Date(parsedDate[2], parsedDate[1]-1, parsedDate[0]);
			 			} else {
			 				fileDate = new Date(currentDate);
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
			 	getDateArray()
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
		reCalculate: reCalculate
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
