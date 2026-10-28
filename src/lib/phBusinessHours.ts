// Business hours: Mon-Fri, 8am-5pm Philippine time (Asia/Manila is a fixed
// UTC+8, no DST, so this is stable year-round). Shared by the stale-request
// alerts and the inbox auto-refresh so the two always agree on "working time".
export function isWithinPhBusinessHours(now: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(now)

  const weekday = parts.find((p) => p.type === 'weekday')?.value
  const hour = Number(parts.find((p) => p.type === 'hour')?.value)

  const isWeekday = weekday !== 'Sat' && weekday !== 'Sun'
  return isWeekday && hour >= 8 && hour < 17
}
