//Single Object that holds all data variables and data manipulation functions
var reportData = (function() {
	//var dataSource = [];
	
	var DEFAULT_DATE_FORMAT = d3.time.format("%b %d, %Y");
	var DEFAULT_CURR_DATE_FORMAT = d3.time.format("%d/%m/%Y");

	var physicianIndex = [];
	var selectedPhysicians = [];
	//var rawData = [];
	var parsedData = [];
	//var filteredData = [];
	//var calculatedData = [];
	//var arrayLastModifiedDate = [];
	//var arrayDates = [];
	var mode = "";

	
	function readFiles(files) {

		physicianIndex = [];
		selectedPhysicians = [];
		parsedData = [];

	   mode = (files.length == 1) ? "snapshot" : "tracking";
	   
	   filesLeftToRead = files.length;
	   
	   if (files.length == 0) {
	   		reportViewer.clearCanvas();
	   }
	   
	   
		for (i = 0; i < files.length; i++) {
			var f = files[i]; 
			
			if (!f) {
			   alert("Failed to load file");
			   reportViewer.clearCanvas();
			} else if (!f.type.match(/^text*/)) {
			    alert(f.name + " is not a valid text file.");
			    reportViewer.clearCanvas();
			} else {
			 	var r = new FileReader();
			  	r.onload = (function(f) { 
			  		return function(e) { 
			    		var contents = e.target.result;
			    		parsedData.push(parseToObject(f, contents));
			    		//TODO replace with Promise pattern
			    		--filesLeftToRead;
			    		if (filesLeftToRead == 0) {
					
							calculate();
			    		}
			 		};
			 	})(f);
			 }
			 r.readAsText(f);
		}
	}
		

	function parseToObject(f, unparsed) {

		csvObject = {};
		csvObject['fileName'] = f.name;
		csvObject['fileLastModified'] = f.lastModifiedDate;
	
		arrData = CSVToArray(unparsed);
		
		if (arrData[0].length == 0) {
			arrData.shift();
		}
		var csvHeaders = arrData.shift();
		
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
			csvObject["num_elements"] = arrData.length - 1;
		} else {
			csvObject["num_elements"] = arrData.length;
		}
		
		//PSS include a blank column
		if (csvObject.hasOwnProperty("")) {
			delete csvObject[""];
		}
		if (!csvObject.hasOwnProperty("Current Date")) {
			csvObject["Current Date"] = [].repeat(csvObject["fileLastModified"], count);
		}
		
		return csvObject;
	}
	
		
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
	}
		
	function getPhysicianIndex(selectedPhysicians) {
		// Loop through each CSV file imported
		for (var i = 0; i < parsedData.length; i++) {
			var uniquePhysicians = parsedData[i]["Doctor Number"].filter(uniqueDocs);
			
			if (selectedPhysicians.length == 0) {
				for (var j = 0; j < uniquePhysicians.length; j++) {
					selectedPhysicians[uniquePhysicians[j]] = true;
				}
				physicianIndex = parsedData[i]["Doctor Number"].indicesOfElementsInArrayIndex(uniquePhysicians);
			} else {
				var arrSelectedPhysicians = [];
				for (p in selectedPhysicians) {
					if (selectedPhysicians.hasOwnProperty(p) &
						selectedPhysicians[p] == true) {
						arrSelectedPhysicians.push(p);
					}
				}
				physicianIndex = parsedData[i]["Doctor Number"].indicesOfElementsInArrayIndex(arrSelectedPhysicians);
			}
		}
		return {physicianIndex: physicianIndex, selectedPhysicians: selectedPhysicians};
	}
	
	function getDateArray() {
		var arrayDates = [];
		if (parsedData.length > 0) {
			for (var i=0; i<parsedData.length; i++) {
				if (parsedData[i].hasOwnProperty("Current Date")) {
					if (parsedData[i]["Current Date"].length > 0) {
						arrayDates.push(parsedData[i]["Current Date"].pop());
					} else {
						arrayDates.push(parsedData[i]['fileLastModified']);
					}
				} else {
					arrayDates.push(parsedData[i]['fileLastModified']);
				}
				
			}
		}
		return arrayDates;
	}


	function uniqueDocs(value, index, self) {
		return self.indexOf(value) === index;
	}
	function selectedDocs(value) {
		return (selectedPhysicianList.indexOf(value) != -1);
	}
	function calculate() {
		
		physObj = getPhysicianIndex(selectedPhysicians);
		
		reportViewer.generateCharts(
				reportRules.applyRules(parsedData, physObj.physicianIndex),
			 	physObj.selectedPhysicians,
			 	getDateArray());
	}
	function reCalculate(rV_selectedPhysicians) {
		//This function is called from reportViewer when the user deselects/reselects
		//physicians, hence the selectedPhysicians from reportViewer is used in generateCharts
		
		physObj = getPhysicianIndex(rV_selectedPhysicians);
		
		reportViewer.generateCharts(
				reportRules.applyRules(parsedData, physObj.physicianIndex),
			 	physObj.selectedPhysicians,
			 	getDateArray());
	}

	/*
	* calculateDataTrackingMode:
	* - Calculates data for Tracking mode
	* - Retrieves index of diabetic measures drop down menu and create array of counts for that measure
	* TODO - Eliminate
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
	//function getCalculatedData() {
	//	return calculatedData;
	//}
	//function getMode() {
	//	return mode;
	//}
	//function getArrayDates() {
	//	return arrayDates;
	//}
	
	return {
		readFiles: readFiles,
		reCalculate: reCalculate,
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

Array.prototype.indicesOfElementsInArrayIndex = function(arr) {
	var index = [];
	for (i=0; i<this.length; i++) {
		if (arr.indexOf(this[i]) != -1) {
			index.push(i);
		}
	}
	return index;
};

Array.prototype.repeat= function(what, L){
	while(L) this[--L]= what;
	return this;
};
