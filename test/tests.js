(function() {

	var m = mdsIndicators;


	/*
		Diabetes Tests
	*/
	var diabetes = m.ruleList[0]["rules"];

	var DMPastNMonths = diabetes[0];
	var A1CPastNMonths = diabetes[1];
	var A1CLTEXPastNMonths = diabetes[2];
	var LDLPastNMonths = diabetes[3];

	// DM Past N Months
	QUnit.test("DM Past N Months", function (assert) {
		assert.ok(
							//current date, measured date
			DMPastNMonths.rule("Oct 21, 2014", "Sept 21, 2014") === true,
			"Up-to-date passed")
		assert.ok(
			DMPastNMonths.rule("Oct 21, 2014", "Sept 21, 2013") === false,
			"Out-of-date passed")
		assert.ok(
			DMPastNMonths.rule("Oct 21, 2014", "") === false,
			"No Date passed")
		assert.ok(
			isNaN(DMPastNMonths.rule("Oct 21, 2014", "Nov 21, 2014")),
			"Future date passed")
		assert.ok(
			DMPastNMonths.rule("Oct 21, 2014", "6") === true,
			"Up-to-date (compat) passed")
		assert.ok(
			DMPastNMonths.rule("Oct 21, 2014", "13") === false,
			"Out-of-date (compat) passed")
	});

	//A1C Past N Months
	QUnit.test("A1C Past N Months", function (assert) {
		assert.ok(
							 //current date, measured date (4 months difference)
			A1CPastNMonths.rule("Oct 21, 2014", "July 21, 2014") === true,
			"Up-to-date Passed!")
		assert.ok(
							 //current date, measured date (4 months difference)
			A1CPastNMonths.rule("Oct 21, 2014", "Feb 21, 2014") === false,
			"Out-of-date Passed!")
		assert.ok(
							 //current date, measured date (4 months difference)
			A1CPastNMonths.rule("Oct 21, 2014", "") === false,
			"No date Passed!")
	});


	//A1C <= X in past N months
	QUnit.test("A1C lte X Past N Months", function (assert) {
		assert.ok(
									 //current date, measured date
			A1CLTEXPastNMonths.rule("Oct 21, 2014", "July 21, 2014", "0.07") === true,
			"Up-to-date, Good A1C")
		assert.ok(
			A1CLTEXPastNMonths.rule("Oct 21, 2014", "July 21, 2014", "0.08") === true,
			"Up-to-date, borderline A1C")
		assert.ok(
			A1CLTEXPastNMonths.rule("Oct 21, 2014", "July 21, 2014", "0.085") === false,
			"Up-to-date, Bad A1C")
		assert.ok(
			A1CLTEXPastNMonths.rule("Oct 21, 2014", "Feb 21, 2014", "0.07") === false,
			"Out-of-date, Good A1C")
		assert.ok(
			A1CLTEXPastNMonths.rule("Oct 21, 2014", "Feb 21, 2014", "0.085") === false,
			"Out-of-date, Bad A1C")
		assert.ok(
							 		//current date, measured date
			A1CLTEXPastNMonths.rule("Oct 21, 2014", "", "0.07") === false,
			"No Date, Good A1C")
		assert.ok(
							 		//current date, measured date
			A1CLTEXPastNMonths.rule("Oct 21, 2014", "", "0.085") === false,
			"No Date, Bad A1C")
	});

	//LDL Past N Months
	QUnit.test("LDL Past N Months", function (assert) {
		assert.ok(
							 	//current date, measured date
			LDLPastNMonths.rule("Oct 21, 2014", "Nov 21, 2014") === true,
			"Up-to-date")
		assert.ok(
			LDLPastNMonths.rule("Oct 21, 2014", "Oct 21, 2014") === true,
			"Same Date")
		assert.ok(
			LDLPastNMonths.rule("Oct 21, 2014", "Sep 21, 2013") === false,
			"Out-of-date")
		assert.ok(
			LDLPastNMonths.rule("Oct 21, 2014", "") === false,
			"No date")
	});


	/*
	Hypertension Tests
		[0]ruleBaselineBP
		[1]ruleElevatedBPRegularVisit
		[2]ruleHypertensionBP
	*/

	var hypertension = m.ruleList[1]["rules"];

	var BaselineBP = hypertension[0];
	var ElevatedBPRegularVisit = hypertension[1];
	var HypertensionBP = hypertension[2];

	QUnit.test("BP Past 12 Months for >40", function (assert) {
		assert.ok(
								//current date, measured date (12 months difference), age
			BaselineBP.rule("Oct 21, 2014", "Oct 21, 2013", 40) === true,
			"BP recent passed!");
		assert.ok(
								//12 months +1 day difference
			BaselineBP.rule("Oct 21, 2014", "Oct 20, 2013", 40) === false,
			"BP not recent passed!");
		assert.ok(
								//age out of range
			isNaN(BaselineBP.rule("Oct 21, 2014", "Oct 21, 2013", 39)),
			"Age out of range passed!");
	});

	QUnit.test("HT and BP>140/90 visit past 9 months", function (assert) {
		assert.ok(
								//current date, last seen date, sys, dias, icd9
			ElevatedBPRegularVisit.rule("Oct 21, 2014", "Jan 21, 2014", "140", "90", "401") === true,
			"Recent visit passed!");
		assert.ok(
								//Not recent visit
			ElevatedBPRegularVisit.rule("Oct 21, 2014", "Jan 20, 2014", "140", "90", "401") === false,
			"Not recent visit passed!");
		assert.ok(
								//Low sys, high dias
			ElevatedBPRegularVisit.rule("Oct 21, 2014", "Jan 21, 2014", "139", "90", "401") === true,
			"Low systolic passed!");
		assert.ok(
								//High sys, low dias
			ElevatedBPRegularVisit.rule("Oct 21, 2014", "Jan 21, 2014", "140", "89", "401") === true,
			"Low diastolic passed!");
		assert.ok(
								//Both low
			isNaN(ElevatedBPRegularVisit.rule("Oct 21, 2014", "Jan 21, 2014", "139", "89", "401")),
			"Both low passed!");
		assert.ok(
								//Not hypertension
			isNaN(ElevatedBPRegularVisit.rule("Oct 21, 2014", "Jan 21, 2014", "140", "90", "123")),
			"Not hypertension passed!");
	});

	QUnit.test("HT with BP<140/90", function (assert) {
		assert.ok(
								//sys, dias, icd9
			HypertensionBP.rule("140", "90", "401") === false,
			"Both high passed!");
		assert.ok(
								//Both low
			HypertensionBP.rule("139", "89", "401") === true,
			"Both low passed!");
		assert.ok(
								//Sys low
			HypertensionBP.rule("139", "90", "401") === false,
			"Sys low passed!");
		assert.ok(
								//Dias low
			HypertensionBP.rule("140", "89", "401") === false,
			"Dias low passed!");
		assert.ok(
								//Not HT
			isNaN(HypertensionBP.rule("139", "89", "123")),
			"Not HT passed!");
	});


	/*
	Cancer Screening Tests
		[0] ruleBreastCancer
		[1]	ruleCervicalCancer
		[2]	ruleColorectalCancer
		[3]	ruleFluVaccine
	*/

	var cancer = m.ruleList[6]["rules"];

	var BreastCancer = cancer[0];
	var CervicalCancer = cancer[1];
	var ColorectalCancer = cancer[2];
	var FluVaccine = cancer[3];

	QUnit.test("Up-to-date breast cancer screening", function (assert) {
		assert.ok(
							//current date, age, sex, mammogram date (36 months difference)
			BreastCancer.rule("Oct 21, 2014", 50, "F", "Oct 21, 2011") === true,
			"Up-to-date passed!");
		assert.ok(
							//(36 months +1 day difference)
			BreastCancer.rule("Oct 21, 2014", 50, "F", "Oct 20, 2011") === false,
			"Out-of-date passed!");
		assert.ok(
							//non-female
			isNaN(BreastCancer.rule("Oct 21, 2014", 69, "M", "Oct 21, 2011")),
			"Non-female passed!");
		assert.ok(
							//age in range
			BreastCancer.rule("Oct 21, 2014", BreastCancer.minAge, "F", "Oct 21, 2011"),
			"Age in range passed!");
		assert.ok(
							//age out of range
			isNaN(BreastCancer.rule("Oct 21, 2014", BreastCancer.maxAge+1, "F", "Oct 21, 2011")),
			"Age out of range passed!");
	});

	QUnit.test("Up-to-date cervical cancer screening", function (assert) {
		assert.ok(
							//current date, age, sex, pap date (36 months)
			CervicalCancer.rule("Oct 21, 2014", 25, "F", "Oct 21, 2011") === true,
			"Up-to-date passed!");
		assert.ok(
							//(36 months +1 day difference)
			CervicalCancer.rule("Oct 21, 2014", 69, "F", "Oct 20, 2011") === false,
			"Out-of-date passed!");
		assert.ok(
							//non-female
			isNaN(CervicalCancer.rule("Oct 21, 2014", 69, "M", "Oct 21, 2011")),
			"Non-female passed!");
		assert.ok(
							//age in range
			CervicalCancer.rule("Oct 21, 2014", CervicalCancer.minAge, "F", "Oct 21, 2011"),
			"Age in range passed!");
		assert.ok(
							//age out of range
			isNaN(CervicalCancer.rule("Oct 21, 2014", CervicalCancer.maxAge+1, "F", "Oct 21, 2011")),
			"Age out of range passed!");
	});


	QUnit.test("Up-to-date colorectal cancer screening", function (assert) {
		assert.ok(
							//current date, age, fobt date (24 months difference)
			ColorectalCancer.rule("Oct 21, 2014", 50, "Oct 21, 2012") === true,
			"Up-to-date passed!");
		assert.ok(
							//24 months +1 day difference
			ColorectalCancer.rule("Oct 21, 2014", 100, "Oct 20, 2012") === false,
			"Out-of-date passed!");
		assert.ok(
							//age too low
			isNaN(ColorectalCancer.rule("Oct 21, 2014", 49, "Oct 21, 2012")),
			"Age out of range passed!");
	});


	QUnit.test("Up-to-date influenza vaccine", function (assert) {
		assert.ok(
							//current date, age, flu date (12 months difference)
			FluVaccine.rule("Oct 21, 2014", 65, "Oct 21, 2013") === true,
			"Up-to-date passed!");
		assert.ok(
							//12 months +1 day difference
			FluVaccine.rule("Oct 15, 2014", 65, "Sep 30, 2013") === false,
			"Out-of-date passed!");
		assert.ok(
							//age too low
			isNaN(FluVaccine.rule("Oct 21, 2014", 64, "Oct 21, 2013")),
			"Age out of range passed!");
	});

})();

