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
	
	function removeMonths(date, months) {
  		return new Date(date.setMonth(date.getMonth() - months));
	};

	// Checks if the measuredDate is within maxMonthsAgo of the currentDate
	// Return true if it is in-date and false if it is out-of-date
	function withinDateRange(currentDate, maxMonthsAgo, measuredDate) {
		if (currentDate.toString().match(/\d{2}\/\d{2}\/\d{4}/) ){
	 		parsedDate = currentDate.split("/");
	 		targetDate = removeMonths(new Date(parsedDate[2], parsedDate[1]-1, parsedDate[0]), maxMonthsAgo);
	 	} else {
	 		targetDate = removeMonths(new Date(currentDate), maxMonthsAgo);
	 	}
	 	return (new Date(measuredDate) >= targetDate);	
	};
	
	//Returns time String of the most recent date from an array of dates
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
		
		return new Date(Math.max.apply(null,parsedDateArray)).getTime();
	}

	function getAge(currentDate, birthDate) {
	    var currentDate = new Date(currentDate);
	    var birthDate = new Date(birthDate);
	    var age = currentDate.getFullYear() - birthDate.getFullYear();
	    var m = currentDate.getMonth() - birthDate.getMonth();
	    if (m < 0 || (m === 0 && currentDate.getDate() < birthDate.getDate())) {
	        age--;
	    }

	    return age;
	}
	
	//Approximate -- each month assumed to have 30 days
	function getAgeInMonths(currentDate, birthDate) {
		var currentDate = new Date(currentDate);
	    var birthDate = new Date(birthDate);
	    var msToMonths = 1000*60*60*24*30;
	    return Math.round((currentDate - birthDate) / msToMonths);
	}
	
	function resetToDefault(rule) {
		if (rule.hasOwnProperty("modifiable") && rule.hasOwnProperty("defaults")) {
			fields = rule.modifiable;
			defaults = rule.defaults;
			for (var i = 0; i < fields.length; i++) {
				rule[fields[i]] = defaults[i];
			}
		}
	}
	
	var lookupVarNameTable = {
		'minAge': 'Minimum Age',
		'maxAge': 'Maximum Age',
		'months': 'Months Since',
		'minAgeMonths': 'Minimum Age (months)',
		'maxAgeMonths': 'Maximum Age (months)',
		'sysTarget': 'Systolic BP Target',
		'diasTarget': 'Diastolic BP Target'
	};
	
	var ruleDMPastNMonths = {
		desc: function(){return "Diabetic Assessment in past " + this.months + " months"; },
		long_desc: function(){return "% of patients who have had a diabetic assessment in the past " + this.months + " months"; },
	 	months: 12,
	 	modifiable: ["months"],
	 	defaults: [12],
	 	col: ["Current Date", "DM Months"],
	 	rule: function(currentDate, measuredDate) {
	 		try {
	 			// Old version output date of last assessment
	 			// New version outputs number of months since last assessment,
	 			// have to check which case and handle appropriately
		 		if (isNaN(parseInt(measuredDate)) && measuredDate != "") {
		 			if (currentDate.match(/\d{2}\/\d{2}\/\d{4}/) ){
		 				parsedDate = currentDate.split("/");
		 				targetDate = removeMonths(new Date(parsedDate[2], parsedDate[1]-1, parsedDate[0]), this.months);
			 		} else {
			 			targetDate = removeMonths(new Date(currentDate), this.months);
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
		modifiable: ["months"],
		defaults: [6],
		reset: function() {
			this.months = 6;
		},
	 	col: ["Current Date", "Date Hb A1C"],
	 	rule: function(currentDate, measuredDate) {
	 		try {
	 			return withinDateRange(currentDate, this.months, measuredDate);
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
		modifiable: ["months", "target"],
		defaults: [6, 0.08],
	 	rule: function(currentDate, measuredDate, value) {
	 		try {
	 			return (withinDateRange(currentDate, this.months, measuredDate) && parseFloat(value) <= this.target);
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
		long_desc: function(){return "% of patients with LDL less than or equal to 2.0";},
	 	col: ["Current Date", "Date Systolic BP", "Systolic BP", "Diastolic BP"],
	 	months: 6,
	 	sysTarget: 130,
		diasTarget: 80,
	 	modifiable: ["months", "sysTarget", "diasTarget"],
	 	defaults: [6, 130, 80],
	 	rule: function(currentDate, measuredDate, sysValue, diasValue) {
	 		try {
	 			return (withinDateRange(currentDate, this.months, measuredDate) &&
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
		modifiable: ["months"],
		defaults: [12],
	 	col: ["Current Date", "Date Microalbumin/Creatinine Ratio", "Microalbumin/Creatinine Ratio"],
	 	rule: function(currentDate, measuredDate, value) {
	 		try {
	 			return withinDateRange(currentDate, this.months, measuredDate) && parseFloat(value) != NaN;
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
	 			return withinDateRange(currentDate, this.months, measuredDate) && (parseFloat(value) < this.target || value=="<2.0");
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
	  			return withinDateRange(currentDate, this.months, measuredDate) && (parseFloat(value) < this.target || value=="<2.8");
	 		} catch (err) {
	 			console.log("Error: " + err);
	 			return false;
	 		}
	 	}
	};
	
	var ruleEGFRMeasuredPastNMonths = {
		desc: function(){return "EGFR measured in past " + this.months + " months";},
		long_desc: function(){return "% of patients with EGFR measured in the past " + this.months + " months";},
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
		desc: function(){return "EGFR > " + this.target + " in past " + this.months + " months";},
		long_desc: function(){return "% of patients with EGFR greater than " + this.target + " measured in the past " + this.months + " months";},
	 	col: ["Current Date", "Date eGFR", "eGFR"],
		months: 12,
		target: 60,
		modifiable: ["months", "target"],
		defaults: [12, 60],
	 	rule: function(currentDate, measuredDate, value) {
			try {
	 			return withinDateRange(currentDate, this.months, measuredDate) && 
	 					(parseInt(value) > this.target || value == ">=90" || value == ">120");
	 		} catch (err) {
	 			return false;
	 		}
	 	}
	};
	
	var ruleCurrentSmokers = {
		desc: function(){return "Current Smokers"; },
		long_desc: function() { return "% of patients who are coded as current smokers"; },
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
		long_desc: function() { return "% of patients who are coded as current smokers"; },
		col: ["Current Date", "Date Systolic BP", "Age"],
		months: 12,
		age: 40,
		modifiable: ["months", "age"],
		defaults: [12, 40],
		rule: function(currentDate, measuredDate, value) {
			try {
				if (parseInt(value) < 40) {
					return NaN;
				} else {
					return (withinDateRange(currentDate, this.months, measuredDate) && (parseInt(value) >= this.age));
	 			}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};


	var ruleElevatedBPRegularVisit = {
		desc: function(){return "Last visit within " + this.months + " months if BP > " + this.sysTarget + "/" + this.diasTarget; },
		long_desc: function() { return "% of patients who are coded as current smokers"; },
		col: ["Current Date", "Last Seen Date", "Systolic BP", "Diatolic BP"],
		months: 9,
		sysTarget: 140,
		diasTarget: 90,
		modifiable: ["months", "sysTarget", "diasTarget"],
		defaults: [9, 140, 90],
		rule: function(currentDate, measuredDate, sysValue, diasValue) {
			try {
				if (parseInt(sysValue) < this.sysTarget && parseInt(diasValue) < this.diasTarget) {
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
	
	

	var ruleInfantVaccinations = {
		desc: function(){return "Infant immunization schedule up to date"; },
		long_desc: function() { return "Infant immunization schedule up to date"; },
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
		modifiable: ["age"],
		rule: function(currentDate, birthDate,
						measles, mumps, rubella, diphtheria, tetanus, pertussis, varicella, rotavirus, polio) {
			try {
				if (getAge(currentDate, birthDate) > this.age) {
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
	
	//Does not account for boosters
	var ruleChildVaccinations = {
		desc: function(){return "Children with all immunizations"; },
		long_desc: function() { return "Children with all immunizations"; },
		col: ["Current Date", "Birthdate",
			  "measles", "mumps", "rubella",
			  "diphtheria", "tetanus", "pertussis",
			  "varicella", "rotavirus", "polio",
			  "hib conjugate", "pneumococcal conjugate", "meningococcal conjugate"],
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
		modifiable: ["age"],
		rule: function(currentDate, birthDate,
						measles, mumps, rubella, diphtheria, tetanus, pertussis, varicella, rotavirus, polio, hib, pneuc, mencc) {
			try {
				//if younger than 18 than not included
				if (getAge(currentDate, birthDate) < this.minAge ||
					getAge(currentDate, birthDate) > this.maxAge) {
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
							parseInt(polio) >= this.polio &&
							parseInt(hib) >= this.hib &&
							parseInt(pneuc) >= this.pneuc &&
							parseInt(mencc) >= this.mencc);
	 			}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};


	//Does not account for boosters
	var ruleTeenagerVaccinations = {
		desc: function(){return "Adults with all immunizations"; },
		long_desc: function() { return "Adults with all immunizations"; },
		col: ["Current Date", "Birthdate",
			  "measles", "mumps", "rubella",
			  "diphtheria", "tetanus", "pertussis",
			  "varicella", "rotavirus", "polio",
			  "hib conjugate", "pneumococcal conjugate", "meningococcal conjugate"],
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
		modifiable: ["minAge"],
		dafaults: [18],
		rule: function(currentDate, birthDate,
						measles, mumps, rubella, diphtheria, tetanus, pertussis, varicella, rotavirus, polio, hib, pneuc, mencc) {
			try {
				//if younger than 18 than not included
				if (getAge(currentDate, birthDate) < this.minAge ||
					getAge(currentDate, birthDate) > this.maxAge) {
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
							parseInt(polio) >= this.polio &&
							parseInt(hib) >= this.hib &&
							parseInt(pneuc) >= this.pneuc &&
							parseInt(mencc) >= this.mencc);
	 			}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};


	var ruleHeightWeightLastVaccination = {
		desc: function(){return "Height and Weight at last immunization"; },
		long_desc: function() { return "Height and Weight measured at last immunization"; },
		col: ["height date", "weight date",
			  "measles date", "mumps date", "rubella date",
			  "diphtheria date", "tetanus date", "pertussis date", "varicella date", "rotavirus date", "polio date",
			  "pneumococcal conjugate date", "meningococcal conjugate date", "hib conjugate date"],
		rule: function(heightDate, weightDate,
						measles, mumps, rubella, diphtheria, tetanus, pertussis, varicella, rotavirus, polio) {
			try {
				if (heightDate != weightDate) {
					return false;
				} else {
					return (new Date(heightDate).getTime() == mostRecentDate([measles, mumps, rubella, diphtheria, tetanus, pertussis, varicella, rotavirus, polio]));
	 			}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};

	var ruleSmokingStatusRecorded = {
		desc: function(){return "Smoking Status Recorded"; },
		long_desc: function() { return "Smoking Status Recorded in Risk Factors"; },
		col: ["Risk Factors"],
		rule: function(factors) {
			try {
				if (factors.length == 0 || factors.toLowerCase().indexOf('smok') == -1) {
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
	
	var ruleWellBabyVisit = {
		desc: function() { return "Well Baby Visit for infants " + this.minAge + " to " + this.maxAge; },
		long_desc: function() { return "Percent of children " + this.minAge + " to " + this.maxAge + " who have completed their 18 month well baby visit"; },
		col: ["Current Date", "Birthdate", "A002", "A268", "Rourke IV"],
		minAgeMonths: 17,
		maxAgeMonths: 24,
		modifiable: ['minAgeMonths', 'maxAgeMonths'],
		defaults: [17, 24],
		rule: function(currentDate, birthDate, A002, A268, rourke) {
			try {
				var age = getAgeInMonths(currentDate, birthDate);
				if (age >= this.minAgeMonths && age <= this.maxAgeMonths &&
					(A002 != 0 || A268 != 0 || rourke != 0)) {
						return true;
				} else {
					return false;
				}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
		
	};

	//Smoking Cessation Form is a count of the number of times LUNG-Smoking_Initial_Assessment_MOHLTC form has been performed
	var ruleSmokingCessation = {
		desc: function(){return "Smoking Cessation Attempted"; },
		long_desc: function() { return "Smoking Cessation form in patient chart"; },
		col: ["Risk Factors", "Smoking Cessation Form"],
		rule: function(factors, form) {
			try {
				if (factors.length == 0 || !ruleSmokingStatusRecorded.rule(factors)) {
					return NaN;
				} else if (form == "" ){
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
	
	var ruleLungHealthForm = {
		desc: function(){return "Lung Health Recorded"; },
		long_desc: function() { return "Canadian Lung Health Form in patient chart"; },
		col: ["Lung Health Form"],
		rule: function(form) {
			try {
				if (form == "") {
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
	
	var ruleSeniorsPneumovax = {
		desc: function(){return "Seniors Recieving Pneumovax"; },
		long_desc: function() { return "Patients over the age of 65 vaccinated for pneumonia"; },
		col: ["Current Date", "Age", "pneumococcal polysaccharide"],
		age: 65,
		modifiable: ["age"],
		defaults: [65],
		rule: function(currentDate, age, pneuc) {
			try {
				//Only people older than 65 qualify
				if (parseInt(age) <= this.age) {
					return NaN;
				} else if (parseInt(pneuc) > 0) {
					return true;
				} else {
					return false;
				}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};
	
	var ruleAdultSmokersPneumovax = {
		desc: function(){return "Adult Smokers Recieving Pneumovax"; },
		long_desc: function() { return "Patients over the age of 19 who smoke vaccinated for pneumonia"; },
		col: ["Current Date", "Age", "Risk Factors", "pneumococcal polysaccharide"],
		age: 19,
		modifiable: ["age"],
		defaults: [19],
		rule: function(currentDate, age, pneuc) {
			try {
				//Only people older than 65 qualify
				if (parseInt(age) >= this.age) {
					return NaN;
				} else if (parseInt(pneuc) > 0) {
					return true;
				} else {
					return false;
				}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};
	
	var ruleLungDiseasePneumovax = {
		desc: function(){return "Adults with COPD or Asthma Recieving Pneumovax"; },
		long_desc: function() { return "Patients over the age of 19 who have COPD or asthma vaccinated for pneumonia"; },
		col: ["Current Date", "Age", "Problem List", "pneumococcal polysaccharide"],
		age: 19,
		modifiable: ["age"],
		defaults: [19],
		diseaseList: ["copd", "asthma", "chronic bronchitis", "490", "491", "492", "493", "494", "496"],
		rule: function(currentDate, age, problemList, pneuc) {
			try {
				//Only people older than 65 qualify
				if (parseInt(age) >= this.minAge) {
					return NaN;
				}
				problemList = problemList.toLowerCase();
				if (new RegExp(this.diseaseList.join("|")).test(problemList)) {
					return (parseInt(pneuc) > 0 ?  true : false);
				} else {
					return NaN;
				}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};
	
	var rulePHQ9 = {
		desc: function(){return "Patients with multiple PHQ9 forms"; },
		long_desc: function() { return ["Adult patients over have depression and have filled out at least one PHQ9 form",
								 "have more than one PHQ9 form. This is an indication it is being used for follow-up"].join("\n"); },
		col: ["Current Date", "PHQ9 Dates","PHQ9 Occurences"],
		months:6,
		modifiable: ["months"],
		defaults: [6],
		rule: function(currentDate, formDate, count) {
			try {
				if (count == 0) {
					return NaN;
				} else if (count == 1 && !withinDateRange(currentDate, this.months, formDate)) {
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
		desc: function(){return "Youth on ADHD meds annual year"; },
		long_desc: function() { return "Youth diagnosed with ADHD and on medications for ADHD have had an annual visit"; },
		col: ["Current Date", "Last Seen Date"],
		months:12,
		modifiable: ["months"],
		defaults: [12],
		rule: function(currentDate, lastSeenDate) {
			try {
				return withinDateRange(currentDate, this.months, lastSeenDate);
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	};
	
	var ruleBreastCancer = {
		desc: function(){return "Up-to-date on breast cancer screening"; },
		long_desc: function() { return "Patients aged " + this.minAge + " to " + this.maxAge + " who received a mammogram in the past " + months + " months"; },
		col: ["Current Date", "Age", "Mammogram"],
		months:3*12,
		minAge:50,
		maxAge:69,
		modifiable: ["months", "minAge", "maxAge"],
		defaults: [3*12, 50 , 69],
		rule: function(currentDate, age, mammDate) {
			try {
				if (parseInt(age) > this.minAge && parseInt(age) < this.maxAge &&
					withinDateRange(currentDate, this.months, mammDate)){
						return true;
				} else {
					return false;
				}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	}
	
	var ruleCervicalCancer = {
		desc: function(){return "Up-to-date on cervical cancer screening"; },
		long_desc: function() { return "Patients aged " + this.minAge + " to " + this.maxAge + " who received a Pap test in the past " + months + " months"; },
		col: ["Current Date", "Age", "Pap Test Report"],
		months:3*12,
		minAge:25,
		maxAge:69,
		modifiable: ["months", "minAge", "maxAge"],
		defaults: [3*12, 25, 69],
		rule: function(currentDate, age, papDate) {
			try {
				if (parseInt(age) > this.minAge && parseInt(age) < this.maxAge &&
					withinDateRange(currentDate, this.months, papDate)){
						return true;
				} else {
					return false;
				}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	}
	
	var ruleColorectalCancer = {
		desc: function(){return "Up-to-date on colorectal cancer screening"; },
		long_desc: function() { return "Patients over the age of " + this.minAge + " who performed an FOBT in the past " + months + " months"; },
		col: ["Current Date", "Age", "FOBT"],
		months:2*12,
		minAge:50,
		modifiable: ["months", "minAge"],
		defaults: [2*12, 50],
		rule: function(currentDate, age, fobtDate) {
			try {
				if (parseInt(age) > this.minAge && withinDateRange(currentDate, this.months, fobtDate)){
						return true;
				} else {
					return false;
				}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	}
	
	var ruleFluVaccine = {
		desc: function(){return "Up-to-date on Influenza Vaccine"; },
		long_desc: function() { return "Patients over the age of " + this.minAge + " who received a flu vaccine in the past " + months + " months"; },
		col: ["Current Date", "Age", "influenza date"],
		months:12,
		minAge:65,
		modifiable: ["months", "minAge"],
		defaults: [12, 65],
		rule: function(currentDate, age, fluDate) {
			try {
				if (parseInt(age) >= this.minAge && withinDateRange(currentDate, this.months, fluDate)){
						return true;
				} else {
					return false;
				}
			} catch (err) {
				console.log(err);
				return false;
			}
		}
	}

	//Assemble rules into sets
	var diabetesRules = [ruleDMPastNMonths,
						 ruleA1cPastNMonths, 
						 ruleA1cLessThanEqualToXPastNMonths,
						 ruleLDLPastNMonths
					     ];
						 
		//Assemble rules into sets
	var diabetesExtendedRules = [ruleBPPastNMonths, 
						 ruleBPLessThanS_DLastNMonths, 
						 ruleLDLLessThanEqualToXPastNMonths, 
						 ruleACRLastNMonths,
						 ruleACRFemaleLessThanXLastNMonths,
						 ruleACRMaleLessThanXLastNMonths,
						 ruleEGFRMeasuredPastNMonths, 
						 ruleEGFRGreaterThanXPastNMonths,
						 ruleCurrentSmokers,
						 ruleDMPastNMonths,
						 ruleA1cPastNMonths, 
						 ruleA1cLessThanEqualToXPastNMonths,
						 ruleLDLPastNMonths
						 ];
						 
						 
	var hypertensionRules = [ruleBaselineBP,
							 ruleElevatedBPRegularVisit,
							 ruleBPLessThanS_DLastNMonths];
							 
	var immunizationRules = [ruleHeightWeightLastVaccination,
							 ruleInfantVaccinations,
							 ruleChildVaccinations,
							 ruleTeenagerVaccinations];
							 
	var smokingCessationRules = [ruleSmokingStatusRecorded,
								 ruleSmokingCessation];
	
	var lungHealthRules = [ruleAdultSmokersPneumovax,
						   ruleSeniorsPneumovax,
						   ruleLungDiseasePneumovax,
						   ruleLungHealthForm];
						   
	var adultMentalHealthRules = [rulePHQ9];
	
	var youthADHDRules = [ruleADHDMedReview];
	
	var cancerScreeningRules = [ruleBreastCancer,
								ruleCervicalCancer,
								ruleColorectalCancer,
								ruleFluVaccine]
	//Add sets of rules to the master list
	var ruleList = [{name:"Diabetes", rules:diabetesRules},
					{name:"Hypertension", rules:hypertensionRules},
					{name:"Immunizations", rules:immunizationRules},
					{name:"Smoking Cessation", rules:smokingCessationRules},
					{name:"Lung Health", rules:lungHealthRules},
					{name:"Depression", rules:adultMentalHealthRules},
					{name: "Adult Preventative Care", rules:cancerScreeningRules},
					{name:"ADHD", rules:youthADHDRules},
					{name:"Diabetes (Full)", rules:diabetesExtendedRules}];

	function applyRules(ruleListIndex, filteredData) {
		//Loop through data from each file
		var results = [];
		
		currentRuleList = ruleList[ruleListIndex];
		
		//loop through each file
		for (var i = 0; i < filteredData.length; i++) {
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
				  	passed: passed.filter(function(e) { return (e == true); }).length,
				  	total: num_items - passed.filter(function(e) { return (isNaN(e).length); })
			});
		}	
		return results;
	};
	
		/* 
	 * Inspect header of text file to guess which indicator set is most appropriate
	 * Indicator sets are listed in the ruleList variable in reportRules
	 */
	function getCurrentRuleSet(header) {
		if (header.indexOf("Patient #") == -1 || header.indexOf("Doctor Number") == -1) {
			alert("File does not contain necessary data element Patient # or Doctor Number");
		}
		
		var rule = 0;
		
		//Diabetes
		if (header.indexOf("Hb A1C") != -1) {
			rule = 0;
		//Hypertension
		} else if (header.indexOf("Systolic BP") != -1) {
			rule = 1;
		//Immunizations
		} else if (header.indexOf("height date") != -1) {
			rule = 2;
		//Smoking Cessation
		} else if (header.indexOf("Smoking Cessation Form") != -1) {
			rule = 3;
		//Lung Health
		} else if (header.indexOf("Lung Health Form") != -1) {
			rule = 4;
		//Depression
		} else if (header.indexOf("PHQ9 Dates") != -1) {
			rule = 5;
		//Cancer Screening
		} else if (header.indexOf("Mammogram") != -1) {
			rule = 6;
		//Youth ADHD
		} else {
			rule = 7;
		}
		
		return rule;
	}
	
	return {
		applyRules: applyRules,
		ruleList: ruleList,
		resetToDefault: resetToDefault,
		getCurrentRuleSet: getCurrentRuleSet,
		lookupVarNameTable: lookupVarNameTable
	};
	
})();