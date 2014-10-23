(function() {

	var m = mdsIndicators;


	/*
		Diabetes Tests
	*/
	var diabetes = m.ruleList[0]["rules"];

	DMPastNMonths = diabetes[0];
	A1CPastNMonths = diabetes[1];
	A1CLTEXPastNMonths = diabetes[2];
	LDLPastNMonths = diabetes[3];

	// DM Past N Months
	QUnit.test("DM Past N Months", function (assert) {
		assert.ok(
							//current date, measured date
			DMPastNMonths.rule("Oct 21, 2014", "Sept 21, 2014") === true,
			"Up-to-date passed");
		assert.ok(
			DMPastNMonths.rule("Oct 21, 2014", "Sept 21, 2013") === false,
			"Out-of-date passed");
		assert.ok(
			DMPastNMonths.rule("Oct 21, 2014", "") === false,
			"No Date passed");
		assert.ok(
			isNaN(DMPastNMonths.rule("Oct 21, 2014", "Nov 21, 2014")),
			"Future date passed");
		assert.ok(
			DMPastNMonths.rule("2014/10/21", "Sept 21, 2014") === true,
			"YYYY/MM/DD up-to-date passed");
		assert.ok(
			DMPastNMonths.rule("2014/10/21", "Sept 21, 2013") === false,
			"YYYY/MM/DD out-of-date passed");
		assert.ok(
			DMPastNMonths.rule("Oct 21, 2014", "6") === true,
			"Up-to-date (compat) passed");
		assert.ok(
			DMPastNMonths.rule("Oct 21, 2014", "13") === false,
			"Out-of-date (compat) passed");
	});

	//A1C Past N Months
	QUnit.test("A1C Past N Months", function (assert) {
		assert.ok(
							 //current date, measured date (4 months difference)
			A1CPastNMonths.rule("Oct 21, 2014", "July 21, 2014") === true,
			"Up-to-date Passed!");
		assert.ok(
			A1CPastNMonths.rule("Oct 21, 2014", "Feb 21, 2014") === false,
			"Out-of-date Passed!");
		assert.ok(
			A1CPastNMonths.rule("Oct 21, 2014", "") === false,
			"No date Passed!");
	});


	//A1C <= X in past N months
	QUnit.test("A1C lte X Past N Months", function (assert) {
		assert.ok(
									 //current date, measured date
			A1CLTEXPastNMonths.rule("Oct 21, 2014", "July 21, 2014", "0.07") === true,
			"Up-to-date, Good A1C");
		assert.ok(
			A1CLTEXPastNMonths.rule("Oct 21, 2014", "July 21, 2014", "0.08") === true,
			"Up-to-date, borderline A1C");
		assert.ok(
			A1CLTEXPastNMonths.rule("Oct 21, 2014", "July 21, 2014", "0.085") === false,
			"Up-to-date, Bad A1C");
		assert.ok(
			A1CLTEXPastNMonths.rule("Oct 21, 2014", "Feb 21, 2014", "0.07") === false,
			"Out-of-date, Good A1C");
		assert.ok(
			A1CLTEXPastNMonths.rule("Oct 21, 2014", "Feb 21, 2014", "0.085") === false,
			"Out-of-date, Bad A1C");
		assert.ok(
							 		//current date, measured date
			A1CLTEXPastNMonths.rule("Oct 21, 2014", "", "0.07") === false,
			"No Date, Good A1C");
		assert.ok(
							 		//current date, measured date
			A1CLTEXPastNMonths.rule("Oct 21, 2014", "", "0.085") === false,
			"No Date, Bad A1C");
	});

	//LDL Past N Months
	QUnit.test("LDL Past N Months", function (assert) {
		assert.ok(
							 	//current date, measured date
			LDLPastNMonths.rule("Oct 21, 2014", "Nov 21, 2014") === true,
			"Up-to-date");
		assert.ok(
			LDLPastNMonths.rule("Oct 21, 2014", "Oct 21, 2014") === true,
			"Same Date");
		assert.ok(
			LDLPastNMonths.rule("Oct 21, 2014", "Sep 21, 2013") === false,
			"Out-of-date");
		assert.ok(
			LDLPastNMonths.rule("Oct 21, 2014", "") === false,
			"No date");
	});



	var lung = m.ruleList[3]["rules"];

	var SmokingStatusRecorded = lung[0];
	var SmokingCessation = lung[1]
	var AdultSmokersPneumovax = lung[2];
	var SeniorsPneumovax = lung[3];
	var LungDiseasePneumovax = lung[4];
	var LungHealthScreen = lung[5];

	QUnit.test("Smoking Status Recorded", function (assert) {
		assert.ok(
			SmokingStatusRecorded.rule("Current Smoker", "40") === true,
			"Adult current smoker");
		assert.ok(
			SmokingStatusRecorded.rule("Ex-Smoker", "40") === true,
			"Adult ex smoker");
		assert.ok(
			SmokingStatusRecorded.rule("Never Smoked", "40") === true,
			"Adult never smoker");
		assert.ok(
			SmokingStatusRecorded.rule("", "40") === false,
			"Adult no smoking status");
		assert.ok(
			isNaN(SmokingStatusRecorded.rule("", "10")),
			"Child no smoking status");
	});

	QUnit.test("Smoking Cessation Attempted", function (assert) {
		assert.ok(
										//factors, 		 cessation date, last seen date, report date
			SmokingCessation.rule("Current Smoker", "Aug 21, 2014", "Aug 21, 2014", "Oct 21, 2014") === true,
			"Current smoker, recent smoking cessation");
		assert.ok(
			isNaN(SmokingCessation.rule("Ex-Smoker", "Aug 21, 2014", "Aug 21, 2014", "Oct 21, 2014")),
			"Ex smoker");
		assert.ok(
			isNaN(SmokingCessation.rule("Never Smoked", "Aug 21, 2014", "Aug 21, 2014", "Oct 21, 2014")),
			"Never smoker");
		assert.ok(
			SmokingCessation.rule("Current Smoker", "", "Aug 21, 2014", "Oct 21, 2014") === false,
			"Current smoker, never smoking cessation");
		assert.ok(
			SmokingCessation.rule("Current Smoker", "Aug 21, 2012", "Aug 21, 2014", "Oct 21, 2014") === false,
			"Current smoker, out-dated smoking cessation");
		assert.ok(
			isNaN(SmokingCessation.rule("Current Smoker", "Aug 21, 2012", "Aug 21, 2012", "Oct 21, 2014")),
			"Current smoker, not seen recently");
	});

	QUnit.test("Adult Smokers Pneumovax", function (assert) {
		assert.ok(
									  //age, factors, 		# pneuc vaccinations
			AdultSmokersPneumovax.rule("19", "Current Smoker", "1") === true,
			"Adult current smoker Pneumovax");
		assert.ok(
			isNaN(AdultSmokersPneumovax.rule("18", "Current Smoker", "0")),
			"Youth current smoker");
		assert.ok(
			isNaN(AdultSmokersPneumovax.rule("19", "never smoked", "0")),
			"Adult never smoker");
		assert.ok(
			isNaN(AdultSmokersPneumovax.rule("41", "ex-smoker", "1")),
			"Adult ex-smoker");
		assert.ok(
			AdultSmokersPneumovax.rule("19", "Current Smoker", "0") === false,
			"Adult current smoker, no pneumovax");
	});

	QUnit.test("Senior Pneumovax", function (assert) {
		assert.ok(
								  //age,  # pneuc vaccinations
			SeniorsPneumovax.rule("66", "1") === true,
			"Senior Pneumovax");
		assert.ok(
			SeniorsPneumovax.rule("66", "0") === false,
			"Senior no pneumovax");
		assert.ok(
			isNaN(SeniorsPneumovax.rule("65", "0")),
			"Not senior");
	});

	QUnit.test("Lung Disease Pneumovax", function (assert) {
		assert.ok(
								 // "Age", "Problem List", "pneumococcal polysaccharide"
			LungDiseasePneumovax.rule("66", "COPD", "1") === true,
			"Adult COPD Pneumovax");
		assert.ok(
			LungDiseasePneumovax.rule("66", "493", "1") === true,
			"Adult ICD-9 493 Pneumovax");
		assert.ok(
			LungDiseasePneumovax.rule("66", "asthma", "1") === true,
			"Adult asthma Pneumovax");
		assert.ok(
			isNaN(LungDiseasePneumovax.rule("66", "chronic congestion", "1")),
			"Adult no lung disease Pneumovax");
		assert.ok(
			isNaN(LungDiseasePneumovax.rule("19", "", "0")),
			"Adult no problem list no pneumovax");
		assert.ok(
			isNaN(LungDiseasePneumovax.rule("18", "COPD", "1")),
			"Youth COPD");
		assert.ok(
			LungDiseasePneumovax.rule("66", "COPD", "0") === false,
			"Adult COPD no pneumovax");
	});


	QUnit.test("Lung Health Screening", function (assert) {
		assert.ok(
									 //"Risk Factors", "Problem List", "COPD Screen Date", "Current Date", "Age"
			LungHealthScreen.rule("Current Smoker", "",				"Aug 21, 2014", 	  "Oct 21, 2014", "41") === true,
			"Adult no COPD recent screening");
		assert.ok(
			isNaN(LungHealthScreen.rule("Current Smoker", "COPD", "", "Oct 21, 2014", "41")),
			"Adult COPD no screening");
		assert.ok(
			isNaN(LungHealthScreen.rule("Current Smoker", "", "", "Oct 21, 2014", "35")),
			"Youth no screening");
		assert.ok(
			isNaN(LungHealthScreen.rule("ex-smoker", "", "", "Oct 21, 2014", "41")),
			"Ex-smoker no screening");
		assert.ok(
			LungHealthScreen.rule("Current Smoker", "", "Aug 21, 2012", "Oct 21, 2014", "41") === false,
			"Adult no COPD old screening");
	});


	/*
	Cancer Screening Tests
		[0] ruleBreastCancer
		[1]	ruleCervicalCancer
		[2]	ruleColorectalCancer
		[3]	ruleFluVaccine
	*/

	var cancer = m.ruleList[6]["rules"];

	BreastCancer = cancer[0];
	CervicalCancer = cancer[1];
	ColorectalCancer = cancer[2];
	FluVaccine = cancer[3];

	QUnit.test("Up-to-date breast cancer screening", function (assert) {
		assert.ok(
							//current date, age, sex, mammogram date (36 months difference)
			BreastCancer.rule("Oct 21, 2014", 50, "F", "Oct 21, 2011") === true,
			"Passed!");

		assert.ok(
							//(36 months +1 day difference)
			BreastCancer.rule("Oct 21, 2014", 50, "F", "Oct 20, 2011") === false,
			"Passed!");

		assert.ok(
							//non-female
			isNaN(BreastCancer.rule("Oct 21, 2014", 69, "M", "Oct 21, 2011")),
			"Passed!");

		assert.ok(
							//age in range
			BreastCancer.rule("Oct 21, 2014", BreastCancer.minAge, "F", "Oct 21, 2011"),
			"Passed!");

		assert.ok(
							//age out of range
			isNaN(BreastCancer.rule("Oct 21, 2014", BreastCancer.maxAge+1, "F", "Oct 21, 2011")),
			"Passed!");
	});

	QUnit.test("Up-to-date cervical cancer screening", function (assert) {
		assert.ok(
							//current date, age, sex, pap date (36 months)
			CervicalCancer.rule("Oct 21, 2014", 25, "F", "Oct 21, 2011") === true,
			"Passed!");

		assert.ok(
							//(36 months +1 day difference)
			CervicalCancer.rule("Oct 21, 2014", 69, "F", "Oct 20, 2011") === false,
			"Passed!");

		assert.ok(
							//non-female
			isNaN(CervicalCancer.rule("Oct 21, 2014", 69, "M", "Oct 21, 2011")),
			"Passed!");

		assert.ok(
							//age in range
			CervicalCancer.rule("Oct 21, 2014", CervicalCancer.minAge, "F", "Oct 21, 2011"),
			"Passed!");

		assert.ok(
							//age out of range
			isNaN(CervicalCancer.rule("Oct 21, 2014", CervicalCancer.maxAge+1, "F", "Oct 21, 2011")),
			"Passed!");
	});


	QUnit.test("Up-to-date colorectal cancer screening", function (assert) {
		assert.ok(
							//current date, age, fobt date (24 months difference)
			ColorectalCancer.rule("Oct 21, 2014", 50, "Oct 21, 2012") === true,
			"Passed!");

		assert.ok(
							//24 months +1 day difference
			ColorectalCancer.rule("Oct 21, 2014", 100, "Oct 20, 2012") === false,
			"Passed!");

		assert.ok(
							//age too low
			isNaN(ColorectalCancer.rule("Oct 21, 2014", 49, "Oct 21, 2012")),
			"Passed!");
	});


	QUnit.test("Up-to-date influenza vaccine", function (assert) {
		assert.ok(
							//current date, age, flu date (12 months difference)
			FluVaccine.rule("Oct 21, 2014", 65, "Oct 21, 2013") === true,
			"Passed!");

		assert.ok(
							//12 months +1 day difference
			FluVaccine.rule("Oct 15, 2014", 65, "Sep 30, 2013") === false,
			"Passed!");

		assert.ok(
							//age too low
			isNaN(FluVaccine.rule("Oct 21, 2014", 64, "Oct 21, 2013")),
			"Passed!");
	});

})();

