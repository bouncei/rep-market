/**
 * AMM Pricing Library for Position Exit
 *
 * Calculates sell values for prediction positions based on current market odds.
 * Uses a simplified constant-product approach inspired by LMSR.
 */

export interface SellValueParams {
  position: "YES" | "NO";
  stake: number;
  currentProbYes: number;
  totalLiquidity: number;
  fee?: number;
}

export interface SellValueResult {
  baseValue: number;
  priceImpact: number;
  fee: number;
  netValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

/**
 * Calculate the sell value for a prediction position
 *
 * @param params - Parameters for the sell calculation
 * @returns Breakdown of the sell value components
 */
export function calculateSellValue({
  position,
  stake,
  currentProbYes,
  totalLiquidity,
  fee = 0.02,
}: SellValueParams): SellValueResult {
  // Get the probability for the position being sold
  const positionProb = position === "YES" ? currentProbYes : (1 - currentProbYes);

  // Base value is stake multiplied by current probability
  const baseValue = stake * positionProb;

  // Price impact: larger stakes relative to liquidity have more impact
  // Max 10% price impact
  const priceImpactPercent = Math.min(0.10, stake / Math.max(totalLiquidity, 1));
  const priceImpact = baseValue * priceImpactPercent;

  // Fee is a flat percentage of base value
  const feeAmount = baseValue * fee;

  // Net value after fee and price impact
  const netValue = Math.max(0, baseValue - feeAmount - priceImpact);

  // Calculate profit/loss
  const profitLoss = netValue - stake;
  const profitLossPercent = stake > 0 ? (profitLoss / stake) * 100 : 0;

  return {
    baseValue,
    priceImpact,
    fee: feeAmount,
    netValue,
    profitLoss,
    profitLossPercent,
  };
}

/**
 * Calculate the RepScore delta for a sold position
 *
 * @param originalStake - The original stake amount
 * @param netValue - The net value received from the sale
 * @returns The RepScore delta (positive for profit, negative for loss)
 */
export function calculateRepScoreDelta(originalStake: number, netValue: number): number {
  return netValue - originalStake;
}

/**
 * Calculate updated market probabilities after a position is sold
 *
 * @param currentStakeYes - Current total YES stake
 * @param currentStakeNo - Current total NO stake
 * @param position - Position being sold
 * @param stake - Stake amount being removed
 * @param weightedStake - Weighted stake amount being removed
 * @param virtualYes - Virtual YES liquidity
 * @param virtualNo - Virtual NO liquidity
 * @returns Updated probabilities
 */
export function calculateUpdatedProbabilities(
  currentStakeYes: number,
  currentStakeNo: number,
  currentWeightedYes: number,
  currentWeightedNo: number,
  position: "YES" | "NO",
  stake: number,
  weightedStake: number,
  virtualYes: number = 100,
  virtualNo: number = 100,
): { rawProbYes: number; weightedProbYes: number } {
  // Remove the stake from the appropriate side
  const newStakeYes = position === "YES" ? currentStakeYes - stake : currentStakeYes;
  const newStakeNo = position === "NO" ? currentStakeNo - stake : currentStakeNo;
  const newWeightedYes = position === "YES" ? currentWeightedYes - weightedStake : currentWeightedYes;
  const newWeightedNo = position === "NO" ? currentWeightedNo - weightedStake : currentWeightedNo;

  // Include virtual liquidity
  const effectiveYes = Math.max(0, newStakeYes) + virtualYes;
  const effectiveNo = Math.max(0, newStakeNo) + virtualNo;
  const effectiveTotal = effectiveYes + effectiveNo;

  const effectiveWeightedYes = Math.max(0, newWeightedYes) + virtualYes;
  const effectiveWeightedNo = Math.max(0, newWeightedNo) + virtualNo;
  const effectiveWeightedTotal = effectiveWeightedYes + effectiveWeightedNo;

  const rawProbYes = effectiveTotal > 0 ? effectiveYes / effectiveTotal : 0.5;
  const weightedProbYes = effectiveWeightedTotal > 0 ? effectiveWeightedYes / effectiveWeightedTotal : 0.5;

  return { rawProbYes, weightedProbYes };
}
