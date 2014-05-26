var diabetesRules = [ruleDiabeticAssessment];


var ruleDiabeticAssessment = 
	["Diabetic Assessment in past 6 months",
 	" ",
 	function(val) {
		if (new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_DM_MONTHS]))
		>= calculateMonthsSince(new Date(DEFAULT_DATE_FORMAT.parse(arrayFilteredData[fileIndex][i][DEFAULT_COLUMN_CURRENT_DATE])), DEFAULT_VALUE_DIABETIC_ASSESSMENT))
	}];
		

