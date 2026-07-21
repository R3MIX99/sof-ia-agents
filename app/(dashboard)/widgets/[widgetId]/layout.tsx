import { WidgetDetailProvider } from "@/context/widget-detail-context";
import { WidgetDetailHeader } from "@/components/dashboard/widget-detail-header";
import { WidgetDetailTabs } from "@/components/dashboard/widget-detail-tabs";
import { WidgetTestChat } from "@/components/shared/widget-test-chat";

export default async function WidgetDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ widgetId: string }>;
}) {
  const { widgetId } = await params;

  return (
    <WidgetDetailProvider widgetId={widgetId}>
      <div className="space-y-6">
        <WidgetDetailHeader />
        <WidgetDetailTabs widgetId={widgetId} />
        {children}
      </div>
      <WidgetTestChat />
    </WidgetDetailProvider>
  );
}
