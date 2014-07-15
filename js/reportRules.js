/*
	Chronic Disease Report Generator - Web based reports on quality of care standards
    Copyright (C) 2014  Tom Sitter - Hamilton Family Health Team

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
*/

var reportRules =  (function(){
	// Default comparison values for diabetic measures, based on Clinical Practice Guidelines and what we are asked to tracked in the report generator.
	// NOTE: These are the DEFAULT values for comparison. There will be a settings menu to allow the user to modify these comparison values based on 
	// their clinical judgement and what they want to track.
	// TO CHANGE: Other chronic conditions will have other constant values
	
	var DEFAULT_DATE_FORMAT = d3.time.format("%b %d, %Y");
	var DEFAULT_CURR_DATE_FORMAT = d3.time.format("%d/%m/%Y");
	
	function RemoveMonths(date, months) {
  		return new Date(date.setMonth(date.getMonth() - months));
	};

	// Checks if the measuredDate is within maxMonthsAgo of the currentDate
	// Return true if it is in-date and false if it is out-of-date
	function WithinDateRange(currentDate, maxMonthsAgo, measuredDate) {
		if (currentDate.toString().match(/\d{2}\/\d{2}\/\d{4}/) ){
	 		parsedDate = currentDate.split("/");
	 		targetDate = RemoveMonths(new Date(parsedDate[2], parsedDate[1]-1, parsedDate[0]), maxMonthsAgo);
	 	} else {
	 		targetDate = RemoveMonths(new Date(currentDate), maxMonthsAgo);
	 	}
	 	return (new Date(measuredDate) >= targetDate);	
	};
	
	function mostRecentDate(dateArray) {
		parsedDateArray = [];
		for (var i=0; i < dateArray.length; i++) {
			if (dateArray[i].toString().match(/\d{2}\/\d{2}\/\d{4}/)){
				parsedDate = dateArray[i].split("/");
				parsedDateArray.push(new Date(parsedDate[2], parsedDate[1]-1, parsedDate[0]));
			} else {
				parsedDateArray.push(new Date(dateArray[i]));
			}
		}
		
		return new Date(Math.max.apply(null,parsedDateArray));
	}

	var ruleDMPastNMonths = {
		desc: function(){return "Diabetic Assessment in past " + this.months + " months"; },
		long_desc: function(){return "% of patients who have had a diabetic assessment in the past " + this.months + " months"; },
	 	months: 12,
	 	col: ["Current Date", "DM Months"],
	 	rule: function(currentDate, measuredDate) {
	 		try {
	 			// Old version output date of last assessment
	 			// New version outputs number of months since last assessment,
	 			// have to check which case and handle appropriately
		 		if (isNaN(parseInt(measuredDate)) && measuredDate != "") {
		 			if (currentDate.match(/\d{2}\/\d{2}\/\d{4}/) ){
		 				parsedDate = currentDate.split("/");
		 				targetDate = RemoveMonths(new Date(parsedDate[2], parsedDate[1]-1, parsedDate[0]), this.months);
			 		} else {
			 			targetDate = RemoveMonths(new Date(currentDate), this.months);
			 		}
			 		return (new Date(measuredDate) >= targetDate);
			 	} else {
			 		return (parseInt(measuredDate) <= this.months);
			 	}
	 		} catch (err) {
	 			return false;
	 		}
	 	}
	};
	
	var ruleA1cPastNMonths = {
		desc: function(){ return "A1C measured in last " + this.months + " months"; },
		long_desc: function(){return "# of patients with A1C measured in last " +  this.months + " months"; },
		months: 6,
	 	col: ["Current Date", "Date Hb A1C"],
	 	rule: function(currentDate, measuredDate) {
	 		try {
	 			return WithinDateRange(currentDate, this.months, measuredDate);
	 		} catch (err) {
	 			return false;
	 		}
	 	}
	};
	
	var ruleA1cLessThanEqualToXPastNMonths = {
		desc: function(){ return "A1C \u2264 " + this.target + " in past " + this.months + " months"; },
		long_desc: function(){return "% of patients with A1C less than or equal to " + this.target + " measured in the past " + this.months + " months";},
	 	col: ["Current Date", "Date Hb A1C", "Hb A1C"],
		target: 0.08,
		months: 6,
	 	rule: function(currentDate, measuredDate, value) {
	 		try {
	 			return (WithinDateRange(currentDate, this.months, measuredDate) && parseFloat(value) <= this.target);
	 		} catch (err) {
	 			return false;
	 		}
	 	}
	};
	

	var ruleBPPastNMonths = {
		desc: function(){return "BP measured in past " + this.months + " months";},
		long_desc: function(){return "% of patients with BP measured in past " + this.months + " months";},
	 	col: ["Current Date", "Date Systolic BP"],
	 	months: 6,
	 	rule: function(currentDate, measuredDate) {
	 		try {
	 			return WithinDateRange(currentDate, this.months, measuredDate);
	 		} catch (err) {
	 			return false;
	 		}
	 	}
	};
	
	var ruleBPLessThanS_DLastNMonths = {
		desc: function(){return "BP < " + this.sysTarget + "/" + this.diasTarget +" in past " + this.months + " months";},
		long_desc: function(){return "% of patients with LDL less than or equal to 2.0";},
	 	col: ["Current Date", "Date Systolic BP", "Systolic BP", "Diastolic BP"],
	 	diasTarget: 80,
	 	sysTarget: 130,
	 	months: 6,
	 	rule: function(currentDate, measuredDate, sysValue, diasValue) {
	 		try {
	 			return (WithinDateRange(currentDate, this.months, measuredDate) &&
	 				   (parseInt(diasValue) < this.diasTarget || parseInt(sysValue) < this.sysTarget));
	 		} catch (err) {
	 			return false;
	 		}
	 	}
	};

	var ruleLDLPastNMonths = {
		desc: function(){return "LDL measured within the last " + this.months + " months";},
		long_desc: function(){return "% of diabetic patients with LDL measured within the past " + this.months + " months";},
		col: ["Current Date", "Date LDL"],
		months: 12,
		rule: function(currentDate, measuredDate) {
			 try {
	 			return WithinDateRange(currentDate, this.months, measuredDate);
	 		} catch (err) {
	 			// Field is likely blank
	 			return false;
	 		}
		}
	};
	
	var ruleLDLLessThanEqualToXPastNMonths = {
		desc: function(){return "LDL \u2264 " + this.target + " in past " + this.months + " months";},
		long_desc: function(){return "% of diabetic patients with LDL less than or equal to " + this.target + " measured within the past " + this.months + " months";},
		col: ["Current Date", "Date LDL", "LDL"],
		months: 12,
		target: 2.0,
		rule: function(currentDate, measuredDate, value) {
			 try {
	 			//new Date accepts date string in format YYYY-MM-DD
	 			return WithinDateRange(currentDate, this.months, measuredDate) && 
	 				   (parseFloat(value) <= this.target || value == "<1.00");
	 		} catch (err) {
	 			// Field is likely blank
	 			return false;
	 		}
		}
	};
	
	var ruleACRLastNMonths = {
		desc: function(){return "ACR measured in past " + this.months + " months"; },
		long_desc: function(){return "% of patients with ACR measured in past " + this.months + " months";},
		months: 12,
	 	col: ["Current Date", "Date Microalbumin/Creatinine Ratio", "Microalbumin/Creatinine Ratio"],
	 	rule: function(currentDate, measuredDate, value) {
	 		try {
	 			return WithinDateRange(currentDate, this.months, measuredDate) && parseFloat(value) != NaN;
	 		} catch (err) {
	 			console.log("Error: " + err);
	 			return false;
	 		}
	 	}
	};
	
	var ruleACRMaleLessThanXLastNMonths = {
		desc: function(){return "ACR Male < " + this.target + " in past " + this.months + " months"; },
		long_desc: function(){return "% of male patients with ACR less than " + this.target + " measured in past " + this.months + " months";},
		months: 12,
		target: 2.0,
	 	col: ["Current Date", "Date Microalbumin/Creatinine Ratio", "Microalbumin/Creatinine Ratio", "Sex"],
	 	rule: function(currentDate, measuredDate, value, sex) {
	 		if (sex != "M") {
	 			return NaN;
	 		}
	 		try {
	 			return WithinDateRange(currentDate, this.months, measuredDate) && (parseFloat(value) < this.target || value=="<2.0");
	 		} catch (err) {
	 			console.log("Error: " + err);
	 			return false;
	 		}
	 	}
	};
	
	var ruleACRFemaleLessThanXLastNMonths = {
		desc: function(){return "ACR Female < " + this.target + " in past " + this.months + " months"; },
		long_desc: function(){return "% of female patients with ACR less than " + this.target + " measured in past " + this.months + " months";},
		months: 12,
		target: 2.8,
	 	col: ["Current Date", "Date Microalbumin/Creatinine Ratio", "Microalbumin/Creatinine Ratio", "Sex"],
	 	rule: function(currentDate, measuredDate, value, sex) {
	 		if (sex != "F") {
	 			return NaN;
	 		}	 		
	 		try {
	  			return WithinDateRange(currentDate, this.months, measuredDate) && (parseFloat(value) < this.target || value=="<2.8");
	 		} catch (err) {
	 			console.log("Error: " + err);
	 			return false;
	 		}
	 	}
	};
	
	var ruleEGFRMeasuredPastNMonths = {
		months: 12,
		desc: function(){return "EGFR measured in past " + this.months + " months";},
		long_desc: function(){return "% of patients with EGFR measured in the past " + this.months + " months";},
	 	col: ["Current Date", "Date eGFR"],
	 	rule: function(currentDate, measuredDate) { 
	 		try {
	 			return WithinDateRange(currentDate, this.months, measuredDate);
	 		} catch (err) {
	 			return false;
	 		}
	 	}
	};
	
	var ruleEGFRGreaterThanXPastNMonths = {
		desc: function(){return "EGFR > " + this.target + " in past " + this.months + " months";},
		long_desc: function(){return "% of patients with EGFR greater than " + this.target + " measured in the past " + this.months + " months";},
	 	col: ["Current Date", "Date eGFR", "eGFR"],
		target: 60,
		months: 12,
	 	rule: function(currentDate, measuredDate, value) {
			try {
	 			return WithinDateRange(currentDate, this.months, measuredDate) && 
	 					(parseInt(value) > this.target || value == ">=90" || value == ">120");
	 		} catch (err) {
	 			return false;
	 		}
	 	}
	};
	
	var ruleCurrentSmokers = {
		desc: function(){return "Current Smokers"; },
		long_desc: function() { "% of patients who are coded as current smokers"; },
		col: ["Risk Factors"],
		rule: function(factors) {
			try {
				return (factors.toLowerCase().indexOf("current smoker") != -1);
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};
	
	var ruleBaselineBP = {
		desc: function(){return "BP measured in last " + this.months + " for adults over " + this.age; },
		long_desc: function() { "% of patients who are coded as current smokers"; },
		col: ["Current Date", "Date Systolic BP", "Age"],
		age: 40,
		months: 12,
		rule: function(currentDate, measuredDate, value) {
			try {
				if (parseInt(value) < 40) {
					return NaN;
				} else {
					return (WithinDateRange(currentDate, this.months, measuredDate) && (parseInt(value) >= this.age));
	 			}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};


	var ruleElevatedBPRegularVisit = {
		desc: function(){return "Last visit within " + this.months + " months if BP > " + this.sysTarget + "/" + this.diasTarget; },
		long_desc: function() { "% of patients who are coded as current smokers"; },
		col: ["Current Date", "Last Seen Date", "Systolic BP", "Diatolic BP"],
		sysTarget: 140,
		diasTarget: 90,
		months: 9,
		rule: function(currentDate, measuredDate, sysValue, diasValue) {
			try {
				if (parseInt(sysValue) < this.sysTarget && parseInt(diasValue) < this.diasTarget) {
					return NaN;
				} else {
					return WithinDateRange(currentDate, this.months, measuredDate);
	 			}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};
	
	

	var ruleAllInfantVaccinations = {
		desc: function(){return "Infant immunization schedule up to date"; },
		long_desc: function() { "Infant immunization schedule up to date"; },
		col: ["Current Date", "Birthdate",
			  "measles", "mumps", "rubella", "diphtheria", "tetanus", "pertussis", "varicella", "rotavirus", "polio"],
		age: 2,
		diphtheria: 4,
		tetanus: 4,
		pertussis: 4,
		polio: 4,
		hib: 4,
		pneuc: 3,
		rot: 2,
		mencc: 1,
		measles: 1,
		mumps: 1,
		rubella: 1,
		varicella: 1,
		rule: function(currentDate, birthDate,
						measles, mumps, rubella, diphtheria, tetanus, pertussis, varicella, rotavirus, polio) {
			try {
				if (!WithinDateRange(currentDate, 24, birthDate)) {
					return NaN;
				} else {
					return (parseInt(measles) >= this.measles &&
							parseInt(mumps) >= this.mumps && 
							parseInt(rubella) >= this.rubella &&  
							parseInt(diphtheria) >= this.diphtheria && 
							parseInt(tetanus) >= this.tetanus && 
							parseInt(pertussis) >= this.pertussis && 
							parseInt(varicella) >= this.varicella && 
							parseInt(rotavirus) >= this.rotavirus && 
							parseInt(polio) >= this.polio);
	 			}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};


	var ruleHeightWeightLastVaccination = {
		desc: function(){return "Infant immunization schedule up to date"; },
		long_desc: function() { "Infant immunization schedule up to date"; },
		col: ["height date", "weight date",
			  "measles date", "mumps date", "rubella date", "diphtheria date", "tetanus date", "pertussis date", "varicella date", "rotavirus date", "polio date"],
		rule: function(heightDate, weightDate,
						measles, mumps, rubella, diphtheria, tetanus, pertussis, varicella, rotavirus, polio) {
			try {
				if (heightDate != weightDate) {
					return false;
				} else {
					return (new Date(heightDate) == mostRecentDate([measles, mumps, rubella, diphtheria, tetanus, pertussis, varicella, rotavirus, polio]));
	 			}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};

	var diabetesRules = [ruleDMPastNMonths,
						 ruleA1cPastNMonths, 
						 ruleA1cLessThanEqualToXPastNMonths, 
						 ruleBPPastNMonths, 
						 ruleBPLessThanS_DLastNMonths, 
						 ruleLDLPastNMonths, 
						 ruleLDLLessThanEqualToXPastNMonths, 
						 ruleACRLastNMonths,
						 ruleACRFemaleLessThanXLastNMonths,
						 ruleACRMaleLessThanXLastNMonths,
						 ruleEGFRMeasuredPastNMonths, 
						 ruleEGFRGreaterThanXPastNMonths,
						 ruleCurrentSmokers];
						 
	var hypertensionRules = [ruleBaselineBP,
							 ruleElevatedBPRegularVisit,
							 ruleBPLessThanS_DLastNMonths];
							 
	var immunizationRules = [ruleHeightWeightLastVaccination,
							 ruleAllInfantVaccinations];

	var ruleList = [{name:"Diabetes", rules:diabetesRules},
					{name:"Hypertension", rules:hypertensionRules},
					{name:"Child Health", rules:immunizationRules}];

	function ApplyRules(ruleListIndex, filteredData) {
		//Loop through data from each file
		var results = [];
		
		currentRuleList = ruleList[ruleListIndex];
		
		//loop through each file
		for (var i = 0; i < filteredData.length; i++) {
			results.push(CheckRules(filteredData[i], currentRuleList.rules));
		}
		
		return results;
	};

	function CheckRules(csvObject, ruleList) {
	
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
			
			for (var e = 0; e < num_items; e++) {
				var arg_list = [];
				for (var p=0; p<num_params;p++) {
					arg_list.push(csvObject[currentRule.col[p]][e]);
				}
				passed.push(currentRule.rule.apply(currentRule, arg_list));
			}
			
			//Count the number of cases that passed the test
			results.push({	
					desc: currentRule.desc(),
				  	passed: passed.filter(function(e) { return (e == true); }).length,
				  	total: num_items - passed.filter(function(e) { return (isNaN(e).length); })
			});
		}	
		return results;
	};
	
	return {
		//calculateCountDiabeticMeasure: calculateCountDiabeticMeasure,
		ApplyRules: ApplyRules,
		ruleList: ruleList
	};
	
})();