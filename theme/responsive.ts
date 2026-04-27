export function wp(width: number, percent: number) {
  return Math.round((width * percent) / 100);
}

export function dp(width: number, baseValue: number) {
  const scaledValue = (width / 390) * baseValue;

  if (scaledValue < baseValue * 0.88) {
    return Math.round(baseValue * 0.88);
  }

  if (scaledValue > baseValue * 1.2) {
    return Math.round(baseValue * 1.2);
  }

  return Math.round(scaledValue);
}
