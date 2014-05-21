// **************************************************************************************************************************************************
// @author Brice Wong
// Copyright 2014 Hamilton Family Health Team
//
// dataManipulation.js
// 
// This document contains the global variables and functions that are associated with data manipulation in the Report Generator. It checks to see
// what filters are selected and pulls the records that match the filters from each imported file. Calculations are ran on the filtered data to count
// the number of patients that meet the criteria. This information is then used by "generateVisualization.js" to create the visualization. 
//
// **************************************************************************************************************************************************


// Default diabetic measures index in dropdown menu - for Tracking Mode
var DEFAULT_INDEX_DIABETIC_ASSESSMENT = 0,
	DEFAULT_INDEX_A1C_MEASURED = 1,
	DEFAULT_INDEX_A1C_COMPARED = 2,
	DEFAULT_INDEX_BP_MEASURED = 3,
	DEFAULT_INDEX_BP_COMPARED = 4,
	DEFAULT_INDEX_LDL_MEASURED = 5,
	DEFAULT_INDEX_LDL_COMPARED = 6,
	DEFAULT_INDEX_ACR_MEASURED = 7,
	DEFAULT_INDEX_ACR_MALE_COMPARED = 8,
	DEFAULT_INDEX_ACR_FEMALE_COMPARED = 9,
	DEFAULT_INDEX_EGFR_MEASURED = 10,
	DEFAULT_INDEX_EGFR_COMPARED = 11,
	DEFAULT_INDEX_NUM_RETINOPATHY = 12,
	DEFALUT_INDEX_NUM_FOOT_CHECKS = 13,
	DEFAULT_INDEX_NUM_SELF_MANAGEMENT = 14,
	DEFAULT_INDEX_NUM_CURRENT_SMOKERS = 15;
	
	
// Array variables that will store information about the calculated data
// 
// arrayFilteredData: 
// arrayCalculatedData: Stores the data from 'arrayParsedData' that match the selected filters and select options from the drop down menus
// arrayDates: 
var arrayFilteredData,
	arrayCalculatedData,
	arrayDates;


/*
* filterData:
* - Filters data based on the selected physicians and populates 'arrayFilteredData' with the filtered rows from each CSV file
*
*/
function filterData() {
	
	console.log("Filtering data...");
	
	// Empty 'arrayFilteredData'
	arrayFilteredData = [];
	
	// Loop through each CSV file imported
	for (var i = 0; i < arrayParsedData.length; i++) {
	
		// Push an empty array into 'arrayFilteredData' and push the header row into it
		arrayFilteredData.push(new Array());
		arrayFilteredData[i].push(arrayParsedData[i][0]);
	
		// Loop through each row of data in the file, start at row 1
		for (var j = 1; j < arrayParsedData[i].length; j++) {
		
			// Get doctor number
			var docNum = arrayParsedData[i][j][DEFAULT_COLUMN_DOCTOR_NUMBER];
			
			// Get index of doctor number from arrayUniquePhysicians
			var docIndex = arrayUniquePhysicians.getArrayIndex(docNum);
			
			// Use index to see if doctor is selected in the side panel
			var docSelected = arraySelectedPhysicians[docIndex];
			
			// If selected, push row into 'arrayFilteredData'
			if (docSelected)
				arrayFilteredData[i].push(arrayParsedData[i][j]);
		}
	}
}



/*
* calculateDataSnapshotMode:
* - Calculates data for Snapshot mode
* - Loops through each patient of filtered physicians and increment diabetic measure counters as needed
*
*/
function calculateDataSnapshotMode() {

	console.log("Calculating patient counts for Snapshot Mode...");
	
	// Initialize array for calculated data
	arrayCalculatedData = [];
	
	// Initialize and set counts for diabetic measures
	var countDiabeticAssessment = calculateCountDiabeticMeasure(0, DEFAULT_INDEX_DIABETIC_ASSESSMENT),
		countA1CMeasured = calculateCountDiabeticMeasure(0, DEFAULT_INDEX_A1C_MEASURED),
		countA1CCompared = calculateCountDiabeticMeasure(0, DEFAULT_INDEX_A1C_COMPARED),
		countBPMeasured = calculateCountDiabeticMeasure(0, DEFAULT_INDEX_BP_MEASURED),
		countBPCompared = calculateCountDiabeticMeasure(0, DEFAULT_INDEX_BP_COMPARED),
		countLDLMeasured = calculateCountDiabeticMeasure(0, DEFAULT_INDEX_LDL_MEASURED),
		countLDLCompared = calculateCountDiabeticMeasure(0, DEFAULT_INDEX_LDL_COMPARED),
		countACRMeasured = calculateCountDiabeticMeasure(0, DEFAULT_INDEX_ACR_MEASURED),
		countACRComparedMale = calculateCountDiabeticMeasure(0, DEFAULT_INDEX_ACR_MALE_COMPARED),
		countACRComparedFemale = calculateCountDiabeticMeasure(0, DEFAULT_INDEX_ACR_FEMALE_COMPARED),
		countEGFRMeasured = calculateCountDiabeticMeasure(0, DEFAULT_INDEX_EGFR_MEASURED),
		countEGFRCompared = calculateCountDiabeticMeasure(0, DEFAULT_INDEX_EGFR_COMPARED),
		countRetinopathy = calculateCountDiabeticMeasure(0, DEFAULT_INDEX_NUM_RETINOPATHY),
		countFootChecks = calculateCountDiabeticMeasure(0, DEFALUT_INDEX_NUM_FOOT_CHECKS),
		countSelfManagement = calculateCountDiabeticMeasure(0, DEFAULT_INDEX_NUM_SELF_MANAGEMENT),
		countCurrentSmokers = calculateCountDiabeticMeasure(0, DEFAULT_INDEX_NUM_CURRENT_SMOKERS);
	
	// Denominator
	var numFilteredPatients = arrayFilteredData[0].length - 1;
	
	// Push labels and values into calculated array
	arrayCalculatedData.push([	"Diabetic Assessment in past " + DEFAULT_VALUE_DIABETIC_ASSESSMENT + " months",
								"A1C measured in past " + DEFAULT_VALUE_A1C_MEASURED + " months",
								"A1C \u2264 " + DEFAULT_VALUE_A1C_COMPARED + " in past " + DEFAULT_VALUE_A1C_MEASURED + " months",
								"BP measured in past " + DEFAULT_VALUE_BP_MEASURED + " months",
								"BP < " + DEFAULT_VALUE_BP_SYS_COMPARED + "/" + DEFAULT_VALUE_BP_DIAS_COMPARED + " in past " + DEFAULT_VALUE_BP_MEASURED + " months",
								"LDL measured in past " + DEFAULT_VALUE_LDL_MEASURED + " months",
								"LDL \u2264 " + DEFAULT_VALUE_LDL_COMPARED + " in past " + DEFAULT_VALUE_LDL_MEASURED + " months",
								"ACR measured in past " + DEFAULT_VALUE_ACR_MEASURED + " months",
								//"ACR Male < " + DEFAULT_VALUE_ACR_MALE_COMPARED + " in past " + DEFAULT_VALUE_ACR_MEASURED + " months",
								//"ACR Female < " + DEFAULT_VALUE_ACR_FEMALE_COMPARED + " in past " + DEFAULT_VALUE_ACR_MEASURED + " months",
								"eGFR measured in past " + DEFAULT_VALUE_EGFR_MEASURED + " months",
								"eGFR > " + DEFAULT_VALUE_EGFR_COMPARED + " in past " + DEFAULT_VALUE_EGFR_MEASURED + " months",
								"Retinopathy",
								"Foot Checks",
								"Self-Management",
								"Current Smokers"]);
								
	arrayCalculatedData.push([	countDiabeticAssessment/numFilteredPatients*100,
								countA1CMeasured/numFilteredPatients*100,
								countA1CCompared/numFilteredPatients*100,
								countBPMeasured/numFilteredPatients*100,
								countBPCompared/numFilteredPatients*100,
								countLDLMeasured/numFilteredPatients*100,
								countLDLCompared/numFilteredPatients*100,
								countACRMeasured/numFilteredPatients*100,
								//countACRComparedMale/numFilteredPatients*100,
								//countACRComparedFemale/numFilteredPatients*100,
								countEGFRMeasured/numFilteredPatients*100,
								countEGFRCompared/numFilteredPatients*100,
								countRetinopathy/numFilteredPatients*100,
								countFootChecks/numFilteredPatients*100,
								countSelfManagement/numFilteredPatients*100,
								countCurrentSmokers/numFilteredPatients*100]);	

}



/*
* calculateDataTrackingMode:
* - Calculates data for Tracking mode
* - Retrieves index of diabetic measures drop down menu and create array of counts for that measure
*
*/
function calculateDataTrackingMode() {

	console.log("Calculating patient counts for Tracking Mode...");

	arrayDates = [];
	arrayCalculatedData = [];
	
	// Retrieve index of diabetic measures drop down menu, use index to calculate data for graphing
	var measureIndex = document.getElementById("dropdownDiabeticMeasures").selectedIndex;
	
	// Loop through each CSV file imported of the filtered data
	for (var i = 0; i < arrayFilteredData.length; i++) {
	
		if (arrayFilteredData[i].length > 1) {
		
			// Push date into dates array. Call from parsed array because filtered array might not have date for that file
			arrayDates.push(new Date(DEFAULT_DATE_FORMAT.parse(arrayParsedData[i][1][DEFAULT_COLUMN_CURRENT_DATE])));
			
			// Push empty array for current file, will store date for sorting, and value of diabetic measure
			arrayCalculatedData.push(new Array());
			
			// Reset the count, and set to calculate count based on measure index
			var count = 0;
			count = calculateCountDiabeticMeasure(i, measureIndex);
			
			// Denominator
			var numFilteredPatients = arrayFilteredData[i].length - 1;
			
			// Finish calculating all diabetic measure for this CSV file
			// Insert date as first element, for sorting. Insert percentages into array 0.XX
			arrayCalculatedData[arrayCalculatedData.length - 1].push(arrayParsedData[i][1][DEFAULT_COLUMN_CURRENT_DATE]); // Date - index 0
			arrayCalculatedData[arrayCalculatedData.length - 1].push(count / numFilteredPatients);

		}
	}
	
	// Sort by date
	arrayCalculatedData.sort(function(a, b) {
		a = new Date(DEFAULT_DATE_FORMAT.parse(a[0]));
		b = new Date(DEFAULT_DATE_FORMAT.parse(b[0]));
		return a < b ? - 1 : a > b ? 1 : 0; 
	});
	
	// Sort by date
	arrayDates.sort(function(a,b) {
		return a < b ? - 1 : a > b ? 1 : 0; 
	});
	
	// For each file, splice out the date
	for (var i = 0; i < arrayCalculatedData.length; i++) {
		arrayCalculatedData[i] = arrayCalculatedData[i].splice(1);
	}

}









// Functions for calculating patients counts for specific diabetic measures

function calculateCountDiabeticMeasure(fileIndex, measureIndex) {
	
	// Reset the count
	var count = 0;
	
	// Loop through each patient (skip header row)
	for (var i = 1; i < arrayFilteredData[fileIndex].length; i++) {
		
		switch (measureIndex) {
		
			// Diabetic Assessment
			case DEFAULT_INDEX_DIABETIC_ASSESSMENT:
				if (new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_DM_MONTHS]))
					>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_DIABETIC_ASSESSMENT))
					count++;
				break;
				
			// A1C measured
			case DEFAULT_INDEX_A1C_MEASURED:
				if (new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_A1C_DATE]))
					>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_A1C_MEASURED))
					count++;
				break;
				
			// A1C compared
			case DEFAULT_INDEX_A1C_COMPARED:
				if (new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_A1C_DATE]))
					>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_A1C_MEASURED)
					&& parseFloat(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_A1C]) <= DEFAULT_VALUE_A1C_COMPARED)
					count++;
				break;			
			
			// BP measured
			case DEFAULT_INDEX_BP_MEASURED:
				if (new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_SYSTOLIC_BP_DATE]))
					>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_BP_MEASURED)
					&& new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_DIASTOLIC_BP_DATE]))
					>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_BP_MEASURED))
					count++;
				break;
				
			// BP compared
			case DEFAULT_INDEX_BP_COMPARED:
				if ((new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_SYSTOLIC_BP_DATE]))
					>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_BP_MEASURED)
					&& new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_DIASTOLIC_BP_DATE]))
					>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_BP_MEASURED))
					&& (parseFloat(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_SYSTOLIC_BP]) < DEFAULT_VALUE_BP_SYS_COMPARED
					|| parseFloat(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_DIASTOLIC_BP]) < DEFAULT_VALUE_BP_DIAS_COMPARED))
					count++;
				break;
			
			// LDL measured
			case DEFAULT_INDEX_LDL_MEASURED:
				if (new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_LDL_DATE]))
					>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_LDL_MEASURED))
					count++;
				break;
				
			// LDL compared
			case DEFAULT_INDEX_LDL_COMPARED:
				if (new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_LDL_DATE]))
					>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_LDL_MEASURED)
					&& (parseFloat(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_LDL]) <= DEFAULT_VALUE_LDL_COMPARED
					|| arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_LDL] == "<1.00"))
					count++;
				break;
				
			// ACR measured
			case DEFAULT_INDEX_ACR_MEASURED:
				if ((new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_ACR_DATE]))
					>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_ACR_MEASURED))
					&& arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_ACR] != "unable to do")
					count++;
				break;
			
			// ACR compared male
			case DEFAULT_INDEX_ACR_MALE_COMPARED:
				if ((new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_ACR_DATE]))
					>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_ACR_MEASURED))
					&& arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_PATIENT_SEX] == "M"
					&& (arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_ACR] == "<2.0"
					|| parseFloat(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_ACR]) < DEFAULT_VALUE_ACR_MALE_COMPARED)) {
					count++;
					console.log(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_PATIENT_NUMBER] + " " + arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_ACR])
					}
				break;
				
			// ACR compared female
			case DEFAULT_INDEX_ACR_FEMALE_COMPARED:
				if ((new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_ACR_DATE]))
					>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_ACR_MEASURED))
					&& arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_PATIENT_SEX] == "F"
					&& (arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_ACR] == "<2.8"
					|| parseFloat(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_ACR]) < DEFAULT_VALUE_ACR_FEMALE_COMPARED))
					count++;
				break;
				
			// eGFR measured
			case DEFAULT_INDEX_EGFR_MEASURED:
				if (new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_EGFR_DATE]))
					>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_EGFR_MEASURED))
					count++;
				break;
			
			// eGFR compared
			case DEFAULT_INDEX_EGFR_COMPARED:
				if (new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_EGFR_DATE]))
					>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_EGFR_MEASURED)
					&& (arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_EGFR] == ">=90"
					|| arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_EGFR] == ">120"
					|| parseFloat(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_EGFR]) > DEFAULT_VALUE_EGFR_COMPARED))
					count++;
				break;
			
			// Num retinopathy
			case DEFAULT_INDEX_NUM_RETINOPATHY:
				if (arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_RETINOPATHY] == "Y"
					|| arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_RETINOPATHY] == "true")
					count++;
				break;
			
			// Num foot checks
			case DEFALUT_INDEX_NUM_FOOT_CHECKS:
				if (arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_FOOT_CHECK] == "Y"
					|| arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_FOOT_CHECK] == "true")
					count++;
				break;
			
			// Num self management
			case DEFAULT_INDEX_NUM_SELF_MANAGEMENT:
				if (arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_SELF_MANAGEMENT] == "Y"
					|| arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_SELF_MANAGEMENT] == "true")
					count++;
				break;
			
			// Num current smokers
			case DEFAULT_INDEX_NUM_CURRENT_SMOKERS:
				if (arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_RISK].indexOf("current smoker") != -1)
					count++;
				break;
		}
	}
	
	return count;

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







































	
	