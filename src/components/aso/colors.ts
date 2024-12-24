export function getChipColor(overall: number | null): string {
  if (overall === null) {
    return 'bg-secondary'; // default color for chips without scores
  }

  // Excellent keywords
  if (overall >= 7.5) {
    return 'bg-green-500/20 text-green-700 dark:text-green-400';
  }
  // Good keywords
  if (overall >= 5) {
    return 'bg-lime-500/20 text-lime-700 dark:text-lime-400';
  }
  // Poor keywords
  if (overall < 3.5) {
    return 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400';
  }
  // Average keywords
  return 'bg-blue-300/20 text-blue-700 dark:text-blue-400';
}
