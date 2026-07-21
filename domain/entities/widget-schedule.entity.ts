export type OutOfScheduleBehavior =
  | "ocultar widget"
  | "mostrar mensaje de no disponibilidad";

export interface WidgetSchedule {
  id: string;
  widgetId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
  outOfScheduleBehavior: OutOfScheduleBehavior;
  createdAt: Date;
  updatedAt: Date;
}
