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

})();

