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

/* reportData is a variable that handles the reading and parsing
 * of text files into a useable format and also filters data elements
 * based on user input in reportViewer. 
 * This variable also calls reportRules and reportViewer in order to
 * apply the indicator rules and display the results
 * 
*/

var reportData = (function() {
	//var dataSource = [];
	var physicianIndex = [];
	var selectedPhysicians = {};
	var parsedData = [];
	var currentRuleSet;
	
	/*
	 * Called by index.html when a file is uploaded by the user.
	 * Parses files and sorts by date and the calls calculate() to 
	 * apply indicators and display chart
	 */
	function readFiles(files) {

	   filesLeftToRead = files.length;
	   reportViewer.mode = "";
	   
	   if (files.length == 0) {
	   		return;
	   }
	   
		physicianIndex = [];
		selectedPhysicians = {};
		parsedData = [];
	   

	   
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
			    		parsedData.push(parseToObject(f, contents));
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
							for (var i=0; i < parsedData.length; i++) {
								if (parsedData[i]["num_elements"] == 0) {
								 	parsedData.splice(i, 1);
								} else {
									empty = false;
								}
							}
							if (empty) {
								alert("No patient records found in files");
								reportViewer.clearCanvas();
								throw new Error("No patient records found in files");
							}
							
							parsedData.sort(compare);
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
		
		currentRuleSet = reportRules.getCurrentRuleSet(csvHeaders);
		
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
	 * If selectedPhysicians is undefined it creates the variable and defaults
	 * to all physicians selected
	 */
	function getFilteredData(selectedPhysicians) {
		
		
		function uniqueDocs(value, pos, self) {
			return self.indexOf(value) === pos;
		}
		
		//uses global parsedDate
		
		var uniquePhysicians = [];
		// Loop through each CSV file imported
		for (var i = 0; i < parsedData.length; i++) {
			//array of array of unique physicians
			uniquePhysicians.push(parsedData[i]["Doctor Number"].filter(uniqueDocs));
		}
		
		//If selectedPhysicians is uninitialized, add all physicians and set to true
		if (Object.keys(selectedPhysicians).length == 0) {
			//Flatten and filter for only unique docs
			//array of all unique physicians
			flatUniquePhysicians = [].concat.apply([], uniquePhysicians).filter(uniqueDocs);
			for (var j = 0; j < flatUniquePhysicians.length; j++) {
				selectedPhysicians[flatUniquePhysicians[j]] = true;
			}
		}
		
		var filteredData = [];
		for (var i = 0; i < parsedData.length; i++) {
			
			//push new object for each file
			filteredData.push({});
			
			//For each column in the file
			for (var key in parsedData[i]) {
				
				//If this is a data element (i.e. an array) and not a property element (i.e. a file name)
				if (parsedData[i][key] instanceof Array) {
					
					//array per column
					//Add the key to filteredData if it doesn't have it
					if (!filteredData[i].hasOwnProperty(key)) {
						filteredData[i][key] = [];
					}
						
					//Add the element from parsedData if the user selected it (i.e. it's index is in the physicianList)
					for (var j = 0; j < parsedData[i][key].length; j++) {
						var docNum = parsedData[i]["Doctor Number"][j];
						if (selectedPhysicians[docNum] == true) {
							filteredData[i][key].push(parsedData[i][key][j]);
						}
					}
				}
			}
			if (!("Current Date" in filteredData[i])) {
				filteredData[i]["Current Date"] = repeat(parsedData[i]["fileLastModified"], filteredData[i][0].length);
			}
		}

		return {filteredData: filteredData, selectedPhysicians: selectedPhysicians};
	};

	/*
	 * Return the date that each report was generated in an array
	 */
	function getDateArray() {
		
		var arrayDates = [];
		
		if (parsedData.length > 0) {
			for (var i=0; i<parsedData.length; i++) {
				if (parsedData[i].hasOwnProperty("Current Date")) {
					if (parsedData[i]["Current Date"].length > 0) {
						var fileDate = "";
						var currentDate = parsedData[i]["Current Date"][0];
						if (currentDate.toString().match(/\d{2}\/\d{2}\/\d{4}/)){
			 				var parsedDate = currentDate.split("/");
			 				fileDate = new Date(parsedDate[2], parsedDate[0]-1, parsedDate[1]);
			 			} else {
			 				fileDate = new Date(currentDate);
			 			}
						
						arrayDates.push(fileDate);
					} else {
						arrayDates.push(parsedData[i]['fileLastModified']);
					}
				} else {
					arrayDates.push(parsedData[i]['fileLastModified']);
				}
			}
		}
		return arrayDates;
	};

	/*
	 * Get filtered data
	 * Apply indicator sets to filtered data
	 * Pass necessary data to reportViewer to display chart
	 */
	function calculate() {
		
		physObj = getFilteredData(selectedPhysicians);
		
		reportViewer.generateCharts(
				currentRuleSet, //selected Rule List
				reportRules.applyRules(currentRuleSet, physObj.filteredData),
			 	physObj.selectedPhysicians,
			 	getDateArray()
			 	);
	};
	
	/*
	 * Same as calculate above but passed updated information from reportViewer
	 * based on user interaction
	 */
	function reCalculate(rV_currentRuleList, rV_selectedPhysicians) {
		//This function is called from reportViewer when the user deselects/reselects
		//physicians, hence the selectedPhysicians from reportViewer is used in GenerateCharts
		
		physObj = getFilteredData(rV_selectedPhysicians);
		
		reportViewer.generateCharts(
				rV_currentRuleList,
				reportRules.applyRules(rV_currentRuleList, physObj.filteredData),
			 	physObj.selectedPhysicians,
			 	getDateArray());
	};
	
	/*
	 * Expose readFiles to index.html
	 * Expose reCalculate to reportViewer when user makes changes 
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
