(function() {

	var m = mdsIndicators;

	var oscarDefault = mdsViewer.getEMR()["Oscar"];


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
	Lung Health Tests
	*/

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
		mdsViewer.getEMR()["Oscar"] = true;
		assert.ok(
			SmokingStatusRecorded.rule("anything, already filtered", "12") === true,
			"Oscar status passed");
		assert.ok(
			SmokingStatusRecorded.rule("", "12") === false,
			"Oscar no status passed");
		mdsViewer.getEMR()["Oscar"] = oscarDefault;
	});

	QUnit.test("Smoking Cessation Attempted", function (assert) {
		assert.ok(
										//factors, cessation date, last seen date, report date
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
									  //age, factors, # pneuc vaccinations
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


	/* Immunization Tests */
	var immu = m.ruleList[2]["rules"];

	var HeightWeightLastVaccination = immu[0],
		InfantVaccinations = immu[1],
		ChildVaccinations = immu[2],
		TeenagerVaccinations = immu[3];

	QUnit.test("Height & Weight Last Immunization", function (assert) {
		assert.ok(
											//height date, weight date, current date							
			HeightWeightLastVaccination.rule("Oct 21, 2013", "Oct 21, 2013", "Oct 21, 2014",
											//"measles date", "diphtheria date", "varicella date", "rotavirus date", "polio date",
											 "Oct 21, 2011", "Oct 21, 2011", "Oct 21, 2011", "Oct 21, 2011", "Oct 21, 2011",
											 //"pneumococcal conjugate date", "meningococcal conjugate date", "haemophilus b conjugate date"
											 "Oct 21, 2013", "Oct 21, 2011", "Oct 21, 2011") === true,
			"Up-to-date passed!");
		assert.ok(
			HeightWeightLastVaccination.rule("Oct 20, 2013", "Oct 20, 2013", "Oct 22, 2013",
											 "Oct 21, 2011", "Oct 21, 2011", "Oct 21, 2011", "Oct 21, 2011", "Oct 21, 2011",
											 "Oct 21, 2013", "Oct 21, 2011", "Oct 21, 2011") === false,
			"Height/weight older than vaccinations passed!");
		assert.ok(
			isNaN(HeightWeightLastVaccination.rule("Oct 21, 2013", "Oct 22, 2013", "Oct 22, 2013",
											 "Oct 21, 2011", "Oct 21, 2011", "Oct 21, 2011", "Oct 21, 2011", "Oct 21, 2011",
											 "Oct 21, 2013", "Oct 21, 2011", "Oct 21, 2011")),
			"Height/weight different dates passed!");
		assert.ok(
			HeightWeightLastVaccination.rule("Oct 21, 2013", "Oct 21, 2013", "Oct 22, 2013",
											 "Oct 21, 2011", "", "Oct 21, 2011", "", "Oct 21, 2011",
											 "Oct 21, 2013", "Oct 21, 2011", "") === true,
			"Height/weight w/ missing immus passed!");
		assert.ok(
			HeightWeightLastVaccination.rule("Oct 21, 2013", "Oct 21, 2013", "Oct 22, 2013",
											 "", "", "", "", "",
											 "", "", "") === true,
			"Height/weight w/ no immus passed!");

		assert.ok(
			isNaN(HeightWeightLastVaccination.rule("Oct 20, 2013", "Oct 21, 2013", "Oct 22, 2013",
											 "", "", "", "", "",
											 "", "", "")),
			"Height/weight diff dates w/ no immus passed!");
		assert.ok(
			HeightWeightLastVaccination.rule("Oct 20, 2012", "Oct 20, 2012", "Oct 22, 2013",
											 "", "", "", "", "",
											 "", "", "") === false,
			"Height/weight out-of-date w/ no immus passed!");
		assert.ok(
			isNaN(HeightWeightLastVaccination.rule("", "", "Oct 21, 2014",
											//"measles date", "diphtheria date", "varicella date", "rotavirus date", "polio date",
											 "Oct 21, 2011", "Oct 21, 2011", "Oct 21, 2011", "Oct 21, 2011", "Oct 21, 2011",
											 //"pneumococcal conjugate date", "meningococcal conjugate date", "haemophilus b conjugate date"
											 "Oct 21, 2013", "Oct 21, 2011", "Oct 21, 2011")),
			"No height/weight passed!");
			
	});


	QUnit.test("Infant Immunizations", function (assert) {
		assert.ok(
											//"Age", "measles", "diphtheria",
		      								//"varicella", "rotavirus", "polio"						
			InfantVaccinations.rule("2", "1", "4", "1", "2", "4") === true,
			"Up-to-date age 2 passed!");
		assert.ok(				
			InfantVaccinations.rule("3", "1", "4", "1", "2", "4") === true,
			"Up-to-date age 3 passed!");
		assert.ok(				
			isNaN(InfantVaccinations.rule("1", "1", "4", "1", "2", "4")),
			"Up-to-date age 1 passed!");
		assert.ok(				
			isNaN(InfantVaccinations.rule("4", "1", "4", "1", "2", "4")),
			"Up-to-date age 4 passed!");
		assert.ok(				
			InfantVaccinations.rule("2", "1", "3", "1", "2", "4") === false,
			"Out-of-date passed!");
		assert.ok(				
			InfantVaccinations.rule("2", "", "", "1", "2", "4") === false,
			"Out-of-date passed!");
	});

	QUnit.test("Child Immunizations", function (assert) {
		assert.ok(
											//"Age", "measles", "diphtheria",
		      								//"varicella", "polio", "hib", "pneuc", "mencc"					
			ChildVaccinations.rule("7", "2", "5", "2", "5") === true,
			"Up-to-date age 7 passed!");
		assert.ok(				
			ChildVaccinations.rule("13", "2", "5", "2", "5") === true,
			"Up-to-date age 13 passed!");
		assert.ok(				
			isNaN(ChildVaccinations.rule("6", "2", "5", "2", "5")),
			"Up-to-date age 6 passed!");
		assert.ok(				
			isNaN(ChildVaccinations.rule("14", "2", "5", "2", "5")),
			"Up-to-date age 14 passed!");
		assert.ok(				
			ChildVaccinations.rule("7", "1", "5", "2", "5") === false,
			"Out-of-date passed!");
		assert.ok(				
			ChildVaccinations.rule("7", "", "", "2", "5") === false,
			"Out-of-date passed!");
	});

	QUnit.test("Teen Immunizations", function (assert) {
		assert.ok(
											//"Age", "measles", "diphtheria",
		      								//"varicella", "polio", "hib", "pneuc", "mencc"					
			TeenagerVaccinations.rule("18", "2", "6", "2", "5") === true,
			"Up-to-date age 18 passed!");
		assert.ok(				
			TeenagerVaccinations.rule("25", "22", "6", "2", "5") === true,
			"Up-to-date age 25 passed!");
		assert.ok(				
			isNaN(TeenagerVaccinations.rule("17", "22", "6", "2", "5")),
			"Up-to-date age 17 passed!");
		assert.ok(				
			isNaN(TeenagerVaccinations.rule("26", "22", "6", "2", "5")),
			"Up-to-date age 26 passed!");
		assert.ok(				
			TeenagerVaccinations.rule("19", "1", "6", "2", "5") === false,
			"Out-of-date passed!");
		assert.ok(				
			TeenagerVaccinations.rule("19", "2", "6", "", "") === false,
			"Missing vaccinations passed!");
	});



	/* Depression 
		PHQ-9
	*/

	var depression = m.ruleList[5]["rules"];

	var PHQ9 = depression[0];

	QUnit.test("PHQ-9", function (assert) {
		assert.ok(
					  //current date, screen date, count
			PHQ9.rule("Oct 21, 2014", "Sept 21, 2014", "2") === true,
			"Up-to-date passed!");
		assert.ok(
					  //current date, screen date, count
			PHQ9.rule("Oct 21, 2014", "Sept 21, 2014", "1") === true,
			"Up-to-date (only 1) passed!");
		assert.ok(
			isNaN(PHQ9.rule("Oct 21, 2014", "", "")),
			"Never done passed!");
		assert.ok(
			PHQ9.rule("Oct 21, 2014", "Mar 21, 2014", "1") === false,
			"No follow-up passed!");
		assert.ok(
			PHQ9.rule("Oct 21, 2014", "Mar 21, 2014", "2") === true,
			"Follow-up passed!");
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

	QUnit.test("Breast cancer screening", function (assert) {
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

	QUnit.test("Cervical cancer screening", function (assert) {
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


	QUnit.test("Colorectal cancer screening", function (assert) {
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


	QUnit.test("Influenza vaccine", function (assert) {
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


	var WellBaby = m.ruleList[7]["rules"][0];

	QUnit.test("Well Baby Exam", function (assert) {
		assert.ok(
						  //age, A002, Rourke
			WellBaby.rule("2", "Oct 21, 2014", "Oct 20, 2014"), 
			"Up-to-date passed!");
		assert.ok(
			WellBaby.rule("3", "Oct 21, 2014", "Oct 20, 2014"), 
			"Up-to-date passed!");
		assert.ok(
			isNaN(WellBaby.rule("4", "Oct 21, 2014", "Oct 20, 2014")), 
			"Out of age-range passed!");
		assert.ok(
			isNaN(WellBaby.rule("1", "Oct 21, 2014", "Oct 20, 2014")), 
			"Out of age-range passed!");
	});

})();

