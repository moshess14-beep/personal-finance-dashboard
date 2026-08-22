// Month-by-month projection toward a financial-independence target, keeping
// three cash flows distinct per the confirmed design:
//   - real estate compounds alone at its own rate (appreciation only)
//   - everything else compounds at the general rate AND receives new money
//     every month from manual savings (deposits keep growing once added)
//   - loan principal paydown only shrinks liabilities - it never compounds
// Monthly resolution (rather than yearly) exists so intermediate milestones
// can report "1 year 2 months" instead of only whole years - annual rates
// are converted to their equivalent monthly rate via (1+r)^(1/12).
//
// simulateNetWorth is the one place the net-worth trajectory is computed;
// both the main (inflation-adjusted) goal and the fixed-amount milestones
// read from the same trajectory rather than re-simulating, so they can never
// disagree about what net worth looks like at a given month.
export function simulateNetWorth({
  realEstateValue,
  otherAssetsValue,
  liabilitiesValue,
  annualNewSavings,
  annualPrincipalPaydown,
  realEstateRate,
  otherRate,
  maxYears = 60,
}) {
  const monthlyRealEstateFactor = (1 + Number(realEstateRate) / 100) ** (1 / 12)
  const monthlyOtherFactor = (1 + Number(otherRate) / 100) ** (1 / 12)
  const monthlyNewSavings = (Number(annualNewSavings) || 0) / 12
  const monthlyPrincipalPaydown = (Number(annualPrincipalPaydown) || 0) / 12

  let realEstate = Number(realEstateValue) || 0
  let other = Number(otherAssetsValue) || 0
  let liabilities = Number(liabilitiesValue) || 0

  const trajectory = [{ month: 0, netWorth: realEstate + other - liabilities }]
  const maxMonths = maxYears * 12
  for (let month = 1; month <= maxMonths; month++) {
    realEstate *= monthlyRealEstateFactor
    other = other * monthlyOtherFactor + monthlyNewSavings
    liabilities = Math.max(0, liabilities - monthlyPrincipalPaydown)
    trajectory.push({ month, netWorth: realEstate + other - liabilities })
  }
  return trajectory
}

// Compares a net-worth trajectory against a target that itself inflates
// every month - there's no closed-form solution once the target is a moving
// target too, so this walks the trajectory and reports the first month net
// worth clears the (inflated) target. That "months to goal" lookup also
// powers the what-if calculator, since it's just re-run on a new trajectory.
//
// Pass an already-computed `trajectory` (e.g. one shared with milestone
// lookups) to avoid re-simulating; otherwise one is built from the other
// fields.
export function projectGoalTimeline({
  trajectory,
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
  const resolvedTrajectory =
    trajectory ??
    simulateNetWorth({
      realEstateValue,
      otherAssetsValue,
      liabilitiesValue,
      annualNewSavings,
      annualPrincipalPaydown,
      realEstateRate,
      otherRate,
      maxYears,
    })
  const monthlyInflationFactor = (1 + Number(inflationRate) / 100) ** (1 / 12)

  let goalLine = Number(target) || 0
  let crossingMonth = resolvedTrajectory[0].netWorth >= goalLine ? 0 : null
  const series = resolvedTrajectory.map((point, i) => {
    if (i > 0) goalLine *= monthlyInflationFactor
    if (crossingMonth === null && point.netWorth >= goalLine) crossingMonth = point.month
    return { month: point.month, netWorth: point.netWorth, target: goalLine }
  })

  return { series, crossingMonth }
}

// A milestone amount (a round million, or a percentage of today's target) is
// fixed in nominal terms - it doesn't inflate the way the overall goal does.
// This just finds the first month the trajectory clears it.
export function monthsToReachAmount(trajectory, amount) {
  const hit = trajectory.find((point) => point.netWorth >= amount)
  return hit ? hit.month : null
}
