var rootPoint = { x: 1, y: -5 };
var rawSlopeData = [
    { x: 0, m: -1},
    { x: 1, m: 1},
    { x: 3, m: 1},
    { x: 4, m: 2},
    { x: 8, m: -2},
    { x: 12, m: 0},
    ];

let interpolator = new SlopeInterpolation(rawSlopeData, rootPoint);

// Evaluate just the points for the given control points
var dataPoints = [];
for(var i = 0; i < rawSlopeData.length; ++i)
{
    let cur_x = rawSlopeData[i].x;
    let cur_y = interpolator.Evaluate(cur_x);
    let cur_m = rawSlopeData[i].m;
    dataPoints.push({x: cur_x, y: cur_y, m: cur_m});
}

updateWindow();
d3.select(window).on('resize.updatesvg', updateWindow);

function updateWindow()
{
    // Set up d3
    // Referenced: https://bl.ocks.org/gordlea/27370d1eea8464b04538e6d8ced39e89

    // Set screen dimensions
    let margin = {top: 50, right: 50, bottom: 50, left: 50}
    let width = window.innerWidth - margin.left - margin.right
    let height = window.innerHeight - margin.top - margin.bottom;

    // Evaluate intermittend points for drawing a smoth line
    let x_min = interpolator.GetXMin();
    let x_max = interpolator.GetXMax();
    let range = x_max - x_min;
    let step = range / width;

    let y_min = Number.POSITIVE_INFINITY;
    let y_max = Number.NEGATIVE_INFINITY;
    lineData = [];
    for(let cur_x = x_min; cur_x < x_max; cur_x += step)
    {
        let cur_y = interpolator.Evaluate(cur_x);
        y_min = cur_y < y_min ? cur_y : y_min;
        y_max = cur_y > y_max ? cur_y : y_max;
        lineData.push({x: cur_x, y: cur_y});
    }

    // Ensure min/max ranges always include 0
    let x_scale_min = 0 < x_min ? 0 : x_min;
    let x_scale_max = 0 > x_max ? 0 : x_max;
    let y_scale_min = 0 < y_min ? 0 : y_min;
    let y_scale_max = 0 > y_max ? 0 : y_max;

    // Set up Scales
    var xScale = d3.scaleLinear()
      .domain([x_scale_min, x_scale_max])   // input
      .range([0, width]);       // output
    var yScale = d3.scaleLinear()
      .domain([y_scale_min, y_scale_max])   // input 
      .range([height, 0]);      // output 

    // Line generator
    var line = d3.line()
      .x(function(d) { return xScale(d.x); }) // set the x values for the line generator
      .y(function(d) { return yScale(d.y); }) // set the y values for the line generator 
      .curve(d3.curveLinear)             // apply smoothing to the line

    d3.select("#graphic").html("");

    // Generate SVG
    var svg = d3.select("#graphic")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom -6)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg.append("g")
            .attr("class", "axis axis-y")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale));

        // Call the y axis in a group tag
        svg.append("g")
            .attr("class", "axis axis-x")
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
        .attr("r", 5);
}
