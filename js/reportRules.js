var reportRules =  (function(){
	// Default comparison values for diabetic measures, based on Clinical Practice Guidelines and what we are asked to tracked in the report generator.
	// NOTE: These are the DEFAULT values for comparison. There will be a settings menu to allow the user to modify these comparison values based on 
	// their clinical judgement and what they want to track.
	// TO CHANGE: Other chronic conditions will have other constant values
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
	
	// Default diabetic measures index in dropdown menu - for Tracking Mode
	var DEFAULT_INDEX_DIABETIC_ASSESSMENT = 0;
	var DEFAULT_INDEX_A1C_MEASURED = 1;
	var DEFAULT_INDEX_A1C_COMPARED = 2;
	var DEFAULT_INDEX_BP_MEASURED = 3;
	var DEFAULT_INDEX_BP_COMPARED = 4;
	var DEFAULT_INDEX_LDL_MEASURED = 5;
	var DEFAULT_INDEX_LDL_COMPARED = 6;
	var DEFAULT_INDEX_ACR_MEASURED = 7;
	var DEFAULT_INDEX_ACR_MALE_COMPARED = 8;
	var DEFAULT_INDEX_ACR_FEMALE_COMPARED = 9;
	var DEFAULT_INDEX_EGFR_MEASURED = 10;
	var DEFAULT_INDEX_EGFR_COMPARED = 11;
	var DEFAULT_INDEX_NUM_RETINOPATHY = 12;
	var DEFAULT_INDEX_NUM_SELF_MANAGEMENT = 14;
	var DEFAULT_INDEX_NUM_CURRENT_SMOKERS = 15;
	
	var DEFAULT_DATE_FORMAT = d3.time.format("%b %d, %Y");
	var DEFAULT_CURR_DATE_FORMAT = d3.time.format("%d/%m/%Y");
	
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
	
	var filteredData = [{}];
	
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
	 	col: ["Hb A1C"],
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
		for (var i = 0; i < parsedData.length; i++) {
			if (filteredData.length < i) {
				filteredData.push([]);
			}
			var keysLeft = Object.keys(parsedData[i]).length;
			//For each column in the file
			for (var key in parsedData[i]) {
				//If this is a data element (i.e. an array) and not a property element
				if (parsedData[i][key].length == parsedData[i]['num_elements'] &&
					parsedData[i][key].length != undefined) {
					//Add the element from parsedData if it is current selected (i.e. it's index is in the physicianList)
					for (var j = 0; j < physicianIndex.length; j++) {
						var ind = physicianIndex[j];
						if (!filteredData[i].hasOwnProperty(key)) {
							filteredData[i][key] = [];
						}
						filteredData[i][key].push(parsedData[i][key][ind]);
					}
				}
				--keysLeft;
				//TODO - promise pattern to make sure this runs at the right time
				if (keysLeft == 0) {
					checkRules(filteredData[i], diabetesRules);
				}
			}

		}
	}


	function checkRules(csvObject, ruleList) {
	
		//console.log("Checking File: " + csvObject["fileName"]);
		
		forRule:
		for (r = 0; r < ruleList.length; r++) {
			currentRule = ruleList[r];
			var passed = [];
		
			for (i=0; i<currentRule.col.length; i++) {
				if (!csvObject.hasOwnProperty(currentRule.col[i])) {
					console.log("File has no column named " + currentRule.col[i]);
					console.log("Can't check rule: " + currentRule.desc);
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
			console.log(currentRule.desc);
			console.log(passed.filter(function(e) { return (e == true); }).length);
			
		}
	}
		

	/*
	// Functions for calculating patients counts for specific diabetic measures
	function calculateCountDiabeticMeasure(fileIndex, measureIndex) {
		
		// Reset the count
		var count = 0;
		
		// Loop through each patient (skip header row)
		for (var i = 1; i < reportData.filteredData[fileIndex].length; i++) {
			
			switch (measureIndex) {
			
				// Diabetic Assessment
				case DEFAULT_INDEX_DIABETIC_ASSESSMENT:
					if (new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_DM_MONTHS]))
						>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_DIABETIC_ASSESSMENT))
						count++;
					break;
					
				// A1C measured
				case DEFAULT_INDEX_A1C_MEASURED:
					if (new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_A1C_DATE]))
						>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_A1C_MEASURED))
						count++;
					break;
					
				// A1C compared
				case DEFAULT_INDEX_A1C_COMPARED:
					if (new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_A1C_DATE]))
						>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_A1C_MEASURED)
						&& parseFloat(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_A1C]) <= DEFAULT_VALUE_A1C_COMPARED)
						count++;
					break;			
				
				// BP measured
				case DEFAULT_INDEX_BP_MEASURED:
					if (new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_SYSTOLIC_BP_DATE]))
						>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_BP_MEASURED)
						&& new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_DIASTOLIC_BP_DATE]))
						>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_BP_MEASURED))
						count++;
					break;
					
				// BP compared
				case DEFAULT_INDEX_BP_COMPARED:
					if ((new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_SYSTOLIC_BP_DATE]))
						>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_BP_MEASURED)
						&& new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_DIASTOLIC_BP_DATE]))
						>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_BP_MEASURED))
						&& (parseFloat(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_SYSTOLIC_BP]) < DEFAULT_VALUE_BP_SYS_COMPARED
						|| parseFloat(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_DIASTOLIC_BP]) < DEFAULT_VALUE_BP_DIAS_COMPARED))
						count++;
					break;
				
				// LDL measured
				case DEFAULT_INDEX_LDL_MEASURED:
					if (new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_LDL_DATE]))
						>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_LDL_MEASURED))
						count++;
					break;
					
				// LDL compared
				case DEFAULT_INDEX_LDL_COMPARED:
					if (new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_LDL_DATE]))
						>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_LDL_MEASURED)
						&& (parseFloat(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_LDL]) <= DEFAULT_VALUE_LDL_COMPARED
						|| reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_LDL] == "<1.00"))
						count++;
					break;
					
				// ACR measured
				case DEFAULT_INDEX_ACR_MEASURED:
					if ((new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_ACR_DATE]))
						>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_ACR_MEASURED))
						&& reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_ACR] != "unable to do")
						count++;
					break;
				
				// ACR compared male
				case DEFAULT_INDEX_ACR_MALE_COMPARED:
					if ((new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_ACR_DATE]))
						>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_ACR_MEASURED))
						&& reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_PATIENT_SEX] == "M"
						&& (reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_ACR] == "<2.0"
						|| parseFloat(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_ACR]) < DEFAULT_VALUE_ACR_MALE_COMPARED)) {
						count++;
						//console.log(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_PATIENT_NUMBER] + " " + reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_ACR]);
						}
					break;
					
				// ACR compared female
				case DEFAULT_INDEX_ACR_FEMALE_COMPARED:
					if ((new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_ACR_DATE]))
						>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_ACR_MEASURED))
						&& reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_PATIENT_SEX] == "F"
						&& (reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_ACR] == "<2.8"
						|| parseFloat(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_ACR]) < DEFAULT_VALUE_ACR_FEMALE_COMPARED))
						count++;
					break;
					
				// eGFR measured
				case DEFAULT_INDEX_EGFR_MEASURED:
					if (new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_EGFR_DATE]))
						>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_EGFR_MEASURED))
						count++;
					break;
				
				// eGFR compared
				case DEFAULT_INDEX_EGFR_COMPARED:
					if (new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_EGFR_DATE]))
						>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_EGFR_MEASURED)
						&& (reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_EGFR] == ">=90"
						|| reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_EGFR] == ">120"
						|| parseFloat(reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_EGFR]) > DEFAULT_VALUE_EGFR_COMPARED))
						count++;
					break;
				
				// Num retinopathy
				case DEFAULT_INDEX_NUM_RETINOPATHY:
					if (reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_RETINOPATHY] == "Y"
						|| reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_RETINOPATHY] == "true")
						count++;
					break;
				
				
				// Num foot checks
				//case DEFAULT_INDEX_NUM_FOOT_CHECKS:
				//	if (reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_FOOT_CHECK] == "Y"
				//		|| reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_FOOT_CHECK] == "true")
				//		count++;
				//	break;
				
				
				// Num self management
				case DEFAULT_INDEX_NUM_SELF_MANAGEMENT:
					if (reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_SELF_MANAGEMENT] == "Y"
						|| reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_SELF_MANAGEMENT] == "true")
						count++;
					break;
				
				// Num current smokers
				case DEFAULT_INDEX_NUM_CURRENT_SMOKERS:
					if (reportData.filteredData[fileIndex][i][DEFAULT_COLUMN_RISK].indexOf("current smoker") != -1)
						count++;
					break;
			}
		}
		
		return count;
	
	}
	*/
	
	return {
		//calculateCountDiabeticMeasure: calculateCountDiabeticMeasure,
		applyRules: applyRules,
		DEFAULT_VALUE_DIABETIC_ASSESSMENT: DEFAULT_VALUE_DIABETIC_ASSESSMENT,
		DEFAULT_VALUE_A1C_MEASURED: DEFAULT_VALUE_A1C_MEASURED,				// months
		DEFAULT_VALUE_A1C_COMPARED: DEFAULT_VALUE_A1C_COMPARED,			// less than or equal to
		DEFAULT_VALUE_BP_MEASURED: DEFAULT_VALUE_BP_MEASURED,				// months
		DEFAULT_VALUE_BP_SYS_COMPARED: DEFAULT_VALUE_BP_SYS_COMPARED,		// less than
		DEFAULT_VALUE_BP_DIAS_COMPARED: DEFAULT_VALUE_BP_DIAS_COMPARED,		// less than
		DEFAULT_VALUE_LDL_MEASURED: DEFAULT_VALUE_LDL_MEASURED,			// months
		DEFAULT_VALUE_LDL_COMPARED: DEFAULT_VALUE_LDL_COMPARED,				// less than or equal to
		DEFAULT_VALUE_ACR_MEASURED: DEFAULT_VALUE_ACR_MEASURED,			// months
		DEFAULT_VALUE_ACR_MALE_COMPARED: DEFAULT_VALUE_ACR_MALE_COMPARED,		// less than
		DEFAULT_VALUE_ACR_FEMALE_COMPARED: DEFAULT_VALUE_ACR_FEMALE_COMPARED,	// less than
		DEFAULT_VALUE_EGFR_MEASURED: DEFAULT_VALUE_EGFR_MEASURED,			// months
		DEFAULT_VALUE_EGFR_COMPARED: DEFAULT_VALUE_EGFR_COMPARED,		// greater than
		
		// Default diabetic measures index in dropdown menu - for Tracking Mode
		DEFAULT_INDEX_DIABETIC_ASSESSMENT : DEFAULT_INDEX_DIABETIC_ASSESSMENT,
		DEFAULT_INDEX_A1C_MEASURED: DEFAULT_INDEX_A1C_MEASURED,
		DEFAULT_INDEX_A1C_COMPARED: DEFAULT_INDEX_A1C_COMPARED,
		DEFAULT_INDEX_BP_MEASURED: DEFAULT_INDEX_BP_MEASURED,
		DEFAULT_INDEX_BP_COMPARED: DEFAULT_INDEX_BP_COMPARED,
		DEFAULT_INDEX_LDL_MEASURED: DEFAULT_INDEX_LDL_MEASURED,
		DEFAULT_INDEX_LDL_COMPARED: DEFAULT_INDEX_LDL_COMPARED,
		DEFAULT_INDEX_ACR_MEASURED: DEFAULT_INDEX_ACR_MEASURED,
		DEFAULT_INDEX_ACR_MALE_COMPARED: DEFAULT_INDEX_ACR_MALE_COMPARED,
		DEFAULT_INDEX_ACR_FEMALE_COMPARED: DEFAULT_INDEX_ACR_FEMALE_COMPARED,
		DEFAULT_INDEX_EGFR_MEASURED: DEFAULT_INDEX_EGFR_MEASURED,
		DEFAULT_INDEX_EGFR_COMPARED: DEFAULT_INDEX_EGFR_COMPARED,
		DEFAULT_INDEX_NUM_RETINOPATHY: DEFAULT_INDEX_NUM_RETINOPATHY,
		DEFAULT_INDEX_NUM_SELF_MANAGEMENT: DEFAULT_INDEX_NUM_SELF_MANAGEMENT,
		DEFAULT_INDEX_NUM_CURRENT_SMOKERS: DEFAULT_INDEX_NUM_CURRENT_SMOKERS,
	};
	
	console.log("Finished initializing reportRules");
	
})();