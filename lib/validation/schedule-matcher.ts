import type { WidgetSchedule } from "@/domain/entities/widget-schedule.entity";

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Evalúa si el widget está dentro de alguno de sus horarios configurados en
 * este momento, convirtiendo la hora actual a la zona horaria de cada
 * horario antes de compararla (sección 15.10). Si el widget no tiene
 * horarios configurados, se considera siempre disponible.
 */
export function isWidgetWithinSchedule(
  schedules: WidgetSchedule[],
  now: Date = new Date(),
): boolean {
  if (schedules.length === 0) return true;

  return schedules.some((schedule) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: schedule.timezone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      hourCycle: "h23",
    }).formatToParts(now);

    const weekdayShort = parts.find((p) => p.type === "weekday")?.value ?? "";
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");

    const dayOfWeek = WEEKDAY_INDEX[weekdayShort];
    if (dayOfWeek === undefined || dayOfWeek !== schedule.dayOfWeek) {
      return false;
    }

    const currentMinutes = hour * 60 + minute;
    const startMinutes = toMinutes(schedule.startTime);
    const endMinutes = toMinutes(schedule.endTime);

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
    // Horario que cruza la medianoche (por ejemplo, de 22:00 a 06:00).
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  });
}
