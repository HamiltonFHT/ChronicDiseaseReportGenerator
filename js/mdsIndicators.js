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

var mdsIndicators =  (function(){
	
	var lookupVarNameTable = {
		'minAge': 'Minimum Age',
		'maxAge': 'Maximum Age',
		'months': 'Months Since',
		'minAgeMonths': 'Minimum Age (months)',
		'maxAgeMonths': 'Maximum Age (months)',
		'sysTarget': 'Systolic BP Target',
		'diasTarget': 'Diastolic BP Target',
		'age': 'Age'
	};

	var LHINAverages = {
		'DiabeticAssessment': 0.30, //percent
		'DateHbA1C': 0.50, //% HbA1c done twice in past year
		'LDL': 0.67, //% measured in past twelve months
		'BPUnderControl': 0.66, //% patients with BP < 140/90
		'SmokingCessation': 0.56, //% receiving advice to quit smoking in past year
		'Smokers': 0.192, //% Daily smokers (Ontario HSIP Report)
		'Mammograms': 0.60,
		'Pap': 0.66,
		'FOBT': 0.32,
	};

	//Currently made up data!
	var HFHTGoal = {
		'DiabeticAssessment': 0.70, //percent
		'DateHbA1C': 0.50, //% HbA1c done twice in past year
		'LDL': 0.67, //% measured in past twelve months
		'BPUnderControl': 0.6, //% patients with BP < 140/90
		'SmokingCessation': 0.75, //% receiving advice to quit smoking in past year
		'Mammograms': 0.5,
		'Pap': 0.5,
		'FOBT': 0.5,
		'CYMHScreening': 0.9
	};
	
	function removeMonths(date, months) {
  		return new Date(date.setMonth(date.getMonth() - months));
	};

	// Checks if the measuredDate is within maxMonthsAgo of the currentDate
	// Return true if it is in-date and false if it is out-of-date
	function withinDateRange(currentDate, maxMonthsAgo, measuredDate) {
		var dateRegex = /\d{2}[/-]\d{2}[/-]\d{4}/; //matches dd-mm-yyyy and dd/mm/yyyy 

		if (measuredDate == "") {
			return false;
		}

		//Turn currentDate string into Date object with date currentDate - maxMonthsAgo
		if (currentDate.toString().match(dateRegex) ){
	 		var parsedDate = currentDate.split(/[/-]/);
	 		var targetDate = removeMonths(new Date(parsedDate[2], parsedDate[1]-1, parsedDate[0]), maxMonthsAgo);
	 	} else { 
	 		var targetDate = removeMonths(new Date(currentDate), maxMonthsAgo); 
	 	}

	 	//Turn measuredDate into a Date object
	 	if (measuredDate.toString().match(dateRegex)) {
	 		var parsedDate = measuredDate.split("/");
	 		var measuredDate = new Date(parsedDate[2], parsedDate[1]-1, parsedDate[0]);
	 	} else { 
	 		var measuredDate = new Date(measuredDate); 
	 	}

	 	//Make sure measuredDate was measured more recently than the target date.
	 	return measuredDate >= targetDate;	
	};
	
	// Returns time String of the most recent date from an array of dates
	function mostRecentDate(dateArray) {
		var parsedDateArray = [];
		for (var i=0; i < dateArray.length; i++) {
			if (dateArray[i].toString().length === 0) {
				parsedDateArray.push(new Date(0)); // Dec 31, 1969
			} else if (dateArray[i].toString().match(/\d{2}\/\d{2}\/\d{4}/)){
				var parsedDate = dateArray[i].split("/");
				parsedDateArray.push(new Date(parsedDate[2], parsedDate[1]-1, parsedDate[0]));
			} else {
				parsedDateArray.push(new Date(dateArray[i]));
			}
		}
		
		return new Date(Math.max.apply(null,parsedDateArray)).getTime();
	}


	function getAgeFromMonths(age){
		if (age.indexOf('mo') > 0) {
			return Math.floor(parseInt(age, 10) / 12);
		} else {
			return Number(age);
		}
	}
	

	function resetToDefault(rule) {
		if (rule.hasOwnProperty("modifiable") && rule.hasOwnProperty("defaults")) {
			var fields = rule.modifiable;
			var defaults = rule.defaults;
			for (var i = 0; i < fields.length; i++) {
				rule[fields[i]] = defaults[i];
			}
		}
	}

/*  Unused
	var ICD9Regex = /\d+(\.\d+)*:/g
	function extractICD9(prob) {
		if (!prob) {
			return "";
		}

		var icd9regex = /\d+(\.\d+)*:/g;
		codes = prob.match(icd9regex);
		if (!codes) {
			return "";
		}

		var codeStr = ''
		for (var i = 0; i<codes.length; i++) {
			codeStr+=codes[i].slice(0, -1);
			if (i < codes.length-1) {
				codeStr+=", ";
			}
		}
		return codeStr;
	}
*/

	function isOSCAR() {
		return mdsViewer.getEMR()["Oscar"];
	}

	function isPSS(){;
		return mdsViewer.getEMR()["PSS"];
	}


	// fileNumber for Oscar CYMH
	var fileNumber;
	
	
	function applyRules(ruleListIndex, filteredData) {
		//Loop through data from each file
		var results = [];
		
		currentRuleList = ruleList[ruleListIndex];
		
		//loop through each file
		for (var i = 0; i < filteredData.length; i++) {
			fileNumber = i;
			results.push(checkRules(filteredData[i], currentRuleList.rules));
		}
		
		return results;
	};

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
			
			for (var e = 0; e < num_items; e++) {
				var arg_list = [];
				for (var p=0; p<num_params;p++) {
					arg_list.push(csvObject[currentRule.col[p]][e]);
				}
				passed.push(currentRule.rule.apply(currentRule, arg_list));
			}
			
			//Count the number of cases that passed the test
			results.push({	
					index: r,
					desc: currentRule.desc(),
					tooltip: currentRule.long_desc(),
					passedIndex: passed,
				  	passed: passed.filter(function(e) { return (e == true); }).length,
				  	total: num_items - passed.filter(function(e) { return isNaN(e); }).length
			});
		}	
		return results;
	};
	
	/* 
	 * Inspect header of text file to guess which indicator set is most appropriate
	 * Indicator sets are listed in the ruleList variable in mdsIndicators
	 */
	function getCurrentRuleSet(header) {
		if (header.indexOf("Patient #") == -1 || header.indexOf("Doctor Number") == -1) {
			alert("File does not contain necessary data element Patient # or Doctor Number");
			throw new Error("File does not contain necessary data element Patient # or Doctor Number");
		}
		
		var rule = 0;
		
		//Diabetes
		if (header.indexOf("Hb A1C") != -1) {
			rule = 0;
		//Hypertension
		} else if (header.indexOf("Systolic BP") != -1) {
			rule = 1;
		//Immunizations
		} else if (header.indexOf("height date") != -1 || header.indexOf("measurements") != -1) {
			rule = 2;
		//Lung Health
		} else if (header.indexOf("COPD Screening Date") != -1) {
			rule = 3;
		//Smoking Cessation
		} else if (header.indexOf("Smoking Cessation Date") != -1) {
			rule = 4;
		//Depression
		} else if (header.indexOf("PHQ9 Dates") != -1) {
			rule = 5;
		//Cancer Screening
		} else if (header.indexOf("Mammogram") != -1) {
			rule = 6;
		} else if (header.indexOf("Rourke") != -1) {
			rule = 7;
		//Youth ADHD
		} else {
			rule = 8;
		}
		
		return rule;
	}
	
	var ruleDMPastNMonths = {
		desc: function(){return "Diabetic Visit in past " + this.months + " months"; },
		long_desc: function(){return "% of patients who have had a diabetic visit (diagnostic code 250) in the past " + this.months + " months"; },
	 	months: 12,
	 	modifiable: ["months"],
	 	defaults: [12],
	 	col: ["Current Date", "DM Months"],
	 	rule: function(currentDate, measuredDate) {
	 		try {
	 			if (measuredDate == "") {
	 				return false;
	 			}
	 			// Old version output date of last assessment
	 			// New version outputs number of months since last assessment,
	 			// have to check which case and handle appropriately
		 		if (isNaN(Number(measuredDate))) {
		 			if (currentDate.match(/\d{2}\/\d{2}\/\d{4}/) ){
		 				var parsedFields = currentDate.split("/");
		 				var parsedDate = new Date(parsedFields[2], parsedFields[1]-1, parsedFields[0])
		 				var targetDate = removeMonths(parsedDate, this.months);
			 		} else {
			 			var parsedDate = new Date(currentDate)
			 			var targetDate = removeMonths(new Date(currentDate), this.months);
			 		}

			 		//All measurements should be older than the current date
			 		if (new Date(measuredDate) > parsedDate) {
			 			return NaN;
			 		}

			 		return (new Date(measuredDate) >= targetDate);
			 	} else {
			 		return (Number(measuredDate) <= this.months);
			 	}
	 		} catch (err) {
	 			return false;
	 		}
	 	}
	};
	
	var ruleDMPastNMonthsBilling = {
		desc: function(){return "Diabetic Assessment in past " + this.months + " months"; },
		long_desc: function(){return "% of patients who have had a diabetic assessment (K030/Q040) in the past " + this.months + " months"; },
	 	months: 12,
	 	modifiable: ["months"],
	 	defaults: [12],
	 	col: ["Current Date", "K030A", "Q040A"],
	 	average: LHINAverages.DiabeticAssessment,
	 	goal: HFHTGoal.DiabeticAssessment,
	 	rule: function(currentDate, k, q) {
	 		try {
	 			if (k === "" && q === "") {
	 				return false;
	 			}
	 			// Using diabetic assessment billing codes
	 			// K030A -- quarterly, Q040 -- annual
	 			if (currentDate.match(/\d{2}\/\d{2}\/\d{4}/) ){
	 				var parsedFields = currentDate.split("/");
	 				var parsedDate = new Date(parsedFields[2], parsedFields[1]-1, parsedFields[0])
	 				var targetDate = removeMonths(parsedDate, this.months);
		 		} else {
		 			var parsedDate = new Date(currentDate)
		 			var targetDate = removeMonths(new Date(currentDate), this.months);
		 		}

		 		//All measurements should be older than the current date
		 		if (new Date(k) > parsedDate || new Date(q) > parsedDate) {
		 			return NaN;
		 		}

		 		return (mostRecentDate([k, q]) >= targetDate.getTime());

	 		} catch (err) {
	 			console.log(err.message);
	 			return NaN;
	 		}
	 	}
	};


	var ruleA1CPastNMonths = {
		desc: function(){ return "A1C measured in last " + this.months + " months"; },
		long_desc: function(){ return "% of patients with A1C measured in last " +  this.months + " months"; },
		months: 6,
		modifiable: ["months"],
		defaults: [6],
	 	col: ["Current Date", "Date Hb A1C"],
	 	average: LHINAverages.DateHbA1C,
	 	goal: 0.6,
	 	rule: function(currentDate, measuredDate) {
	 		try {
	 			return withinDateRange(currentDate, this.months, measuredDate);
	 		} catch (err) {
	 			return false;
	 		}
	 	}
	};
	
	var ruleA1CLessThanEqualToXPastNMonths = {
		desc: function(){ return "A1C \u2264 " + this.target + " in past " + this.months + " months"; },
		long_desc: function(){return "% of patients with A1C less than or equal to " + this.target + " measured in the past " + this.months + " months";},
	 	col: ["Current Date", "Date Hb A1C", "Hb A1C"],
		target: 0.08,
		months: 6,
		modifiable: ["months", "target"],
		defaults: [6, 0.08],
	 	rule: function(currentDate, measuredDate, value) {
	 		try {
	 			return (withinDateRange(currentDate, this.months, measuredDate) && Number(value) <= this.target);
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
	 	modifiable: ["months"],
	 	defaults: [6],
	 	rule: function(currentDate, measuredDate) {
	 		try {
	 			return withinDateRange(currentDate, this.months, measuredDate);
	 		} catch (err) {
	 			return false;
	 		}
	 	}
	};
	
	var ruleBPLessThanS_DLastNMonths = {
		desc: function(){return "BP < " + this.sysTarget + "/" + this.diasTarget +" in past " + this.months + " months";},
		long_desc: function(){return "% of patients with BP less than " + this.sysTarget + "/" + this.diasTarget + 
									" measured in the past " + this.months + " months";},
	 	col: ["Current Date", "Date Systolic BP", "Systolic BP", "Diastolic BP"],
	 	months: 6,
	 	sysTarget: 130,
		diasTarget: 80,
	 	modifiable: ["months", "sysTarget", "diasTarget"],
	 	defaults: [6, 130, 80],
	 	average:0.3,
	 	rule: function(currentDate, measuredDate, sysValue, diasValue) {
	 		try {
	 			return (withinDateRange(currentDate, this.months, measuredDate) &&
	 				   (Number(diasValue) < this.diasTarget && Number(sysValue) < this.sysTarget));
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
		modifiable: ["months"],
		defaults: [12],
		rule: function(currentDate, measuredDate) {
			 try {
	 			return withinDateRange(currentDate, this.months, measuredDate);
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
		modifiable: ["months", "target"],
		defaults: [12, 2.0],
		rule: function(currentDate, measuredDate, value) {
			 try {
	 			//new Date accepts date string in format YYYY-MM-DD
	 			return withinDateRange(currentDate, this.months, measuredDate) && 
	 				   (Number(value) <= this.target || value == "<1.00");
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
		modifiable: ["months"],
		defaults: [12],
	 	col: ["Current Date", "Date Microalbumin/Creatinine Ratio", "Microalbumin/Creatinine Ratio"],
	 	rule: function(currentDate, measuredDate, value) {
	 		try {
	 			return withinDateRange(currentDate, this.months, measuredDate) && Number(value) != NaN;
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
		modifiable: ["months", "target"],
		defaults: [12, 2.0],
	 	col: ["Current Date", "Date Microalbumin/Creatinine Ratio", "Microalbumin/Creatinine Ratio", "Sex"],
	 	rule: function(currentDate, measuredDate, value, sex) {
	 		if (sex != "M") {
	 			return NaN;
	 		}
	 		try {
	 			return withinDateRange(currentDate, this.months, measuredDate) && (Number(value) < this.target || value=="<2.0");
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
		modifiable: ["months", "target"],
		defaults: [12, 2.8],
	 	col: ["Current Date", "Date Microalbumin/Creatinine Ratio", "Microalbumin/Creatinine Ratio", "Sex"],
	 	rule: function(currentDate, measuredDate, value, sex) {
	 		if (sex != "F") {
	 			return NaN;
	 		}	 		
	 		try {
	  			return withinDateRange(currentDate, this.months, measuredDate) && (Number(value) < this.target || value=="<2.8");
	 		} catch (err) {
	 			console.log("Error: " + err);
	 			return false;
	 		}
	 	}
	};
	
	var ruleEGFRMeasuredPastNMonths = {
		desc: function(){return "eGFR measured in past " + this.months + " months";},
		long_desc: function(){return "% of patients with eGFR measured in the past " + this.months + " months";},
		months: 12,
		modifiable: ["months"],
		defaults: [12],
	 	col: ["Current Date", "Date eGFR"],
	 	rule: function(currentDate, measuredDate) { 
	 		try {
	 			return withinDateRange(currentDate, this.months, measuredDate);
	 		} catch (err) {
	 			return false;
	 		}
	 	}
	};
	
	var ruleEGFRGreaterThanXPastNMonths = {
		desc: function(){return "eGFR > " + this.target + " in past " + this.months + " months";},
		long_desc: function(){return "% of patients with eGFR greater than " + this.target + " measured in the past " + this.months + " months";},
	 	col: ["Current Date", "Date eGFR", "eGFR"],
		months: 12,
		target: 60,
		modifiable: ["months", "target"],
		defaults: [12, 60],
	 	rule: function(currentDate, measuredDate, value) {
			try {
	 			return withinDateRange(currentDate, this.months, measuredDate) && 
	 					(Number(value) > this.target || value == ">=90" || value == ">120");
	 		} catch (err) {
	 			return false;
	 		}
	 	}
	};
	
	var ruleCurrentSmokers = {
		desc: function(){return "Current Smokers"; },
		long_desc: function() { return "% of patients who are coded as current smokers"; },
		col: ["Risk Factors"],
		average: LHINAverages.Smokers,
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
		desc: function(){return "BP measured in last " + this.months + " months for  adults over " + this.age; },
		long_desc: function(){return "% of patients with BP measured in the past " + this.months + " months for adults over " + this.age; },
		col: ["Current Date", "Date Systolic BP", "Age"],
		months: 12,
		age: 40,
		modifiable: ["months", "age"],
		defaults: [12, 40],
		rule: function(currentDate, measuredDate, age) {
			try {
				if (Number(age) < this.age) {
					return NaN;
				} else {
					return withinDateRange(currentDate, this.months, measuredDate);
	 			}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};

	//Patients with hypertension and an elevated blood pressure have come in for a regular checkup
	var ruleElevatedBPRegularVisit = {
		desc: function(){return "Hypertensive patients with BP > " + this.sysTarget + "/" + this.diasTarget + " who visited within " + this.months + " months"; },
		long_desc: function() { return "% of patients diagnosed with hypertension and with BP over " + this.sysTarget + "/" + this.diasTarget + 
										" who have had a visit within the past " + this.months + " months"; },
		col: ["Current Date", "Last Seen Date", "Systolic BP", "Diastolic BP", "Problem List"],
		months: 9,
		sysTarget: 140,
		diasTarget: 90,
		modifiable: ["months", "sysTarget", "diasTarget"],
		defaults: [9, 140, 90],
		rule: function(currentDate, lastSeenDate, sysValue, diasValue, icd9) {
			try {
				if (icd9.indexOf("401") == -1 || (Number(sysValue) < this.sysTarget && Number(diasValue) < this.diasTarget)) {
					return NaN;
				} else {
					return withinDateRange(currentDate, this.months, lastSeenDate);
	 			}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};
	
	//Patients with hypertension and health blood pressure
	var ruleHypertensionBP= {
		desc: function(){return "Hypertensive patients with BP < " + this.sysTarget + "/" + this.diasTarget; },
		long_desc: function() { return "% of patients diagnosed with hypertension and with BP less than " + this.sysTarget + "/" + this.diasTarget; },
		col: ["Systolic BP", "Diastolic BP", "Problem List"],
		sysTarget: 140,
		diasTarget: 90,
		modifiable: ["sysTarget", "diasTarget"],
		defaults: [140, 90],
		average: LHINAverages.BPUnderControl,
		goal: HFHTGoal.BPUnderControl,
		rule: function(sysValue, diasValue, icd9) {
			try {
				if (icd9.indexOf("401") == -1 || sysValue === "") {
					return NaN;
				} else {
					return (Number(sysValue) < this.sysTarget && Number(diasValue) < this.diasTarget);
	 			}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};
	
	var ruleInfantVaccinations = {
		desc: function(){return "Infant(" + this.minAge + "-" + this.maxAge + ") immunization schedule up to date"; },
		long_desc: function() { return "Infants between " + this.minAge + " and " + this.maxAge + 
										" years with immunization schedule up to date"; },
		col: ["Age", "measles", "diphtheria",
		      "varicella", "rotavirus", "polio"],
		minAge: 2,
		maxAge: 3,
		diphtheria: 4,
		polio: 4,
		hib: 4,
		pneuc: 3,
		rotavirus: 2,
		mencc: 1,
		measles: 1,
		varicella: 1,
		modifiable: ["minAge", "maxAge"],
		defaults: [2, 3],
		rule: function(ageStr, measles, diphtheria,  
			           varicella, rotavirus, polio) {
			try {
				var age = getAgeFromMonths(ageStr);
				if (typeof age === "number") {
					if (age >= this.minAge && age <= this.maxAge) {
						return (Number(measles) >= this.measles &&
							Number(diphtheria) >= this.diphtheria && 
							Number(varicella) >= this.varicella && 
							Number(polio) >= this.polio);
					}
				}
				return NaN;
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};
	
	//Does not account for boosters
	var ruleChildVaccinations = {
		desc: function(){return "Children " + this.minAge + "-" + this.maxAge + " with all immunizations"; },
		long_desc: function() { return "Children between " + this.minAge + " and " + this.maxAge + " with all immunizations"; },
		col: ["Age",
			  "measles", "diphtheria", "varicella",
			  "polio", "haemophilus b conjugate",
			  "pneumococcal conjugate", "meningococcal conjugate"],
		minAge: 7,
		maxAge: 13,
		diphtheria: 5,
		tetanus: 5,
		pertussis: 5,
		polio: 5,
		hib: 4,
		pneuc: 3,
		rotavirus: 2,
		mencc: 1,
		measles: 2,
		mumps: 2,
		rubella: 2,
		varicella: 2,
		modifiable: ["minAge", "maxAge"],
		defaults: [7, 13],
		rule: function(ageStr,	measles, diphtheria, 
					   varicella, polio, hib, pneuc, mencc) {
			try {
				var age = getAgeFromMonths(ageStr);
				//if younger than 18 than not included
				if (age < this.minAge || age > this.maxAge) {
					return NaN;
				} else {
					return (Number(measles) >= this.measles &&
							Number(diphtheria) >= this.diphtheria && 
							Number(varicella) >= this.varicella &&
							//Number(rotavirus) >= this.rotavirus &&
							Number(polio) >= this.polio); //&&
							//Number(hib) >= this.hib &&
							//Number(pneuc) >= this.pneuc &&
							//Number(mencc) >= this.mencc);
	 			}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};

	//Does not account for boosters
	var ruleTeenagerVaccinations = {
		desc: function(){return "Adults " + this.minAge + "-" + this.maxAge + " with all immunizations"; },
		long_desc: function() { return "Adults between " + this.minAge + " and " + this.maxAge + " with all immunizations"; },
		col: ["Age",
			  "measles", "diphtheria", "varicella",
			  "polio", "haemophilus b conjugate"],
			  //"pneumococcal conjugate", "meningococcal conjugate"],
		minAge: 18,
		maxAge: 25,
		diphtheria: 6,
		tetanus: 6,
		pertussis: 6,
		polio: 5,
		hib: 4,
		pneuc: 3,
		rotavirus: 2,
		mencc: 2,
		measles: 2,
		mumps: 2,
		rubella: 2,
		varicella: 2,
		modifiable: ["minAge", "maxAge"],
		defaults: [18, 25],
		rule: function(ageStr,	measles, diphtheria,  
					   varicella, polio) {
			try {
				//if younger than 18 then not included
				var age = getAgeFromMonths(ageStr);
				if (age < this.minAge || age > this.maxAge) {
					return NaN;
				} else {
					return (Number(measles) >= this.measles &&
							Number(diphtheria) >= this.diphtheria && 
							Number(varicella) >= this.varicella && 
							//Number(rotavirus) >= this.rotavirus &&
							Number(polio) >= this.polio);
							//Number(hib) >= this.hib &&
							//Number(pneuc) >= this.pneuc &&
							//Number(mencc) >= this.mencc);
	 			}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};

	var ruleHeightWeightLastVaccination = {
		desc: function(){ return "Height and Weight at last immunization"; },
		long_desc: function() { return "Height and Weight measured at last immunization. Only applies to patients with height and weight measured on the same day"; },
		months: 12,
		modifiable: ["months"],
		defaults: [12],
		col: ["height date", "weight date", "Current Date",
			  "measles date", "diphtheria date", "varicella date", "rotavirus date", "polio date",
			  "pneumococcal conjugate date", "meningococcal conjugate date", "haemophilus b conjugate date"],
		rule: function(heightDate, weightDate, currentDate,
						measles, diphtheria, varicella, rotavirus, polio, pneuc, mencc, hib) {
			try {
				if (heightDate != weightDate || heightDate == "") {
					return NaN;
				} else {
					if (mostRecentDate([measles, diphtheria, varicella, rotavirus, polio, pneuc, mencc, hib]) == 0 && !withinDateRange(currentDate, this.months, heightDate)) {
						return false;
					} else
					return (new Date(heightDate).getTime() >= mostRecentDate([measles, diphtheria, varicella, rotavirus, polio, pneuc, mencc, hib]));
	 			}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};
	
	var ruleWellBabyVisit = {
		desc: function() { return "Well Baby Visit for infants " + this.minAge + " to " + this.maxAge + " years old"; },
		long_desc: function() { return "Percent of children " + this.minAge + " to " + this.maxAge + " who have completed their 18 month well baby visit"; },
		col: ["Age", "A002A", "Rourke"],
		minAge: 2,
		maxAge: 3,
		modifiable: ['minAge', 'maxAge'],
		defaults: [2, 3],
		rule: function(age, A002, rourke) {
			try {
				if (Number(age) >= this.minAge && Number(age) <= this.maxAge) {
					return (A002 != 0 || rourke != 0);
				} else { return NaN; }
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};	

	var ruleSmokingStatusRecorded = {
		desc: function(){return "Smoking Status Recorded for patients > " + this.age; },
		long_desc: function() { return "Smoking Status Recorded in Risk Factors for patients over the age of " + this.age; },
		age: 12,
		col: ["Risk Factors", "Age"],
		modifiable: ["age"],
		defaults: [12],
		rule: function(factors, age) {
			try {
				if (Number(age) < this.age) {
					return NaN;
				} else if (isOSCAR()) {
					if (factors != "") return true;
					else return false;
				}
				return factors.toLowerCase().indexOf('smok') != -1;
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};
	
    //Smoking Cessation Form is a count of the number of times LUNG-Smoking_Initial_Assessment_MOHLTC form has been performed
	var ruleSmokingCessation = {
		desc: function(){return "Smoking Cessation Attempted within " + this.months + " months"; },
		long_desc: function() { return "Smoking Cessation form performed within last " + this.months + 
									   " months for smokers who have seen their doctor in that time"; },
		months: 15,
		modifiable: ["months"],
		defaults:[15],
		col: [	"Risk Factors", 			//get smoking status
				"Smoking Cessation Date",   //smoking intervention date (billing code or relevant documentation)
				"Last Seen Date", 			//last patient visit
				"Current Date"],			// date of report
		averages: LHINAverages.SmokingCessation,
		rule: function(factors, formDate, lastSeenDate, currentDate) {
			try {
				factors = factors.toLowerCase();
				if ((isPSS() && factors.indexOf("current smoker") === -1) ||     //If they don't smoke (PSS), or
					(isOSCAR() && factors.indexOf("yes") === -1) ||  //They don't smoke (OSCAR), or
					!withinDateRange(currentDate,this.months,lastSeenDate)) // They haven't been in in more than 15 months
				{
					return NaN;
				} else {
					return withinDateRange(currentDate, this.months, formDate);	
				}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};

	var ruleAdultSmokersPneumovax = {
		desc: function(){return "Smokers > " + this.minAge + " vaccinated with Pneumovax"; },
		long_desc: function() { return "Patients over the age of " + this.minAge + " who smoke and are vaccinated for pneumonia"; },
		col: ["Age", "Risk Factors", "pneumococcal polysaccharide"],
		minAge: 18,
		modifiable: ["minAge"],
		defaults: [18],
		rule: function(age, factors, pneuc) {
			try {
				var factors = factors.toLowerCase();
				//Only people older than 18 who are current smokers qualify
				if (Number(age) <= this.minAge || 
						(isPSS() && factors.indexOf("current smoker") === -1) ||
						(isOSCAR() && (factors.indexOf("current") === -1 && 
									   factors.indexOf("yes") === -1))){
					return NaN;
				} else {
					//Patients with 1 or more pneumovax shots pass
					return Number(pneuc) > 0;
				}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};
	
	var ruleSeniorsPneumovax = {
		desc: function(){return "Seniors > " + this.minAge + " vaccinated with Pneumovax"; },
		long_desc: function() { return "Patients over the age of " + this.minAge + " and are vaccinated for pneumonia"; },
		col: ["Age", "pneumococcal polysaccharide"],
		minAge: 65,
		modifiable: ["minAge"],
		defaults: [65],
		rule: function(age, pneuc) {
			try {
				//Only people older than 65 qualify
				if (Number(age) <= this.minAge) {
					return NaN;
				} else if (pneuc === null) {
					return false;
				} else {
					return Number(pneuc) > 0;
				}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};

	var ruleLungDiseasePneumovax = {
		desc: function(){return "Adults > " + this.minAge + " with COPD/Asthma vaccinated with Pneumovax"; },
		long_desc: function() { return "Patients over the age of " + this.minAge + 
									   " who have COPD or asthma and are vaccinated for pneumonia"; },
		col: ["Age", "Problem List", "pneumococcal polysaccharide"],
		minAge: 18,
		modifiable: ["minAge"],
		defaults: [18],
		diseaseList: ["copd", "asthma", "chronic bronchitis", "490", "491", "492", "493", "494", "496"],
		rule: function(age, problemList, pneuc) {
			try {
				//Only people older than 18 with a lung disease (see diseaseList) qualify
				if (Number(age) <= this.minAge ||
					//Join diseaseList into a regular expression, test if 
					new RegExp(this.diseaseList.join("|")).test(problemList.toLowerCase()) === false) {
					return NaN;
				} else {
					//Patients with 1 or more pneumovax shots pass
					return Number(pneuc) > 0;
				}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};
		
	var ruleLungHealthScreen = {
		desc: function(){return "Lung Health Screening for smokers > " + this.age; },
		long_desc: function() { return "Lung Health Screening performed for smokers over the age of " + this.age; },
		age: 40,
		months: 24,
		modifiable: ["age"],
		col: ["Risk Factors", "Problem List", "COPD Screening Date", "Current Date", "Age"],
		diseaseList: ["copd", "asthma", "chronic bronchitis", "490", "491", "492", "493", "494", "496"],
		rule: function(factors, problemList, screenDate, currentDate, age) {
			factors = factors.toLowerCase();
			try {
				//Filter out people under the minimum age, or who do not smoke, or who are already diagnosed with COPD
				if (Number(age) <= this.age || 
					(isOSCAR() && (factors.indexOf("current") === -1 && factors.toLowerCase().indexOf("yes") === -1)) || 
					(isPSS() && factors.indexOf("current smoker") === -1) || 
					new RegExp(this.diseaseList.join("|")).test(problemList.toLowerCase()) === true)
				{
					return NaN;
				} else {
					//This needs to be a date check! Once a date range is decided upon
					return withinDateRange(currentDate, this.months, screenDate);
				}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};
		
	var rulePHQ9 = {
		desc: function(){return "Patients with multiple PHQ9 forms"; },
		long_desc: function() { return "Adult patients who have depression and have filled out at least one PHQ9 form" + 
								 		" have more than one PHQ9 form. This is an indication it is being used for follow-up"; },
		col: ["Current Date", "PHQ9 Dates","PHQ9 Occurrences"],
		months:6,
		modifiable: ["months"],
		defaults: [6],
		rule: function(currentDate, screenDate, count) {
			try {
				if (count == 0 || screenDate == "") {
					return NaN;
				} else if (count == 1 && !withinDateRange(currentDate, this.months, screenDate)) {
					return false;
				} else {
					return true;
				}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};

	var ruleADHDMedReview = {
		desc: function(){return "Youth on ADHD meds annual checkup"; },
		long_desc: function() { return "Youth diagnosed with ADHD and on medications for ADHD who have had an annual visit"; },
		col: ["Current Date", "Last Seen Date", "Patient #"],
		months:12,
		modifiable: ["months"],
		defaults: [12],
		rule: function(currentDate, lastSeenDate, patientNumber) {

			// Get mFilteredData for Oscar
			var mFilteredData = mdsReader.getmFilteredData();

			try {
				if (isPSS()) {
					return withinDateRange(currentDate, this.months, lastSeenDate);
				} else if (mFilteredData[fileNumber]["Filtered Patients"].indexOf(patientNumber) != -1) {
					return withinDateRange(currentDate, this.months, lastSeenDate);
				}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};
	
	var ruleChildYouthMentalHealthScreening = {
		desc: function() { return "Children with recent screening tool"; },
		long_desc: function() { return "Children referred to the HFHT child and youth mental health services who" + 
										" have had a screening tool done in the past " + this.years + " years"},
		col: ["Current Date", "Referral Date", "Last Screening"],
		years:2,
		modifiable: ["years"],
		defaults: [2],
		goal: HFHTGoal.CYMHScreening,
		rule: function(currentDate, referralDate, lastScreening) {
			try {
				if (referralDate == "") {
					return NaN;
				} else {
					return withinDateRange(currentDate, this.years*12, lastScreening);
				}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};

	var ruleBreastCancer = {
		desc: function(){return "Breast cancer screening within " + this.months/12 + " years, patients " + this.minAge + " to " + this.maxAge; },
		long_desc: function() { return "Patients aged " + this.minAge + " to " + this.maxAge + 
										" who received a mammogram in the past " + this.months + " months"; },
		col: ["Current Date", "Age", "Sex", "Mammogram"],
		months:3*12,
		minAge:50,
		maxAge:74,
		modifiable: ["months", "minAge", "maxAge"],
		defaults: [3*12, 50 , 74],
		averages: LHINAverages.Mammograms,
		rule: function(currentDate, age, sex, mammDate) {
			try {
				if (Number(age) < this.minAge || Number(age) > this.maxAge || sex != "F")
					return NaN;
				else
					return	withinDateRange(currentDate, this.months, mammDate)
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};
	
	var ruleCervicalCancer = {
		desc: function(){return "Cervical cancer screening within " + this.months/12 + " years, patients " + this.minAge + " to " + this.maxAge; },
		long_desc: function() { return "Patients aged " + this.minAge + " to " + this.maxAge + " who received a Pap test in the past " + this.months + " months"; },
		col: ["Current Date", "Age", "Sex", "Pap Test Report"],
		months:3*12,
		minAge:21,
		maxAge:69,
		modifiable: ["months", "minAge", "maxAge"],
		defaults: [3*12, 21, 69],
		averages: LHINAverages.Pap,
		rule: function(currentDate, age, sex, papDate) {
			try {
				if (Number(age) < this.minAge || Number(age) > this.maxAge || sex != "F")
					return NaN;
				else
					return	withinDateRange(currentDate, this.months, papDate)
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};
	
	var ruleColorectalCancer = {
		desc: function(){return "Colorectal cancer screening within " + this.months/12 + " years, patients " + this.minAge + " to " + this.maxAge; },
		long_desc: function() { return "Patients over the age of " + this.minAge + " who performed an FOBT in the past " + this.months + " months"; },
		col: ["Current Date", "Age", "FOBT"],
		months:2*12,
		minAge:50,
		maxAge:74,
		modifiable: ["months", "minAge", "maxAge"],
		defaults: [2*12, 50],
		averages: LHINAverages.FOBT,
		rule: function(currentDate, age, fobtDate) {
			try {
				if (Number(age) < this.minAge || Number(age) > this.maxAge)
					return NaN;
				else
					return	withinDateRange(currentDate, this.months, fobtDate)
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};
	
	var ruleFluVaccine = {
		desc: function(){return "Influenza vaccine within past year, patients > " + this.minAge; },
		long_desc: function() { return "Patients over the age of " + this.minAge + " who received a flu vaccine in the past " + this.months + " months"; },
		col: ["Current Date", "Age", "influenza date"],
		months:12,
		minAge:65,
		modifiable: ["months", "minAge"],
		defaults: [12, 65],
		rule: function(currentDate, age, fluDate) {
			try {
				if (Number(age) <= this.minAge) {
					return NaN;
				} else {
					return withinDateRange(currentDate, this.months, fluDate);
				}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};

	//Assemble rules into sets
	var diabetesRules = [ruleDMPastNMonthsBilling,
						 ruleA1CPastNMonths, 
						 ruleA1CLessThanEqualToXPastNMonths,
						 ruleLDLPastNMonths
					     ];
						 
		//Assemble rules into sets
	var diabetesExtendedRules = [ruleDMPastNMonthsBilling,
								 ruleA1CPastNMonths, 
								 ruleA1CLessThanEqualToXPastNMonths,
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
							 ruleHypertensionBP];
							 
	var immunizationRules = [ruleHeightWeightLastVaccination,
							 ruleInfantVaccinations,
							 ruleChildVaccinations,
							 ruleTeenagerVaccinations];
							 
	var smokingCessationRules = [ruleSmokingStatusRecorded,
								 ruleSmokingCessation];
	
	var lungHealthRules = [ruleSmokingStatusRecorded,
						   ruleSmokingCessation,
						   ruleAdultSmokersPneumovax,
						   ruleSeniorsPneumovax,
						   ruleLungDiseasePneumovax,
						   ruleLungHealthScreen];
						   
	var adultMentalHealthRules = [rulePHQ9];

	var childYouthMentalHealthRules = [ruleADHDMedReview,
								  ruleChildYouthMentalHealthScreening];
	
	var wellBabyRules = [ruleWellBabyVisit];
	
	var cancerScreeningRules = [ruleBreastCancer,
								ruleCervicalCancer,
								ruleColorectalCancer,
								ruleFluVaccine];

							
	//Add sets of rules to the master list
	var ruleList = [{name:"Diabetes", rules:diabetesRules},
					{name:"Hypertension", rules:hypertensionRules},
					{name:"Immunizations", rules:immunizationRules},
					{name:"Lung Health", rules:lungHealthRules},
					{name:"Smoking Cessation", rules:smokingCessationRules},
					{name:"Depression", rules:adultMentalHealthRules},
					{name: "Adult Preventative Care", rules:cancerScreeningRules},
					{name: "Well Baby", rules:wellBabyRules},
					{name:"ADHD", rules:childYouthMentalHealthRules},
					{name:"Diabetes (Full)", rules:diabetesExtendedRules}];

	
	return {
		applyRules: applyRules,
		ruleList: ruleList,
		resetToDefault: resetToDefault,
		getCurrentRuleSet: getCurrentRuleSet,
		lookupVarNameTable: lookupVarNameTable,
	};
	
})();