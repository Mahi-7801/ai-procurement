import { RiskAlert } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldAlert, Users, FileWarning } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";

const levelColor: Record<string, string> = {
  HIGH: "bg-gov-red/15 text-gov-red border-gov-red/30",
  MEDIUM: "bg-gov-yellow/15 text-gov-yellow border-gov-yellow/30",
  LOW: "bg-gov-blue/15 text-gov-blue border-gov-blue/30",
};

const typeIcon: Record<string, typeof AlertTriangle> = {
  LOW_BID: AlertTriangle,
  COLLUSION: Users,
  SINGLE_BID: ShieldAlert,
  COMPLIANCE: FileWarning,
};

const typeLabel: Record<string, string> = {
  LOW_BID: "Low Bid Alert",
  COLLUSION: "Collusion Risk",
  SINGLE_BID: "Single-Bid Concern",
  COMPLIANCE: "Compliance Issue",
};

export default function RiskPanel() {
  const { alerts, isLoading } = useDashboardData();

  if (isLoading) return <div className="h-64 bg-slate-50 animate-pulse rounded-xl" />;
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Risk & Anomalies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert: any, i: number) => {
          const Icon = typeIcon[alert.type] || AlertTriangle;
          return (
            <div key={i} className="p-3 rounded-lg border border-border bg-background space-y-2">
              <div className="flex items-start gap-2">
                <Icon className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{typeLabel[alert.type]}</p>
                    <Badge variant="outline" className={`text-[10px] ${levelColor[alert.level]}`}>
                      {alert.level}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground mt-1">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    <span className="font-medium">AI Explanation: </span>
                    {alert.explanation}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
