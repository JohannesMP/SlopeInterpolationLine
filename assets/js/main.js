//  to look at https://bl.ocks.org/gordlea/27370d1eea8464b04538e6d8ced39e89


// var chart = d3.select("#chart1");

// var dataSet = [10,20,30,25,15];
// var list = chart.append("ul");
// for(var i = 0; i < dataSet.length+3; ++i)
// {
//     list.append("li").text("derp");
// }

// list.selectAll("li")
//     .data(dataSet)
//     .text(function(d) { return d; });

Math.lerp = function(a, b, t)
{
    return a + (b-a) * t;
}
Math.clamp = function(val, min, max)
{
    if      (val < min) return min;
    else if (val > max) return max;
    return val;
}


function bisectSlopesLinear(m_1, m_2)
{
    return (m_1 + m_2) / 2
}

function bisectSlopesAngular(m_1, m_2)
{
    let denominator = m_1 + m_2;
    if(denominator == 0)
        return 0;
    let numerator = Math.sqrt( (m_1*m_1 + 1)*(m_2*m_2 + 1) ) + m_1*m_2 - 1;
    return numerator / denominator;
}


function SlopeInterpolation(slopes, root) 
{
    this.SetData(slopes, root);
    // this.isAngular = false
}

SlopeInterpolation.prototype.SetData = function(slopes, root) 
{
    this.ClearData();
    this.AddSlopes(slopes);
    this.SetRoot(root);
}

SlopeInterpolation.prototype.ClearData = function() 
{
    this.root = undefined;
    this.slopes = [];
}

SlopeInterpolation.prototype.SetRoot = function(rootPoint)
{
    if(rootPoint === undefined)
        rootPoint = {x:0, y:0};

    // Root changed
    if(this.root === undefined || this.root.x != rootPoint.x || this.root.y != rootPoint.y)
    {
        // We have existing cached data. shift it 
        if(this.slopes !== undefined && this.slopes.length > 0)
        {
            // update cached data based on root
            let oldY = this.Evaluate(rootPoint.x);
            let offset = rootPoint.y - oldY;
            for(var i = 0; i < this.slopes.length; ++i)
            {
                this.slopes[i].cached_y += offset;
            }
        }
     
        this.root = rootPoint;
    }
}

SlopeInterpolation.prototype.AddSlopes = function(slopes) 
{
    for(var i = 0; i < slopes.length; ++i)
    {
        let entry = slopes[i];
        if(entry.x !== undefined && entry.m !== undefined)
        {
            let toAdd = {
                x:        entry.x,
                m:        entry.m, 
                cached_y: 0, 
                cached_m: entry.m
            };

            this.slopes.push(toAdd);
        }
    }
    // sort by x pos
    this.slopes.sort( function(a,b) { return a.x - b.x } );

    this.ReCache();
}

// Given the current root point and slope data, cache the Y heights for each slope data point
SlopeInterpolation.prototype.ReCache = function()
{
    let len = this.slopes.length;

    // Cache the bisected slopes and relative y offsets from each element [i] to [i+1]
    for(let i = 0; i < len-1; ++i)
    {
        let curEntry = this.slopes[i];
        let nextEntry = this.slopes[i+1];

        // cache the a average slope needed to get from [i] to [i+1]
        curEntry.cached_m = bisectSlopesLinear(curEntry.m, nextEntry.m);

        // use that slope to calculate the relative y offset from [i] to [i+1]
        let run = nextEntry.x - curEntry.x;
        let rise = run * curEntry.cached_m;
        nextEntry.cached_y = curEntry.cached_y + rise;
    }
}

SlopeInterpolation.prototype.GetSlopeAt = function(x_pos)
{
    // Case 1. left of lowest - use lowest value
    if(x_pos <= this.slopes[0].x)
    {
        return this.slopes[0].m;
    }

    // Case 2. right of highest - use highest value
    if(x_pos >= this.slopes[this.slopes.length-1].x)
    {
        return this.slopes[this.slopes.length-1].m;
    }

    // [0] ... [i] , [i+1] ... [length-1]
    //

    // Case 3. between lowest and highest
    let x_last = this.slopes[0].x;
    let m_last = this.slopes[0].m;
    for(var i = 1; i < this.slopes.length; ++i)
    {
        let x_cur = this.slopes[i].x;
        let m_cur = this.slopes[i].m 

        // exactly equal to i+1, so return slope of i+1
        if(x_pos == x_cur)
            return m_cur;
        // betwen i and i+1 so return lerped slope between i and i+1
        else(x_pos < x_cur)
        {
            let x_dist = x_cur - x_last;
            let x_off = x_pos - x_last;
            let factor = x_off / x_dist;
            return Math.lerp(m_last, m_cur, factor);
        }

        x_last = x_cur;
        m_last = m_cur;
    }
}

SlopeInterpolation.prototype.Evaluate = function(x_pos) 
{
    let len = this.slopes.length;
    let x = Number(x_pos);

    let riseRunHelper = function(curElement, nextElement)
    {
        let run = x_pos - curElement.x;
        if(nextElement === undefined)
        {
            let rise = run * curElement.m;
            return curElement.cached_y + rise;
        }
        else
        {
            let diff = (nextElement.x - curElement.x);
            let factor = run / diff;

            let mid_m = curElement.cached_m;
            // The y pos based on cached bisect slope
            let mid_rise = run * mid_m;
            let mid_y = curElement.cached_y + mid_rise;
            
            var sideElement = curElement 
            if(factor > 0.5)
            {
                factor = 1 - factor;
                sideElement = nextElement;
            }

            var side_run = x_pos - sideElement.x;
            var side_rise = sideElement.m * side_run;
            var side_y = sideElement.cached_y + side_rise;

            return Math.lerp(side_y, mid_y, factor);
        }
    }

    // Case 1: requested point is to the left of cached slope data
    if(x < this.slopes[0].x)
    {
        return riseRunHelper(this.slopes[0]);
    }
    // Case 2: requested point is to the right of cached slope data
    else if(x >= this.slopes[len-1].x)
    {
        return riseRunHelper(this.slopes[len-1]);
    }

    // Case 3: requested X is in range of cached slope data
    for(var i = 0; i < len-1; ++i)
    {
        curElement = this.slopes[i];
        nextEelement = this.slopes[i+1];
        // Case 3.1 on a slope element - just return cached y
        if(curElement.x == x_pos)
        {
            return curElement.cached_y;
        }
        // Case 3.2 between two slope elements - use cached_m with y
        if(curElement.x < x_pos && this.slopes[i+1].x > x_pos)
        {
            return riseRunHelper(curElement, nextEelement);
        }
    }
}


var rootPoint = { x: 0, y: 1 };
var slopeData = [
    { x:  0, m:  -1 },
    { x:  1, m:  1 },
    { x:  4, m:  1 },
    { x:  5, m:  3 },
    { x:  6, m:  0 },
    { x:  8, m:  1 },
    { x: 10, m:  -1 },
    { x: 11, m:  0 }
    // { x: 12, m:  0 } 
    ];

let temp = new SlopeInterpolation(slopeData, rootPoint);
for(var i = 0; i < slopeData.length; ++i)
{
    slopeData[i].y = temp.Evaluate(slopeData[i].x);
}

lineData = [];
for(let cur_x = -5; cur_x < 17; cur_x += 0.1)
{
    let cur_y = temp.Evaluate(cur_x);
    lineData.push([(cur_x+5), cur_y]);
}


var lineGenerator = d3.line()
    .curve(d3.curveLinear);
var pathData = lineGenerator(lineData);

d3.select('path')
    .attr('d', pathData);

// Also draw points for reference
// d3.select('svg g')
//     .selectAll('circle')
//     .data(lineData)
//     .enter()
//     .append('circle')
//     .attr('cx', function(d) {
//         return d[0];
//     })
//     .attr('cy', function(d) {
//         return d[1];
//     })
//     .attr('r', 0.1);
  
