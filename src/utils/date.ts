/**
 * Returns the start and end dates for fetching preprints based on look-back and offset days.
 * In particular, the start date is calculated as (today - offsetDays - lookBackDays) at 00:00:00.000
 * and the end date is calculated as (today - offsetDays - 1) at 23:59:59.999.
 * This means that getPreprintDateRange(1, 0) will return the start and end dates for the full yesterday.
 * @param lookBackDays - Number of days to look back for recent papers.
 * @param offsetDays - Number of days to offset the look back period.
 * @returns A tuple containing the start and end dates.
 */
export function getPreprintDateRange(
  lookBackDays: number,
  offsetDays: number
): [Date, Date] {
  const startDay = new Date(new Date().setHours(0, 0, 0, 0));
  startDay.setDate(startDay.getDate() - offsetDays - lookBackDays);
  const endDay = new Date(new Date().setHours(23, 59, 59, 999));
  endDay.setDate(endDay.getDate() - offsetDays - 1);
  return [startDay, endDay];
}
