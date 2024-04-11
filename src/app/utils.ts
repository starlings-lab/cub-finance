export function calculateAPYFromAPR(aprDecimal: number) {
  const secondsPerYear = 365 * 24 * 60 * 60; // 86,400 seconds/day * 365 days/year
  const apyDecimal =
    Math.pow(1 + aprDecimal / secondsPerYear, secondsPerYear) - 1;
  return apyDecimal;
}
