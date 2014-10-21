(function() {

	var m = mdsIndicators;


	/*
		Diabetes Tests
			[0] DM Past N Months
			[1] A1C Past N Months
			[2] A1C <= X Past N Months
			[3] LDL Past N Months

	*/
	var diabetes = m.ruleList[0]["rules"];

	DMPastNMonths = diabetes[0];
	A1CPastNMonths = diabetes[1];
	A1CLTEXPastNMonths = diabetes[2];
	LDLPastNMonths = diabetes[3];

	// DM Past N Months


	//Within past 12 months
	QUnit.test("DM Past N Months -- Up-to-date", function (assert) {
		assert.ok(
							//current date, measured date
			DMPastNMonths.rule("Oct 21, 2014", "Sept 21, 2014") === true,
			"Passed!")
	});

	//Older than 12 months
	QUnit.test("DM Past N Months -- Out-of-date", function (assert) {
		assert.ok(
							//current date, measured date
			DMPastNMonths.rule("Oct 21, 2014", "Sept 21, 2013") === false,
			"Passed!")
	});

	//No measured date
	QUnit.test("DM Past N Months -- No Date", function (assert) {
		assert.ok(
							//current date, measured date
			DMPastNMonths.rule("Oct 21, 2014", "") === false,
			"Passed!")
	});

	QUnit.test("DM Past N Months -- Future Date", function (assert) {
		assert.ok(
									//current date, measured date
			isNaN(DMPastNMonths.rule("Oct 21, 2014", "Nov 21, 2014")),
			"Passed!")
	});

	//Compatibility with previous version (used # of months instead of date)
	//Within 12 months
	QUnit.test("DM Past N Months -- Compat -- Up-to-date", function (assert) {
		assert.ok(
							//current date, measured date
			DMPastNMonths.rule("Oct 21, 2014", "6") === true,
			"Passed!")
	});

	//Older than 12 months
	QUnit.test("DM Past N Months -- Compat -- Out-of-date", function (assert) {
		assert.ok(
							//current date, measured date
			DMPastNMonths.rule("Oct 21, 2014", "13") === false,
			"Passed!")
	});


	//A1C Past N Months

	//Within past 4 months
	QUnit.test("A1C Past N Months -- Up-to-date", function (assert) {
		assert.ok(
							 //current date, measured date (4 months difference)
			A1CPastNMonths.rule("Oct 21, 2014", "July 21, 2014") === true,
			"Passed!")
	});

	//Within past 8 months
	QUnit.test("A1C Past N Months -- Out-of-date", function (assert) {
		assert.ok(
							 //current date, measured date (4 months difference)
			A1CPastNMonths.rule("Oct 21, 2014", "Feb 21, 2014") === false,
			"Passed!")
	});

	//No date
	QUnit.test("A1C Past N Months -- No Date", function (assert) {
		assert.ok(
							 //current date, measured date (4 months difference)
			A1CPastNMonths.rule("Oct 21, 2014", "") === false,
			"Passed!")
	});


	//A1C <= X in past N months
	QUnit.test("A1C lte X Past N Months -- Up-to-date, Good A1C", function (assert) {
		assert.ok(
							 //current date, measured date (4 months difference)
			A1CLTEXPastNMonths.rule("Oct 21, 2014", "July 21, 2014", "0.07") === true,
			"Passed!")
	});

	QUnit.test("A1C lte X Past N Months -- Up-to-date, Good A1C", function (assert) {
		assert.ok(
							 //current date, measured date (4 months difference)
			A1CLTEXPastNMonths.rule("Oct 21, 2014", "July 21, 2014", "0.08") === true,
			"Passed!")
	});

	QUnit.test("A1C lte X Past N Months -- Up-to-date, Bad A1C", function (assert) {
		assert.ok(
							 //current date, measured date (4 months difference)
			A1CLTEXPastNMonths.rule("Oct 21, 2014", "July 21, 2014", "0.085") === false,
			"Passed!")
	});


	QUnit.test("A1C lte X Past N Months -- Out-of-date, Good A1C", function (assert) {
		assert.ok(
							 //current date, measured date (8 months difference)
			A1CLTEXPastNMonths.rule("Oct 21, 2014", "Feb 21, 2014", "0.07") === false,
			"Passed!")
	});

	QUnit.test("A1C lte X Past N Months -- Out-of-date, Bad A1C", function (assert) {
		assert.ok(
							 //current date, measured date (8 months difference)
			A1CLTEXPastNMonths.rule("Oct 21, 2014", "Feb 21, 2014", "0.085") === false,
			"Passed!")
	});

	QUnit.test("A1C lte X Past N Months -- No Date, Good A1C", function (assert) {
		assert.ok(
							 //current date, measured date
			A1CLTEXPastNMonths.rule("Oct 21, 2014", "", "0.07") === false,
			"Passed!")
	});

	QUnit.test("A1C lte X Past N Months -- No Date, Bad A1C", function (assert) {
		assert.ok(
							 //current date, measured date
			A1CLTEXPastNMonths.rule("Oct 21, 2014", "", "0.085") === false,
			"Passed!")
	});

	//LDL Past N Months
	QUnit.test("LDL Past N Months -- Up-to-date", function (assert) {
		assert.ok(
							 //current date, measured date (11 months difference)
			LDLPastNMonths.rule("Oct 21, 2014", "Nov 21, 2014") === true,
			"Passed!")
	});

	QUnit.test("LDL Past N Months -- same date", function (assert) {
		assert.ok(
							 //current date, measured date (11 months difference)
			LDLPastNMonths.rule("Oct 21, 2014", "Oct 21, 2014") === true,
			"Passed!")
	});

	QUnit.test("LDL Past N Months -- Out-of-date", function (assert) {
		assert.ok(
							 //current date, measured date (13 months difference)
			LDLPastNMonths.rule("Oct 21, 2014", "Sep 21, 2013") === false,
			"Passed!")
	});

	QUnit.test("LDL Past N Months -- No date", function (assert) {
		assert.ok(
							 //current date, measured date (13 months difference)
			LDLPastNMonths.rule("Oct 21, 2014", "") === false,
			"Passed!")
	});

})();

