"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { apiFetch, ApiClientError } from "@/lib/http/api-client";
import type { Widget } from "@/domain/entities/widget.entity";
import type { AnalyticsDailyMetric } from "@/domain/entities/analytics-daily.entity";
import type { AnalyticsSummary, RatingFeedbackItem } from "@/services/analytics/analytics.service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnalyticsChart } from "@/components/shared/analytics-chart";
import { PlaceholderScreen } from "@/components/shared/placeholder-screen";

interface AnalyticsResponse {
  summary: AnalyticsSummary;
  metrics: AnalyticsDailyMetric[];
  ratings: RatingFeedbackItem[];
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function defaultDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
}

const DATE_FORMATTER = new Intl.DateTimeFormat("es-419", { dateStyle: "medium" });

export default function AnaliticasPage() {
  const { activeOrganization, isLoading: isOrgLoading } =
    useActiveOrganization();

  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string>("");
  const [{ startDate, endDate }, setDateRange] = useState(defaultDateRange);

  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [isLoadingWidgets, setIsLoadingWidgets] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeOrganization) return;
    setIsLoadingWidgets(true);
    apiFetch<{ widgets: Widget[] }>(
      `/api/v1/widgets?organizationId=${activeOrganization.id}`,
    )
      .then(({ widgets: loaded }) => {
        setWidgets(loaded);
        setSelectedWidgetId((current) => current || loaded[0]?.id || "");
      })
      .finally(() => setIsLoadingWidgets(false));
  }, [activeOrganization]);

  useEffect(() => {
    if (!selectedWidgetId) return;
    setIsLoadingAnalytics(true);
    setError(null);
    apiFetch<AnalyticsResponse>(
      `/api/v1/analytics?widgetId=${selectedWidgetId}&startDate=${startDate}&endDate=${endDate}`,
    )
      .then(setData)
      .catch((err) => {
        setError(
          err instanceof ApiClientError
            ? err.message
            : "No se pudieron cargar las analíticas.",
        );
      })
      .finally(() => setIsLoadingAnalytics(false));
  }, [selectedWidgetId, startDate, endDate]);

  const conversationSeries = useMemo(
    () =>
      (data?.metrics ?? []).map((m) => ({
        date: m.date,
        value: m.conversationsCount,
      })),
    [data],
  );
  const uniqueUsersSeries = useMemo(
    () =>
      (data?.metrics ?? []).map((m) => ({ date: m.date, value: m.uniqueUsers })),
    [data],
  );
  const responseTimeSeries = useMemo(
    () =>
      (data?.metrics ?? []).map((m) => ({
        date: m.date,
        value: m.avgResponseTimeMs,
      })),
    [data],
  );
  const errorsSeries = useMemo(
    () =>
      (data?.metrics ?? []).map((m) => ({ date: m.date, value: m.errorsCount })),
    [data],
  );

  if (!isOrgLoading && !activeOrganization) {
    return (
      <PlaceholderScreen
        title="Analíticas"
        description="Crea o selecciona una organización para ver sus analíticas."
        icon={BarChart3}
      />
    );
  }

  if (!isLoadingWidgets && widgets.length === 0) {
    return (
      <PlaceholderScreen
        title="Analíticas"
        description="Crea un widget para empezar a ver sus métricas de uso y desempeño."
        icon={BarChart3}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Analíticas</h1>
        <p className="text-sm text-muted-foreground">
          Métricas de uso y desempeño por widget y rango de fechas.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label>Widget</Label>
          <Select value={selectedWidgetId} onValueChange={setSelectedWidgetId}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {widgets.map((widget) => (
                <SelectItem key={widget.id} value={widget.id}>
                  {widget.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="analytics-start-date">Desde</Label>
          <Input
            id="analytics-start-date"
            type="date"
            value={startDate}
            max={endDate}
            onChange={(event) =>
              setDateRange((current) => ({
                ...current,
                startDate: event.target.value,
              }))
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="analytics-end-date">Hasta</Label>
          <Input
            id="analytics-end-date"
            type="date"
            value={endDate}
            min={startDate}
            max={toIsoDate(new Date())}
            onChange={(event) =>
              setDateRange((current) => ({
                ...current,
                endDate: event.target.value,
              }))
            }
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoadingAnalytics && (
        <p className="text-sm text-muted-foreground">Cargando analíticas...</p>
      )}

      {!isLoadingAnalytics && data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Conversaciones" value={data.summary.totalConversations} />
            <SummaryCard label="Usuarios únicos" value={data.summary.totalUniqueUsers} />
            <SummaryCard
              label="Tiempo de respuesta promedio"
              value={`${data.summary.avgResponseTimeMs} ms`}
            />
            <SummaryCard label="Errores" value={data.summary.totalErrors} />
            <SummaryCard label="Mensajes enviados" value={data.summary.totalMessagesSent} />
            <SummaryCard label="Mensajes recibidos" value={data.summary.totalMessagesReceived} />
            <SummaryCard label="Tokens de entrada" value={data.summary.totalTokensInput} />
            <SummaryCard label="Tokens de salida" value={data.summary.totalTokensOutput} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Conversaciones por día</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart data={conversationSeries} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Usuarios únicos por día</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart data={uniqueUsersSeries} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tiempo de respuesta promedio (ms)</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  data={responseTimeSeries}
                  formatValue={(v) => `${v} ms`}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Errores por día</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart data={errorsSeries} color="var(--destructive)" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Calificaciones y retroalimentación</CardTitle>
            </CardHeader>
            <CardContent>
              {data.ratings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay calificaciones registradas en este rango.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.ratings.map((rating) => (
                    <div
                      key={rating.conversationId}
                      className="rounded-md border border-border p-3 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">
                          {rating.visitorName ?? "Visitante anónimo"} ·{" "}
                          {rating.rating}/5
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {DATE_FORMATTER.format(new Date(rating.startedAt))}
                        </span>
                      </div>
                      {rating.feedbackText && (
                        <p className="mt-1 text-muted-foreground italic">
                          &ldquo;{rating.feedbackText}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
