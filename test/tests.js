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

