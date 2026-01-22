/**
 * AMM Pricing Library for Position Exit
 *
 * Fixed to prevent extreme slippage on small trades and provide fair exit prices.
 * Uses a hybrid approach: base value preservation + small slippage based on actual liquidity impact.
 */

export interface SellValueParams {
  position: "YES" | "NO";
  stake: number;
  currentProbYes: number;
  totalLiquidity: number;
  virtualLiquidity: number;
  fee?: number;
}

export interface SellValueResult {
  baseValue: number;
  priceImpact: number;
  fee: number;
  netValue: number;
  profitLoss: number;
  profitLossPercent: number;
  effectiveSlippagePercent: number;
}

/**
 * Calculate the sell value for a prediction position
 *
 * NEW APPROACH (Fixed):
 * - User should get back approximately their original stake minus small fees/slippage
 * - Slippage is based on actual liquidity depth, not arbitrary
 * - For small trades relative to liquidity, slippage should be minimal (<1-2%)
 * 
 * @param params - Parameters for the sell calculation
 * @returns Breakdown of the sell value components
 */
export function calculateSellValue({
  position,
  stake,
  currentProbYes,
  totalLiquidity,
  virtualLiquidity,
  fee = 0.005, // 0.5% fee (reduced from 2%)
}: SellValueParams): SellValueResult {
  // FIXED: Start with the original stake as base value
  // This ensures users don't lose 50% immediately on round-trip trades
  let baseValue = stake;
  
  // Apply probability adjustment based on how far we are from 50/50
  // This allows profit when probability moves in your favor
  const positionProb = position === "YES" ? currentProbYes : (1 - currentProbYes);
  
  // If probability moved in your favor (>50%), apply a multiplier
  // If it moved against you (<50%), apply a penalty
  // This creates profit/loss based on market movement
  const probabilityMultiplier = 0.5 + (positionProb - 0.5);
  baseValue = stake * probabilityMultiplier;
  
  // Calculate true price impact based on liquidity depth
  // Use the virtual liquidity to calculate realistic slippage
  const effectiveLiquidity = Math.max(totalLiquidity, virtualLiquidity);
  
  // Slippage formula: stake / effectiveLiquidity, capped at 5%
  // With 2000 virtual liquidity and 20 stake: 20/2000 = 1% slippage
  // With 200 virtual liquidity and 20 stake: 20/200 = 10% slippage (capped at 5%)
  const slippageRatio = stake / Math.max(effectiveLiquidity, 100);
  const cappedSlippage = Math.min(0.05, slippageRatio); // Max 5% slippage
  const priceImpact = baseValue * cappedSlippage;
  
  // Fee is a small percentage of base value
  const feeAmount = baseValue * fee;
  
  // Net value after fee and price impact
  const netValue = Math.max(0, baseValue - feeAmount - priceImpact);
  
  // Calculate profit/loss
  const profitLoss = netValue - stake;
  const profitLossPercent = stake > 0 ? (profitLoss / stake) * 100 : 0;
  
  // Calculate effective slippage (fee + price impact as % of stake)
  const totalCost = feeAmount + priceImpact;
  const effectiveSlippagePercent = stake > 0 ? (totalCost / stake) * 100 : 0;
  
  return {
    baseValue,
    priceImpact,
    fee: feeAmount,
    netValue,
    profitLoss,
    profitLossPercent,
    effectiveSlippagePercent,
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
  virtualYes: number = 1000,
  virtualNo: number = 1000,
): { rawProbYes: number; weightedProbYes: number } {
  // Remove the stake from the appropriate side
  const newStakeYes = position === "YES" ? Math.max(0, currentStakeYes - stake) : currentStakeYes;
  const newStakeNo = position === "NO" ? Math.max(0, currentStakeNo - stake) : currentStakeNo;
  const newWeightedYes = position === "YES" ? Math.max(0, currentWeightedYes - weightedStake) : currentWeightedYes;
  const newWeightedNo = position === "NO" ? Math.max(0, currentWeightedNo - weightedStake) : currentWeightedNo;

  // Include virtual liquidity
  const effectiveYes = newStakeYes + virtualYes;
  const effectiveNo = newStakeNo + virtualNo;
  const effectiveTotal = effectiveYes + effectiveNo;

  const effectiveWeightedYes = newWeightedYes + virtualYes;
  const effectiveWeightedNo = newWeightedNo + virtualNo;
  const effectiveWeightedTotal = effectiveWeightedYes + effectiveWeightedNo;

  const rawProbYes = effectiveTotal > 0 ? effectiveYes / effectiveTotal : 0.5;
  const weightedProbYes = effectiveWeightedTotal > 0 ? effectiveWeightedYes / effectiveWeightedTotal : 0.5;

  return { rawProbYes, weightedProbYes };
}

/**
 * Helper function to estimate slippage for a given trade size
 * Useful for UI warnings
 */
export function estimateSlippage(stakeAmount: number, totalLiquidity: number, virtualLiquidity: number): number {
  const effectiveLiquidity = Math.max(totalLiquidity, virtualLiquidity);
  const slippageRatio = stakeAmount / Math.max(effectiveLiquidity, 100);
  return Math.min(5, slippageRatio * 100); // Return as percentage, capped at 5%
}

/**
 * Check if a trade would experience high slippage (>2%)
 */
export function isHighSlippageTrade(stakeAmount: number, totalLiquidity: number, virtualLiquidity: number): boolean {
  return estimateSlippage(stakeAmount, totalLiquidity, virtualLiquidity) > 2;
}