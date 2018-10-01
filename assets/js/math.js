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
