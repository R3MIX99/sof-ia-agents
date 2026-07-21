export interface AnalyticsChartPoint {
  date: string;
  value: number;
}

export interface AnalyticsChartProps {
  data: AnalyticsChartPoint[];
  color?: string;
  formatValue?: (value: number) => string;
  height?: number;
}

const AXIS_DATE_FORMATTER = new Intl.DateTimeFormat("es-419", {
  day: "2-digit",
  month: "short",
});

const CHART_WIDTH = 600;
const PADDING_X = 8;
const PADDING_Y = 16;

function toDate(date: string): Date {
  return new Date(`${date}T00:00:00`);
}

/** Gráfico de línea minimalista trazado a mano en SVG (sección 9, sin dependencia de librerías de gráficos). */
export function AnalyticsChart({
  data,
  color = "var(--primary)",
  formatValue = (value) => String(value),
  height = 180,
}: AnalyticsChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground"
        style={{ height }}
      >
        No hay datos para este rango.
      </div>
    );
  }

  const values = data.map((point) => point.value);
  const maxValue = Math.max(...values, 1);
  const stepX =
    data.length > 1 ? (CHART_WIDTH - PADDING_X * 2) / (data.length - 1) : 0;

  const points = data.map((point, index) => ({
    ...point,
    x: PADDING_X + index * stepX,
    y:
      height -
      PADDING_Y -
      (point.value / maxValue) * (height - PADDING_Y * 2),
  }));

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - PADDING_Y} L ${points[0].x} ${height - PADDING_Y} Z`;

  const first = data[0];
  const last = data[data.length - 1];

  return (
    <div className="space-y-1">
      <div className="flex justify-end text-xs text-muted-foreground">
        Máximo: {formatValue(maxValue)}
      </div>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
      >
        <line
          x1={PADDING_X}
          y1={height - PADDING_Y}
          x2={CHART_WIDTH - PADDING_X}
          y2={height - PADDING_Y}
          stroke="var(--border)"
          strokeWidth="1"
        />
        <path d={areaPath} fill={color} fillOpacity="0.12" stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" />
        {points.map((point) => (
          <circle key={point.date} cx={point.x} cy={point.y} r="2.5" fill={color} />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{AXIS_DATE_FORMATTER.format(toDate(first.date))}</span>
        <span>{AXIS_DATE_FORMATTER.format(toDate(last.date))}</span>
      </div>
    </div>
  );
}
