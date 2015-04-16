function PascalsTriangle()
{
    this.GetExpandedBinomialCoefficients = function(power)
    {
        var coefficients = new Array(power);
        
        for (var index = 0; index <= power; index++)
        {
            coefficients[index] = this.GetExpandedBinomialCoefficient(power, index);
        }
        
        return coefficients;
    }

    this.GetExpandedBinomialCoefficient = function(power, term)
    {
        return this.GetFactorial(power) / (this.GetFactorial(term) * this.GetFactorial(power - term));
    }
    
    this.GetFactorial = function(value)
    {
        if (value <= 1)
            return 1;
        else
            return value * this.GetFactorial(value - 1);
    }  
}