const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const UNSUPPORTED_RULES = /\b(PH|SH|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|sunrise|sunset|easter)\b/i;
const DAY_RULE = /\b(Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*-\s*(Mo|Tu|We|Th|Fr|Sa|Su))?\b/g;
const TIME_RANGES = /\d{1,2}:\d{2}-\d{1,2}:\d{2}(?:,\s*\d{1,2}:\d{2}-\d{1,2}:\d{2})*/;

function ruleAppliesToday(selector: string, today: string) {
  const days = [...selector.matchAll(DAY_RULE)];
  if (selector.length === 0) {
    return true;
  }
  if (days.length === 0) {
    return false;
  }

  return days.some(([, firstDay, lastDay]) => {
    const first = WEEKDAYS.indexOf(firstDay);
    const last = lastDay ? WEEKDAYS.indexOf(lastDay) : first;
    if (first < 0 || last < 0) {
      return false;
    }

    let day = first;
    while (true) {
      if (WEEKDAYS[day] === today) {
        return true;
      }
      if (day === last) {
        return false;
      }
      day = (day + 1) % WEEKDAYS.length;
    }
  });
}

export function getOpeningHoursForToday(schedule?: string, date = new Date()) {
  if (!schedule) {
    return null;
  }
  if (schedule.trim() === '24/7') {
    return 'Open 24 hours';
  }
  if (UNSUPPORTED_RULES.test(schedule)) {
    return null;
  }

  const today = WEEKDAYS[(date.getDay() + 6) % WEEKDAYS.length];
  let todaysSchedule: string | null = null;

  for (const rule of schedule.split(';').map((part) => part.trim()).filter(Boolean)) {
    const timeMatch = TIME_RANGES.exec(rule);
    const selector = (timeMatch ? rule.slice(0, timeMatch.index) : rule).trim();
    if (!/^[A-Za-z0-9,\-\s]*$/.test(selector) || !ruleAppliesToday(selector, today)) {
      continue;
    }

    const lowerRule = rule.toLowerCase();
    if (/\b(off|closed)\b/.test(lowerRule)) {
      todaysSchedule = 'Closed today';
    } else if (timeMatch) {
      todaysSchedule = timeMatch[0].replace(/,/g, ', ');
    } else if (/\b(open|24\/7)\b/.test(lowerRule)) {
      todaysSchedule = 'Open 24 hours';
    }
  }

  return todaysSchedule;
}
