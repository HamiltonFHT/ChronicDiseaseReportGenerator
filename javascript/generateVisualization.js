// **************************************************************************************************************************************************
// Author: Brice Wong
// Copyright 2014 Hamilton Family Health Team
//
// generateVisualization.js
// 
// This document contains the global variables and functions that are associated with generating visualizations in the Report Generator. It takes the
// data from 'arrayCalculatedData' and uses the d3.js Javascript library to generate SVG shapes with varying attributes. 
//
// **************************************************************************************************************************************************

var DEFAULT_CANVAS_WIDTH = 960,					// pixels
	DEFAULT_CANVAS_HEIGHT = 480;				// pixels


var DEFAULT_PADDING_LEFT_SNAPSHOT_MODE = 300,
	DEFAULT_PADDING_TOP_SNAPSHOT_MODE = 50,

	DEFAULT_GRAPH_WIDTH_SNAPSHOT_MODE = DEFAULT_CANVAS_WIDTH - DEFAULT_PADDING_LEFT_SNAPSHOT_MODE - 25,
	DEFAULT_GRAPH_HEIGHT_SNAPSHOT_MODE = DEFAULT_CANVAS_HEIGHT - 2 * DEFAULT_PADDING_TOP_SNAPSHOT_MODE,
	
	DEFAULT_PADDING_LEFT_TRACKING_MODE = 75,
	DEFAULT_PADDING_TOP_TRACKING_MODE = 50,
	
	DEFAULT_GRAPH_WIDTH_TRACKING_MODE = DEFAULT_CANVAS_WIDTH - 2 * DEFAULT_PADDING_LEFT_TRACKING_MODE,
	DEFAULT_GRAPH_HEIGHT_TRACKING_MODE = DEFAULT_CANVAS_HEIGHT - 2 * DEFAULT_PADDING_TOP_TRACKING_MODE;
	

//var showDataLabels = true;

function clearCanvas(canvas_choice, mode) {

	//canvasSVG not always in existance
	
	canvas_element = document.getElementById(canvas_choice);
	
	try {
		canvas_element.removeChild(document.getElementById("canvasSVG"));
	} catch (err) {
		console.log(err);
	}
	
	
	
	console.log("Canvas: ", canvas_choice);
	
	//console.log("Number of children: " + canvas_element.childElementCount);
	
	if (canvas_element.childElementCount == 0) {

		d3.select("#".concat(canvas_choice)).append("svg")
			.attr("id", "canvasSVG")
	
			// Set the width and height of the canvas
			.attr("width", DEFAULT_CANVAS_WIDTH)
			.attr("height", DEFAULT_CANVAS_HEIGHT)
			.style("border", "1px solid lightgray")
			.append("g")
			.attr("transform", function() {
				switch (mode) {
					
				case "snapshot":
					return "translate(" + DEFAULT_PADDING_LEFT_SNAPSHOT_MODE + ", " + DEFAULT_PADDING_TOP_SNAPSHOT_MODE + ")";
				break;
					
				case "tracking":
					return "translate(" + DEFAULT_PADDING_LEFT_TRACKING_MODE + ", " + DEFAULT_PADDING_TOP_TRACKING_MODE + ")";
				break;
				}	
			});
	}
}


Array.prototype.allIndicesOf = function(ele) {
	var indices = [];
	var idx = this.indexOf(ele);
	while (idx != -1) {
    	indices.push(idx);
    	idx = this.indexOf(ele, idx + 1);
	}
	return indices;
};



function generateVisualizationSnapshotMode(canvas_choice) {
	
	console.log("Generating visualization for Snapshot Mode...");

	var cSVG = d3.select("#".concat(canvas_choice)).select("#canvasSVG");

	
	var xScale = d3.scale.linear()
		.domain([0, 100])
		.range([0, DEFAULT_GRAPH_WIDTH_SNAPSHOT_MODE]);
		
	var xAxis = d3.svg.axis()
		.scale(xScale)
		.orient("bottom")
		.tickFormat(function(d) { return d + "%"; });
		
	var yScale = d3.scale.ordinal()
		.domain(arrayCalculatedData[0])
		.rangeRoundBands([0, DEFAULT_GRAPH_HEIGHT_SNAPSHOT_MODE], 0.1);
		
	var yAxis = d3.svg.axis()
		.scale(yScale)
		.orient("left");
		
	cSVG.selectAll(".tickline")
		.data(xScale.ticks(10))
		.enter().append("line")
			.attr("x1", xScale)
			.attr("x2", xScale)
			.attr("y1", 0)
			.attr("y2", DEFAULT_GRAPH_HEIGHT_SNAPSHOT_MODE)
			.style("stroke", "#ccc")
			.style("stroke-width", 1)
			.style("opacity", 0.7);
		
	// Add rectangles for percentage of patients within criteria
	cSVG.selectAll("onTargetBar")
		.data(arrayCalculatedData[1])
		.enter().append("rect")
			.attr("class", "onTargetBar")
			.attr("width", function(d) { return xScale(d); })
			.attr("height", yScale.rangeBand())
			.attr("y", function (d, i) { return yScale(arrayCalculatedData[0][i]); })
			.attr("fill", DEFAULT_COLOURS[0])
			.style("stroke", "black")
			.style("stroke-width", "1px")
			.attr("shape-rendering", "crispEdges");
			
	// Add bars for patients not within criteria
	cSVG.selectAll("offTargetBar")
		.data(arrayCalculatedData[1])
		.enter().append("rect")
			.attr("class", "offTargetBar")
			.attr("width", function(d) { return xScale(100 - d); })
			.attr("height", yScale.rangeBand())
			.attr("x", function(d) { return xScale(d); })
			.attr("y", function(d, i) { return yScale(arrayCalculatedData[0][i]); })
			.attr("fill", "white")
			.style("stroke", "black")
			.style("stroke-width", "1px")
			.attr("shape-rendering", "crispEdges");
	
	cSVG.append("g")
		.attr("transform", "translate(0, " + DEFAULT_GRAPH_HEIGHT_SNAPSHOT_MODE + ")")
		.style("font-family", "Arial")
		.style("font-size", "14px")
		.call(xAxis);
		
	cSVG.append("g")
		.style("font-family", "Arial")
		.style("font-size", "14px")
		.call(yAxis);
	
	// Add styling and attributes for major ticks in axes
	var majorTicks = document.getElementsByClassName("tick major");
	for (var i = 0; i < majorTicks.length; i++) {
		majorTicks[i].childNodes[0].setAttribute("style", "fill:none; stroke:black");
		majorTicks[i].childNodes[0].setAttribute("shape-rendering", "crispEdges");
	}
	
	
	// Add styling and attributes for axes paths
	var paths = document.getElementsByClassName("domain");
	for (var i = 0; i < paths.length; i++) {
		paths[i].setAttribute("style", "fill:none; stroke:black");
		paths[i].setAttribute("shape-rendering", "crispEdges");
	}
	
	cSVG.selectAll("onTargetLabel")
		.data(arrayCalculatedData[1])
		.enter().append("text")
			.attr("class", "dataLabel")
			.attr("x", function(d, i) { return xScale(d / 2); })
			.attr("y", function(d, i) { return yScale(arrayCalculatedData[0][i]) + (yScale.rangeBand()/2); })
			.attr("text-anchor", "middle")
			.style("font-family", "Arial")
			.style("font-size", "13px")
			.attr("dy", ".35em")
			.style("fill", "white")
			.text(function(d) { if (d > 0) return d.toFixed(1) + "%"; else return ""; });
	
	cSVG.selectAll("offTargetLabel")
		.data(arrayCalculatedData[1])
		.enter().append("text")
			.attr("class", "dataLabel")
			.attr("x", function(d) { return xScale((100 - d)/2 + parseFloat(d)); })
			.attr("y", function(d, i) { return yScale(arrayCalculatedData[0][i]) + (yScale.rangeBand()/2); })
			.attr("text-anchor", "middle")
			.attr("dy", ".35em")
			.style("fill", "black")
			.style("font-family", "Arial")
			.style("font-size", "13px")
			.text(function(d) { if (100 - d < 100) return (100 - d).toFixed(1) + "%"; })
			// don't display off target labels
			.attr("display", "none");
	
	// Graph title text
	cSVG.append("text")
		.attr("class", "graphTitle")
		.attr("x", DEFAULT_GRAPH_WIDTH_SNAPSHOT_MODE / 2)
		.attr("y", -DEFAULT_PADDING_TOP_SNAPSHOT_MODE / 2 + 10)
		.attr("text-anchor", "middle")
		.style("font-size", "14px")
		.style("font-weight", "bold")
		.text(function() {
			var title = "Diabetes Report for Doctor";
			var arraySelectedOnly = [];
			//TODO
			var indices = arrayPhysicians[1].allIndicesOf(true);
			for (i=0; i < indices.length; i++) {
				arraySelectedOnly.push(arrayPhysicians[0][indices[i]]);
			}
			
			if (arraySelectedOnly.length > 1) title += "s ";
			else title += " ";
			for (var i = 0; i < arraySelectedOnly.length; i++) {
				if (i == arraySelectedOnly.length - 2)
					title += arraySelectedOnly[i] + " and ";
				else if (i == arraySelectedOnly.length - 1)	
					title += arraySelectedOnly[i];
				else title += arraySelectedOnly[i] + ", ";
			}
			title += " as of " + arrayFilteredData[0][1][DEFAULT_COLUMN_CURRENT_DATE];
			title += " (n = " + (arrayFilteredData[0].length - 1) + ")";
			return title;
		});
		
	// Add x axis label
	cSVG.append("text")
		.attr("class", "xAxisLabel")
		.attr("x", DEFAULT_GRAPH_WIDTH_SNAPSHOT_MODE / 2)
		.attr("y", DEFAULT_GRAPH_HEIGHT_SNAPSHOT_MODE + 40)
		.attr("text-anchor", "middle")
		.style("font-weight", "bold")
		.style("font-size", "14px")
		.style("font-family", "Arial")
		.text("% of Patients");
		
	// Add y axis label
	cSVG.append("text")
		.attr("class", "yAxisLabel")
		.attr("transform", "rotate(-90)")
		.attr("x", -DEFAULT_GRAPH_HEIGHT_SNAPSHOT_MODE / 2)
		.attr("y", -DEFAULT_PADDING_LEFT_SNAPSHOT_MODE / 2 - 125)
		.attr("text-anchor", "middle")
		.style("font-weight", "bold")
		.style("font-size", "14px")
		.style("font-family", "Arial")
		.text("Diabetic Measure");

}



function generateVisualizationTrackingMode(canvas_choice) {

	console.log("Generating visualization for Tracking Mode...");


	var cSVG = d3.select("#".concat(canvas_choice)).select("#canvasSVG");
	
	// Create min and max dates for the time scale - 1 week before and after
	var minDate = new Date(arrayDates[0].getFullYear(), arrayDates[0].getMonth(), arrayDates[0].getDate() - 7);
	var maxDate = new Date(arrayDates[arrayDates.length - 1].getFullYear(), arrayDates[arrayDates.length - 1].getMonth(), arrayDates[arrayDates.length - 1].getDate() + 7);
	
	// Creat the scale for the X axis
	var xScale = d3.time.scale()
		.domain([minDate, maxDate])
		.range([0, DEFAULT_GRAPH_WIDTH_TRACKING_MODE]);
		
	// To do: better date format
	var xAxis = d3.svg.axis()
		.scale(xScale)
		.orient("bottom")
		.tickFormat(d3.time.format("%b %d"));

	// Create Y Axis scale
	var yScale = d3.scale.linear()
		.domain([0, 100])
		.range([DEFAULT_GRAPH_HEIGHT_TRACKING_MODE, 0]);
		
	var yAxis = d3.svg.axis()
		.scale(yScale)
		.orient("left");
		
	// Create and append ticklines for the xAxis
	cSVG.selectAll(".xTickLine")
		.data(arrayCalculatedData)
		.enter().append("line")
			.attr("class", "tickLine xTickLine")
			.attr("x1", function (d, i) { return xScale(arrayDates[i]); })
			.attr("x2", function (d, i) { return xScale(arrayDates[i]); })
			.attr("y1", 0)
			.attr("y2", DEFAULT_GRAPH_HEIGHT_TRACKING_MODE)
			.style("opacity", 0.7)
			.style("stroke", "#cccccc")
			.style("stroke-width", "1px");

	// Create and append ticklines for the yAxis
	cSVG.selectAll(".yTickLine")
		.data(yScale.ticks(10))
		.enter().append("line")
			.attr("class", "tickLine yTickLine")
			.attr("x1", 0)
			.attr("x2", DEFAULT_GRAPH_WIDTH_TRACKING_MODE)
			.attr("y1", yScale)
			.attr("y2", yScale)
			.style("opacity", 0.7)
			.style("stroke", "#cccccc")
			.style("stroke-width", "1px");
	
	// Append xAxis to the cSVG
	cSVG.append("g")
		.attr("class", "xAxis")
		.attr("transform", "translate(0, " + DEFAULT_GRAPH_HEIGHT_TRACKING_MODE + ")")
		.style("font-size", "14px")
		.style("font-family", "Arial")
		.call(xAxis);
				
	// Append yAxis to the canvas
	cSVG.append("g")
		.attr("class", "yAxis")
		.style("font-size", "14px")
		.style("font-family", "Arial")
		.call(yAxis);
	
	// Add styling and attributes for major ticks
	var majorTicks = document.getElementsByClassName("tick major");
	for (var i = 0; i < majorTicks.length; i++) {
		
		// Get 'line' child nodes
		majorTicks[i].childNodes[0].setAttribute("style", "fill:none; stroke:black");
		majorTicks[i].childNodes[0].setAttribute("shape-rendering", "crispEdges");
	}
	
	// // Add styling and attributes for axes paths
	var paths = document.getElementsByClassName("domain");
	for (var i = 0; i < paths.length; i++) {
		
		// Get child nodes within group
		paths[i].setAttribute("style", "fill:none; stroke:black");
		paths[i].setAttribute("shape-rendering", "crispEdges");
		paths[i].setAttribute("vector-effect", "non-scaling-stroke");
	}
	
	// Append lines between data points
	cSVG.selectAll(".dataPointConnector")
		.data(new Array(arrayCalculatedData.length - 1))
		.enter().append("line")
			.attr("class", "dataPointConnector")
			.attr("x1", function (d, i) { return xScale(arrayDates[i]); })
			.attr("x2", function (d, i) { return xScale(arrayDates[i + 1]); })
			.attr("y1", function (d, i) { return yScale(arrayCalculatedData[i][0] * 100); })
			.attr("y2", function (d, i) { return yScale(arrayCalculatedData[i + 1][0] * 100); })
			.attr("stroke", DEFAULT_COLOURS[0])
			.attr("stroke-width", 2);
	
	// Append data points
	cSVG.selectAll(".dataPoint")
		.data(arrayCalculatedData)
		.enter().append("circle")
			.attr("class", "dataPoint")
			.attr("cx", function (d, i) { return xScale(arrayDates[i]); })
			.attr("cy", function(d, i) { return yScale(arrayCalculatedData[i][0] * 100); })
			.attr("r", 5)
			.attr("fill", DEFAULT_COLOURS[0])
			.on("mouseover", function(d) {
				d3.select(this)
					.attr("r", 7)
					.attr("fill", "lightcoral");
			})
			.on("mouseout", function(d) {
				d3.select(this)
					.attr("r", 5)
					.attr("fill", DEFAULT_COLOURS[0]);
			})
			.on("click", function(d, i) {
				// To do: generate graph underneath for the date clicked
				//document.getElementById("cSVGContainer_extra").removeChild(document.getElementById("canvasSVG"));
	
	
				clearCanvas("canvasContainer_extra");
				generateVisualizationSnapshotMode("canvasContainer_extra");
					
				
			});
			
	// Add x axis label
	cSVG.append("text")
		.attr("class", "xAxisLabel")
		.attr("x", DEFAULT_GRAPH_WIDTH_TRACKING_MODE / 2)
		.attr("y", DEFAULT_GRAPH_HEIGHT_TRACKING_MODE + 40)
		.attr("text-anchor", "middle")
		.style("font-weight", "bold")
		.style("font-size", "14px")
		.style("font-family", "Arial")
		.text("Date");
	
	// Add y axis label
	cSVG.append("text")
		.attr("class", "yAxisLabel")
		.attr("transform", "rotate(-90)")
		.attr("x", -DEFAULT_GRAPH_HEIGHT_TRACKING_MODE / 2)
		.attr("y", -DEFAULT_PADDING_LEFT_TRACKING_MODE / 2)
		.attr("text-anchor", "middle")
		.style("font-weight", "bold")
		.style("font-size", "14px")
		.style("font-family", "Arial")
		.text("% of patients");
		
	// Add graph title
	cSVG.append("text")
		.attr("class", "graphTitle")
		.attr("x", DEFAULT_GRAPH_WIDTH_TRACKING_MODE / 2)
		.attr("y", -DEFAULT_PADDING_TOP_TRACKING_MODE / 2)
		.attr("text-anchor", "middle")
		.style("font-size", "14px")
		.style("font-family", "sans-serif")
		.style("font-weight", "bold")
		.text(function() {
			var d = document.getElementById("dropdownDiabeticMeasures");
			var title = d.options[d.selectedIndex].value + " for Doctor";
			var arraySelectedOnly = [];
			
			var indices = arrayPhysicians[1].allIndicesOf(true);
			for (i=0; i < indices.length; i++) {
				arraySelectedOnly.push(arrayPhysicians[0][indices[i]]);
			}
			
			/*
			for (var i = 0; i < arraySelectedPhysicians.length; i++) {
				if (arraySelectedPhysicians[i]) {
					arraySelectedOnly.push(arrayUniquePhysicians[i]);
				}
			}
			*/
			if (arraySelectedOnly.length > 1) title += "s ";
			else title += " ";
			for (var i = 0; i < arraySelectedOnly.length; i++) {
				if (i == arraySelectedOnly.length - 2)
					title += arraySelectedOnly[i] + " and ";
				else if (i == arraySelectedOnly.length - 1)
					title += arraySelectedOnly[i];
				else title += arraySelectedOnly[i] + ", ";	
			}
			return title;
		});
	
	// Add labels for data points
	cSVG.selectAll(".dataLabel")
		.data(arrayCalculatedData)
		.enter().append("text")
			.attr("class", "dataLabel")
			.attr("x", function(d, i) { return xScale(arrayDates[i]); })
			.attr("y", function(d, i) { 
				// If small value, place label above point
				if ((arrayCalculatedData[i][0] * 100) < 10)
					return yScale(arrayCalculatedData[i][0] * 100) - 15;
				// Else	
				else {
					// For first data point
					if (i == 0) {
						// If adjacent point is above, place label below, vice versa
						if (arrayCalculatedData[1][0] >= arrayCalculatedData[i][0])
							return yScale(arrayCalculatedData[i][0] * 100) + 25;
						else return yScale(arrayCalculatedData[i][0] * 100) - 15;
					}
					// For last point, compare with second last point
					else if (i == arrayCalculatedData.length - 1) {
						if (arrayCalculatedData[arrayCalculatedData.length - 2][0] >= arrayCalculatedData[i][0])
							return yScale(arrayCalculatedData[i][0] * 100) + 25;
						else return yScale(arrayCalculatedData[i][0] * 100) - 15;
					}
					// Else all points in between, check both sides
					else {
						// If both adjacent points are above, place below
						if (arrayCalculatedData[i - 1][0] >= arrayCalculatedData[i][0] && arrayCalculatedData[i + 1][0] >= arrayCalculatedData[i][0])
							return yScale(arrayCalculatedData[i][0] * 100) + 25;
						// Else if both are below, place above	
						else if (arrayCalculatedData[i - 1][0] < arrayCalculatedData[i][0] && arrayCalculatedData[i + 1][0] < arrayCalculatedData[i][0])
							return yScale(arrayCalculatedData[i][0] * 100) - 15;
						// Else just place above
						else return yScale(arrayCalculatedData[i][0] * 100) - 15;
					}
				}
			}) 
			.attr("text-anchor", "middle")
			.style("fill", "black")
			.style("font-size", "13px")
			.style("font-family", "Arial")
			.text(function(d, i) { 
				if ((arrayCalculatedData[i][0] * 100) == 0)
					return (arrayCalculatedData[i][0] * 100).toFixed(0) + "%";
				else 
				return (arrayCalculatedData[i][0] * 100).toFixed(1) + "%";
			});
	
}




function toggleDataLabels(mode) {
			
	// Find data labels
	if (d3.selectAll(".dataLabel")[0].length > 0) 
		d3.selectAll(".dataLabel").remove();
		
	else {
	
		if (mode == "snapshot") {
		
			canvas.selectAll("onTargetLabel")
				.data(arrayCalculatedData[1])
				.enter().append("text")
					.attr("class", "dataLabel")
					.attr("x", function(d, i) { return xScale(d / 2); })
					.attr("y", function(d, i) { return yScale(arrayCalculatedData[0][i]) + (yScale.rangeBand()/2); })
					.attr("text-anchor", "middle")
					.style("font-family", "Arial")
					.style("font-size", "13px")
					.attr("dy", ".35em")
					.style("fill", "white")
					.text(function(d) { if (d > 0) return d.toFixed(1) + "%"; else return ""; });
			
			canvas.selectAll("offTargetLabel")
				.data(arrayCalculatedData[1])
				.enter().append("text")
					.attr("class", "dataLabel")
					.attr("x", function(d) { return xScale((100 - d)/2 + parseFloat(d)); })
					.attr("y", function(d, i) { return yScale(arrayCalculatedData[0][i]) + (yScale.rangeBand()/2); })
					.attr("text-anchor", "middle")
					.attr("dy", ".35em")
					.style("fill", "black")
					.style("font-family", "Arial")
					.style("font-size", "13px")
					.text(function(d) { if (100 - d < 100) return (100 - d).toFixed(1) + "%"; })
					.attr("display", "none");
		}
	
		else {
		
			canvas.selectAll(".dataLabel")
				.data(arrayCalculatedData)
				.enter().append("text")
					.attr("class", "dataLabel")
					.attr("x", function(d, i) { return xScale(arrayDates[i]); })
					.attr("y", function(d, i) { return yScale(arrayCalculatedData[i][0] * 100) - 15; }) // 15 pixels above data point
					.attr("text-anchor", "middle")
					.style("fill", "black")
					.style("font-size", "13px")
					.style("font-family", "Arial")
					.text(function(d, i) { 
						if ((arrayCalculatedData[i][0] * 100) == 0)
							return (arrayCalculatedData[i][0] * 100).toFixed(0) + "%";
						else 
						return (arrayCalculatedData[i][0] * 100).toFixed(1) + "%";
					});
		
		}
	}
}





