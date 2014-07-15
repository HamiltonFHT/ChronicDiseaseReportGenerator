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

//Single Object that holds all data variables and data manipulation functions
var reportData = (function() {
	//var dataSource = [];
	var physicianIndex = [];
	var selectedPhysicians = [];
	var parsedData = [];
	var mode = "";
	
	function ReadFiles(files) {

		physicianIndex = [];
		selectedPhysicians = [];
		parsedData = [];

	   mode = (files.length == 1) ? "snapshot" : "tracking";
	   
	   filesLeftToRead = files.length;
	   
	   if (files.length == 0) {
	   		reportViewer.ClearCanvas();
	   }
	   
	   
		for (i = 0; i < files.length; i++) {
			var f = files[i]; 
			
			if (!f) {
			   alert("Failed to load file");
			   reportViewer.ClearCanvas();
			} else if (!f.type.match(/^text*/)) {
			    alert(f.name + " is not a valid text file.");
			    reportViewer.ClearCanvas();
			} else {
			 	var r = new FileReader();
			  	r.onload = (function(f) { 
			  		return function(e) { 
			    		var contents = e.target.result;
			    		parsedData.push(ParseToObject(f, contents));
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
							
							parsedData.sort(compare);
							Calculate();
			    		}
			 		};
			 	})(f);
			 }
			 r.readAsText(f);
		}
	};

	function ParseToObject(f, unparsed) {

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
			arrData.pop();
		}
		csvObject["num_elements"] = arrData.length;

		//PSS include a blank column
		if (csvObject.hasOwnProperty("")) {
			delete csvObject[""];
		}
		if (!csvObject.hasOwnProperty("Current Date")) {
			csvObject["Current Date"] = [].repeat(csvObject["fileLastModified"], arrData.length);
		}
		
		return csvObject;
	};
	
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
		
	function GetFilteredData(selectedPhysicians) {
		
		
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
		if (selectedPhysicians.length == 0) {
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
				if (parsedData[i][key].length == parsedData[i]['num_elements'] &&
					parsedData[i][key].length != undefined) {
					
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
				filteredData[i]["Current Date"] = [].repeat(parsedData[i]["fileLastModified"], filteredData[i][0].length);
			}
		}

		return {filteredData: filteredData, selectedPhysicians: selectedPhysicians};
	};

	function GetDateArray() {
		
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

	function Calculate() {
		
		physObj = GetFilteredData(selectedPhysicians);
		
		reportViewer.GenerateCharts(
				0, //selected Rule List
				reportRules.ApplyRules(0, physObj.filteredData),
			 	physObj.selectedPhysicians,
			 	GetDateArray()
			 	);
	};
	
	function ReCalculate(rV_currentRuleList, rV_selectedPhysicians) {
		//This function is called from reportViewer when the user deselects/reselects
		//physicians, hence the selectedPhysicians from reportViewer is used in GenerateCharts
		
		physObj = GetFilteredData(rV_selectedPhysicians);
		
		reportViewer.GenerateCharts(
				rV_currentRuleList,
				reportRules.ApplyRules(rV_currentRuleList, physObj.filteredData),
			 	physObj.selectedPhysicians,
			 	GetDateArray());
	};
	
	return {
		ReadFiles: ReadFiles,
		ReCalculate: ReCalculate
	};
	
})();

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
