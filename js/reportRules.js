var reportRules =  (function(){
	// Default comparison values for diabetic measures, based on Clinical Practice Guidelines and what we are asked to tracked in the report generator.
	// NOTE: These are the DEFAULT values for comparison. There will be a settings menu to allow the user to modify these comparison values based on 
	// their clinical judgement and what they want to track.
	// TO CHANGE: Other chronic conditions will have other constant values
	
	var DEFAULT_DATE_FORMAT = d3.time.format("%b %d, %Y");
	var DEFAULT_CURR_DATE_FORMAT = d3.time.format("%d/%m/%Y");
	
	function removeMonths(date, months) {
  		return new Date(date.setMonth(date.getMonth() - months));
  		//return date;
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
	
	
	
	var ruleDMPast12Months = {
		desc: function(){return "Diabetic Assessment in past " + this.months + " months"; },
		long_desc: function(){return "% of patients who have had a diabetic assessment in the past " + this.months + " months"; },
	 	months: 12,
	 	col: ["DM_months"],
	 	rule: function(measuredDate) {
	 		try {
				return (parseInt(measuredDate) <= this.months);
	 		} catch (err) {
	 			return false;
	 		}
	 	},
	};
	
	var ruleA1cPast3Months = {
		desc: function(){ return "A1c measured in last " + this.months + " months"; },
		long_desc: function(){return "# of patients with A1c measured in last " +  this.months + " months"; },
		months: 3,
	 	col: ["Current Date", "Date Hb A1c"],
	 	rule: function(currentDate, measuredDate) {
	 		try {
	 			if (currentDate.match(/\d{2}\/\d{2}\/\d{4}/) ){
	 				parsedDate = currentDate.split("/");
	 				targetDate = removeMonths(new Date(parsedDate[2], parsedDate[1]-1, parsedDate[0]), this.months);
	 			} else {
	 				targetDate = removeMonths(new Date(currentDate), this.months);
	 			}
	 			return (new Date(measuredDate) >= targetDate);
	 		} catch (err) {
	 			return false;
	 		}
	 	},
	};
	
	var ruleA1cLessThanEqualTo0_07Past3Months = {
		desc: function(){ return "A1c \u2264 " + this.target + " in past " + this.months + " months"; },
		long_desc: function(){return "% of patients with A1c less than or equal to " + this.target + " measured in the past " + this.months + " months";},
	 	col: ["Current Date", "Date Hb A1c", "Hb A1c"],
		target: 0.07,
		months: 3,
	 	rule: function(currentDate, measuredDate, value) {
	 		try {
	 			if (currentDate.match(/\d{2}\/\d{2}\/\d{4}/) ){
	 				parsedDate = currentDate.split("/");
	 				targetDate = removeMonths(new Date(parsedDate[2], parsedDate[1]-1, parsedDate[0]), this.months);
	 			} else {
	 				targetDate = removeMonths(new Date(currentDate), this.months);
	 			}
	 			return (new Date(measuredDate) >= targetDate &&
	 					parseFloat(value) <= this.target);
	 		} catch (err) {
	 			return false;
	 		}
	 	}
	};
	
	var ruleBPPast6Months = {
		desc: function(){return "BP measured in past " + this.months + " months";},
		long_desc: function(){return "% of patients with BP measured in past " + this.months + " months";},
	 	col: ["Current Date", "Date Systolic BP"],
	 	months: 6,
	 	rule: function(currentDate, measuredDate) {
	 		try {
	 			if (currentDate.match(/\d{2}\/\d{2}\/\d{4}/) ){
	 				parsedDate = currentDate.split("/");
	 				targetDate = removeMonths(new Date(parsedDate[2], parsedDate[1]-1, parsedDate[0]), this.months);
	 			} else {
	 				targetDate = removeMonths(new Date(currentDate), this.months);
	 			}
	 			return (new Date(measuredDate) >= targetDate);
	 		} catch (err) {
	 			return false;
	 		}
	 	},
	};
	
	var ruleBPLessThan130_80Last6Months = {
		desc: function(){return "BP < " + this.sysTarget + "/" + this.diasTarget +" in past " + this.months + " months";},
		long_desc: function(){return "% of patients with LDL less than or equal to 2.0";},
	 	col: ["Current Date", "Date Systolic BP", "Systolic BP", "Diastolic BP"],
	 	diasTarget: 80,
	 	sysTarget: 130,
	 	months: 6,
	 	rule: function(currentDate, measuredDate, sysValue, diasValue) {
	 		try {
	 			if (currentDate.match(/\d{2}\/\d{2}\/\d{4}/) ){
	 				parsedDate = currentDate.split("/");
	 				targetDate = removeMonths(new Date(parsedDate[2], parsedDate[1]-1, parsedDate[0]), this.months);
	 			} else {
	 				targetDate = removeMonths(new Date(currentDate), this.months);
	 			}
	 			return (new Date(measuredDate) >= targetDate &&
	 					(parseInt(diasValue) < this.diasTarget ||
	 					parseInt(sysValue) < this.sysTarget));
	 		} catch (err) {
	 			return false;
	 		}
	 	}
	};

	var ruleLDLPast12Months = {
		desc: function(){return "LDL measured within the last " + this.months + " months";},
		long_desc: function(){return "% of diabetic patients with LDL measured within the past " + this.months + " months";},
		col: ["Current Date", "Date LDL"],
		months: 12,
		rule: function(currentDate, measuredDate) {
			 try {
	 			//new Date accepts date string in format YYYY-MM-DD
	 			//currentDate is in format DD/MM/YYYY
	 			if (currentDate.match(/\d{2}\/\d{2}\/\d{4}/) ){
	 				parsedDate = currentDate.split("/");
	 				targetDate = removeMonths(new Date(parsedDate[2], parsedDate[1]-1, parsedDate[0]), this.months);
	 			} else {
	 				targetDate = removeMonths(new Date(currentDate), this.months);
	 			}
	 			return (new Date(measuredDate) >= targetDate);
	 		} catch (err) {
	 			// Field is likely blank
	 			return false;
	 		}
		}
	};
	
	var ruleLDLLessThanEqualTo2Past12Months = {
		desc: function(){return "LDL \u2264 " + this.target + " in past " + this.months + " months";},
		long_desc: function(){return "% of diabetic patients with LDL less than or equal to " + this.target + " measured within the past " + this.months + " months";},
		col: ["Current Date", "Date LDL", "LDL"],
		months: 12,
		target: 2.0,
		rule: function(currentDate, measuredDate, value) {
			 try {
	 			//new Date accepts date string in format YYYY-MM-DD
	 			//currentDate is in format DD/MM/YYYY
	 			if (currentDate.match(/\d{2}\/\d{2}\/\d{4}/) ){
	 				parsedDate = currentDate.split("/");
	 				targetDate = removeMonths(new Date(parsedDate[2], parsedDate[1]-1, parsedDate[0]), this.months);
	 			} else {
	 				targetDate = removeMonths(new Date(currentDate), this.months);
	 			}
	 			return (new Date(measuredDate) >= targetDate && 
	 			(parseFloat(value) <= this.target || value == "<1.00"));
	 		} catch (err) {
	 			// Field is likely blank
	 			return false;
	 		}
		}
	};
	
	var ruleACRLast12Months = {
		desc: function(){return "ACR measured in past " + this.months + " months"; },
		long_desc: function(){return "% of patients with ACR measured in past " + this.months + " months";},
		months: 12,
	 	col: ["Current Date", "Date Microalbumin/Creatinine Ratio", "Microalbumin/Creatinine Ratio"],
	 	rule: function(currentDate, measuredDate, value) {
	 		try {
	 			if (currentDate.match(/\d{2}\/\d{2}\/\d{4}/) ){
	 				parsedDate = currentDate.split("/");
	 				targetDate = removeMonths(new Date(parsedDate[2], parsedDate[1]-1, parsedDate[0]), this.months);
	 			} else {
	 				targetDate = removeMonths(new Date(currentDate), this.months);
	 			}

	 			return (new Date(measuredDate) >= targetDate && parseFloat(value) != NaN);
	 		} catch (err) {
	 			console.log("Error: " + err);
	 			return false;
	 		}
	 	},
	};
	
	var ruleACRMaleLessThan2 = {
		desc: "",
		long_desc: "",
	 	col: [""],
	 	rule: function(ACR) {
	 		try {
	 			
	 		} catch (err) {
	 			return false;
	 		}
	 	},
	};
	
	var ruleACRFemaleLessThan2_8 = {
		desc: "",
		long_desc: "",
	 	col: [""],
	 	rule: function(ACR) {
	 		try {
	 			
	 		} catch (err) {
	 			return false;
	 		}
	 	},
	};
	
	var ruleEGFRMeasuredPast12Months = {
		months: 12,
		desc: function(){return "EGFR measured in past " + this.months + " months";},
		long_desc: function(){return "% of patients with EGFR measured in the past " + this.months + " months";},
	 	col: ["Current Date", "Date eGFR"],
	 	rule: function(currentDate, measuredDate) { 
	 		try {
	 			if (currentDate.match(/\d{2}\/\d{2}\/\d{4}/) ){
	 				parsedDate = currentDate.split("/");
	 				targetDate = removeMonths(new Date(parsedDate[2], parsedDate[1]-1, parsedDate[0]), this.months);
	 			} else {
	 				targetDate = removeMonths(new Date(currentDate), this.months);
	 			}
	 			return (new Date(measuredDate) >= targetDate);
	 		} catch (err) {
	 			return false;
	 		}
	 	},
	};
	
	var ruleEGFRGreaterThan60Past12Months = {
		desc: function(){return "EGFR > " + this.target + " in past " + this.months + " months";},
		long_desc: function(){return "% of patients with EGFR greater than " + this.target + " measured in the past " + this.months + " months";},
	 	col: ["Current Date", "Date eGFR", "eGFR"],
		target: 60,
		months: 12,
	 	rule: function(currentDate, measuredDate, value) {
			try {
	 			if (currentDate.match(/\d{2}\/\d{2}\/\d{4}/) ){
	 				parsedDate = currentDate.split("/");
	 				targetDate = removeMonths(new Date(parsedDate[2], parsedDate[1]-1, parsedDate[0]), this.months);
	 			} else {
	 				targetDate = removeMonths(new Date(currentDate), this.months);
	 			}
	 			return (new Date(measuredDate) >= targetDate && 
	 			(parseInt(value) > this.target || value == ">=90" || value == ">120"));
	 		} catch (err) {
	 			return false;
	 		}
	 	},
	};

	var diabetesRules = [ruleDMPast12Months, ruleA1cPast3Months, ruleA1cLessThanEqualTo0_07Past3Months, ruleBPPast6Months, ruleBPLessThan130_80Last6Months, ruleLDLPast12Months, ruleLDLLessThanEqualTo2Past12Months, ruleACRLast12Months, ruleEGFRMeasuredPast12Months, ruleEGFRGreaterThan60Past12Months];

	function applyRules(filteredData) {
		//Loop through data from each file
		var results = [];
		
		//loop through each file
		for (var i = 0; i < filteredData.length; i++) {
			results.push(checkRules(filteredData[i], diabetesRules));
		}
		
		return results;
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
					console.log("Can't check rule: " + currentRule.desc());

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
						passed.push(currentRule.rule(csvObject[currentRule.col[0]][i], 
													 csvObject[currentRule.col[1]][i]));
					}
					break;
				case 3:
					for (i = 0; i < num_items; i++) {
						passed.push(currentRule.rule(csvObject[currentRule.col[0]][i],
													 csvObject[currentRule.col[1]][i],
													 csvObject[currentRule.col[2]][i]));
					}
					break;
				case 4:
					for (i = 0; i < num_items; i++) {
						passed.push(currentRule.rule(csvObject[currentRule.col[0]][i],
													 csvObject[currentRule.col[1]][i],
													 csvObject[currentRule.col[2]][i],
													 csvObject[currentRule.col[3]][i]));
					}
					break;
				default:
					console.log("Does not support this many parameters yet");
			}
			
			//Count the number of cases that passed the test
			results.push({	
					desc: currentRule.desc(),
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