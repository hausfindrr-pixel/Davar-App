/** A warm, encouraging line keyed to where someone is in their streak. */
export function streakMessage(currentCount: number): string {
  if (currentCount <= 0) return "Begin your journey today";
  if (currentCount === 1) return "Day 1 — every journey starts with a step";
  if (currentCount < 7) return `${currentCount} days strong — keep going`;
  if (currentCount < 14) return "A full week — your roots are growing deeper";
  if (currentCount < 30) return `${currentCount} days of faithfulness`;
  return `${currentCount} days — a quiet testimony of grace`;
}

/** Which of 6 growth stages to render for a given streak length. */
export function plantStage(currentCount: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (currentCount <= 0) return 0;
  if (currentCount < 3) return 1;
  if (currentCount < 7) return 2;
  if (currentCount < 14) return 3;
  if (currentCount < 30) return 4;
  return 5;
}
