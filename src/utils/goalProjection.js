// Year-by-year projection toward a financial-independence target, keeping
// three cash flows distinct per the confirmed design:
//   - real estate compounds alone at its own rate (appreciation only)
//   - everything else compounds at the general rate AND receives new money
//     every year from manual savings (deposits keep growing once added)
//   - loan principal paydown only shrinks liabilities - it never compounds
// The target itself inflates every year, since a fixed today's-money number
// stops meaning anything decades out. There's no closed-form solution once
// the target is a moving target too, so this simulates forward year by year
// and reports the first year net worth clears the (inflated) target - "years
// to goal" is a table lookup, not a formula, which also makes it directly
// explainable and exactly what powers the what-if calculator.
export function projectGoalTimeline({
  realEstateValue,
  otherAssetsValue,
  liabilitiesValue,
  annualNewSavings,
  annualPrincipalPaydown,
  target,
  inflationRate,
  realEstateRate,
  otherRate,
  maxYears = 60,
}) {
  const realEstateFactor = 1 + Number(realEstateRate) / 100
  const otherFactor = 1 + Number(otherRate) / 100
  const inflationFactor = 1 + Number(inflationRate) / 100

  let realEstate = Number(realEstateValue) || 0
  let other = Number(otherAssetsValue) || 0
  let liabilities = Number(liabilitiesValue) || 0
  let goalLine = Number(target) || 0

  const series = [{ year: 0, netWorth: realEstate + other - liabilities, target: goalLine }]
  let crossingYear = series[0].netWorth >= goalLine ? 0 : null

  for (let year = 1; year <= maxYears; year++) {
    realEstate *= realEstateFactor
    other = other * otherFactor + (Number(annualNewSavings) || 0)
    liabilities = Math.max(0, liabilities - (Number(annualPrincipalPaydown) || 0))
    goalLine *= inflationFactor

    const netWorth = realEstate + other - liabilities
    series.push({ year, netWorth, target: goalLine })
    if (crossingYear === null && netWorth >= goalLine) crossingYear = year
  }

  return { series, crossingYear }
}
