export const getScoreColor = (score: number): string => {
  if (score >= 80)
    return "bg-linear-to-r from-violet to-pink bg-clip-text text-transparent";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
};

export const getScoreLabel = (score: number): string => {
  if (score >= 80) return "Excellent Match";
  if (score >= 60) return "Good Match";
  if (score >= 40) return "Fair Match";
  return "Poor Match";
};
