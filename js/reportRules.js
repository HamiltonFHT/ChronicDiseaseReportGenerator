var reportRules =  (function(){
	// Default comparison values for diabetic measures, based on Clinical Practice Guidelines and what we are asked to tracked in the report generator.
	// NOTE: These are the DEFAULT values for comparison. There will be a settings menu to allow the user to modify these comparison values based on 
	// their clinical judgement and what they want to track.
	// TO CHANGE: Other chronic conditions will have other constant values
	/*
	var DEFAULT_VALUE_DIABETIC_ASSESSMENT = 12;		// months
	var DEFAULT_VALUE_A1C_MEASURED = 3;				// months
	var DEFAULT_VALUE_A1C_COMPARED = 0.07;			// less than or equal to
	var DEFAULT_VALUE_BP_MEASURED = 6;				// months
	var DEFAULT_VALUE_BP_SYS_COMPARED = 130;		// less than
	var DEFAULT_VALUE_BP_DIAS_COMPARED = 80;		// less than
	var DEFAULT_VALUE_LDL_MEASURED = 12;			// months
	var DEFAULT_VALUE_LDL_COMPARED = 2;				// less than or equal to
	var DEFAULT_VALUE_ACR_MEASURED = 12;			// months
	var DEFAULT_VALUE_ACR_MALE_COMPARED = 2.0;		// less than
	var DEFAULT_VALUE_ACR_FEMALE_COMPARED = 2.8;	// less than
	var DEFAULT_VALUE_EGFR_MEASURED = 12;			// months
	var DEFAULT_VALUE_EGFR_COMPARED = 60;		// greater than
	*/
	
	var DEFAULT_DATE_FORMAT = d3.time.format("%b %d, %Y");
	var DEFAULT_CURR_DATE_FORMAT = d3.time.format("%d/%m/%Y");
	
	function removeMonths(date, months) {
  		date.setMonth(date.getMonth() - months);
  		return date;
	}

	/*
	* calculateMonthsDifference:
	* - Helper function
	* - Calculates the difference between two dates in months. Returns an absolute value
	*
	* @param date1 The first date for comparison
	* @param date2 The second date for comparison
	*
	* @return Returns the absolute number of months difference date1 and date2
	*/
	function calculateMonthsDifference(date1, date2) {
		var monthsDiff = date1.getMonth() - date2.getMonth();
		var yearsDiff = (date1.getFullYear() - date2.getFullYear()) * 12;
		return Math.abs(monthsDiff + yearsDiff);
	}
	
	
	
	
	/*
	* calculateMonthsSince:
	* @param date A Javascript Date object as a reference point for date calculation
	* @param numMonths The number of months to look ahead
	*
	* @return Returns a new Date object with numMonths prior to date
	*/
	function calculateMonthsSince(date, numMonths) {
		return new Date(date.setMonth(date.getMonth() - numMonths));
	}
	
	
	var ruleA1cInLast6Months = {
		desc: "# of patients with A1c measured in last 6 months",
	 	col: ["Current Date", "Date Hb A1c"],
	 	rule: function(currentDate, HbA1c_Date) {
	 		try {
	 			//new Date accepts date string in format YYYY-MM-DD
	 			//currentDate is in format DD/MM/YYYY
	 			if (currentDate.match(/\d{2}\/\d{2}\/\d{4}/) ){
	 				parsedDate = currentDate.split("/");
	 				sixMonthsAgo = removeMonths(new Date(parsedDate[2], parsedDate[1]-1, parsedDate[0]), 6);
	 			} else {
	 				sixMonthsAgo = removeMonths(new Date(currentDate), 6);
	 			}
	 			return (new Date(HbA1c_Date) >= sixMonthsAgo);
	 		} catch (err) {
	 			// Field is likely blank
	 			return false;
	 		}
	 		
	 	}
	};
	
	
	
	var ruleA1cLessThan0_08 = {
		desc: "Patients with A1c less than 0.08",
	 	col: ["Hb A1c"],
	 	rule: function(Hb_A1c) {
	 		try {
	 			return (parseFloat(Hb_A1c) < 0.08);
	 		} catch (err) {
	 			// Field is likely blank
	 			return false;
	 		}
	 		
	 	}
	};
	
	var ruleLDLInLast12Months = {
		desc: "Diabetic Patients with LDL measured within the last 12 months",
		col: ["Current Date", "Date LDL"],
		rule: function(currentDate, dateLDL) {
			 try {
	 			//new Date accepts date string in format YYYY-MM-DD
	 			//currentDate is in format DD/MM/YYYY
	 			if (currentDate.match(/\d{2}\/\d{2}\/\d{4}/) ){
	 				parsedDate = currentDate.split("/");
	 				twelveMonthsAgo = removeMonths(new Date(parsedDate[2], parsedDate[1]-1, parsedDate[0]), 12);
	 			} else {
	 				twelveMonthsAgo = removeMonths(new Date(currentDate), 12);
	 			}
	 			return (new Date(dateLDL) >= twelveMonthsAgo);
	 		} catch (err) {
	 			// Field is likely blank
	 			return false;
	 		}
		}
	};

	var diabetesRules = [ruleA1cInLast6Months, ruleA1cLessThan0_08, ruleLDLInLast12Months];

	function applyRules(parsedData, physicianIndex) {
		//Loop through data from each file
		var filteredData = [{}];
		
		for (var i = 0; i < parsedData.length; i++) {
			//Initialize filteredData if required
			//TODO Does this need to be global? Likely not
			//Work around for asynch function calls
			//Make sure filtering is finished before checking rules on them
			var keysLeft = Object.keys(parsedData[i]).length;
			
			//For each column in the file
			for (var key in parsedData[i]) {
				
				//If this is a data element (i.e. an array) and not a property element (i.e. a file name)
				if (parsedData[i][key].length == parsedData[i]['num_elements'] &&
					parsedData[i][key].length != undefined) {
						
					//Add the element from parsedData if the user selected it (i.e. it's index is in the physicianList)
					for (var j = 0; j < physicianIndex.length; j++) {
						var ind = physicianIndex[j];
						//Add the key to filteredData if it doesn't have it
						if (!filteredData[i].hasOwnProperty(key)) {
							filteredData[i][key] = [];
						}
						//Add the element
						filteredData[i][key].push(parsedData[i][key][ind]);
					}
				}
				--keysLeft;
				//TODO - promise pattern to make sure this runs at the right time?
				//This current method seems a bit hacky
				if (keysLeft == 0) {
					return checkRules(filteredData[i], diabetesRules);
				}
			}
		}
	}


	function checkRules(csvObject, ruleList) {
	
		var results = [];
		
		forRule:
		for (var r = 0; r < ruleList.length; r++) {
			currentRule = ruleList[r];
			var passed = [];
		
			for (i=0; i<currentRule.col.length; i++) {
				if (!csvObject.hasOwnProperty(currentRule.col[i])) {
					console.log("File has no column named " + currentRule.col[i]);
					console.log("Can't check rule: " + currentRule.desc);
					//Break out to the next rule
					// TODO - What do I really want to do here?
					// Skip the rule entirely, count it as 0, or code it is -1 and handle appropriately in the viewer?
					/*
					results.push({	
							desc: currentRule.desc,
						  	passed: 0,
						  	total: num_items
					});
					*/
					continue forRule;
				}
			}
			
			num_items = csvObject[currentRule.col[0]].length;
			var num_params = currentRule.col.length;
			
			switch (num_params) {
				case 1:
					for (i = 0; i < num_items; i++) {
						passed.push(currentRule.rule(csvObject[currentRule.col[0]][i]));
					}
					break;
				case 2:
					for (i = 0; i < num_items; i++) {
						passed.push(currentRule.rule(csvObject[currentRule.col[0]][i], csvObject[currentRule.col[1]][i]));
					}
					break;
				case 3:
					for (i = 0; i < num_items; i++) {
						passed.push(currentRule.rule(csvObject[currentRule.col[0]][i], csvObject[currentRule.col[1]][i], csvObject[currentRule.col[2]][i]));
					}
					break;
				default:
					console.log("Does not support this many parameters yet");
			}
			
			//Count the number of cases that passed the test
			results.push({	
					desc: currentRule.desc,
				  	passed: passed.filter(function(e) { return (e == true); }).length,
				  	total: num_items
			});
		}	
		return results;
	}
	
	return {
		//calculateCountDiabeticMeasure: calculateCountDiabeticMeasure,
		applyRules: applyRules,
	};
	
	console.log("Finished initializing reportRules");
	
})();