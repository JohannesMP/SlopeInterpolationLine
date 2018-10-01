var rootPoint = { x: 0, y: 1 };
var rawSlopeData = [
    { x: 0, m: 0},
    { x: 4, m: 2},
    { x: 8, m: -2},
    { x: 12, m: 0},
    ];

let interpolator = new SlopeInterpolation(rawSlopeData , rootPoint);


// Evaluate just the points for the given control points
var dataPoints = [];
for(var i = 0; i < rawSlopeData.length; ++i)
{
    let cur_x = rawSlopeData[i].x;
    let cur_y = interpolator.Evaluate(cur_x);
    let cur_m = rawSlopeData[i].m;
    dataPoints.push({x: cur_x, y: cur_y, m: cur_m});
}

// Evaluate intermittend points for drawing a smoth line
let x_min = interpolator.GetXMin();
let x_max = interpolator.GetXMax();
let y_min = Number.POSITIVE_INFINITY;
let y_max = Number.NEGATIVE_INFINITY;
lineData = [];
for(let cur_x = x_min; cur_x < x_max; cur_x += 0.1)
{
    let cur_y = interpolator.Evaluate(cur_x);
    y_min = cur_y < y_min ? cur_y : y_min;
    y_max = cur_y > y_max ? cur_y : y_max;
    lineData.push({x: cur_x, y: cur_y});
}


// Set up d3
// Referenced: https://bl.ocks.org/gordlea/27370d1eea8464b04538e6d8ced39e89


// Set screen dimensions
let margin = {top: 50, right: 50, bottom: 50, left: 50}
let width = window.innerWidth - margin.left - margin.right
let height = window.innerHeight - margin.top - margin.bottom;

// Set up Scales
var xScale = d3.scaleLinear()
  .domain([x_min, x_max])   // input
  .range([0, width]);       // output
var yScale = d3.scaleLinear()
  .domain([y_min, y_max])   // input 
  .range([height, 0]);      // output 

// Line generator
var line = d3.line()
  .x(function(d) { return xScale(d.x); }) // set the x values for the line generator
  .y(function(d) { return yScale(d.y); }) // set the y values for the line generator 
  .curve(d3.curveLinear)             // apply smoothing to the line

// Generate SVG
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));

    // Call the y axis in a group tag
    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(yScale));

svg.append("path")
    .datum(lineData) // 10. Binds data to the line 
    .attr("class", "line") // Assign a class for styling 
    .attr("d", line); // 11. Calls the line generator 

svg.selectAll(".dot")
    .data(dataPoints)
  .enter().append("circle") // Uses the enter().append() method
    .attr("class", "dot") // Assign a class for styling
    .attr("cx", function(d) { return xScale(d.x) })
    .attr("cy", function(d) { return yScale(d.y) })
    .attr("r", 5)
