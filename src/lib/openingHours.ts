export function getOpeningHoursForToday(descriptions: string[], date = new Date()) {
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date).toLowerCase();
  return descriptions.find((description) => description.toLowerCase().startsWith(weekday)) ?? null;
}
