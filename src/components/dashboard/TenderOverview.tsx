import { useDashboardData } from "@/hooks/useDashboardData";
import { Tender } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Eye } from "lucide-react";

const statusColor: Record<string, string> = {
  Active: "bg-gov-green/15 text-gov-green border-gov-green/30",
  "Under Evaluation": "bg-gov-yellow/15 text-gov-yellow border-gov-yellow/30",
  "Pending Approval": "bg-gov-orange/15 text-gov-orange border-gov-orange/30",
  Closed: "bg-muted text-muted-foreground border-border",
};

function formatCurrency(val: number) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
}

export default function TenderOverview() {
  const { tenders, isLoading } = useDashboardData();

  if (isLoading) return <div className="h-64 bg-slate-50 animate-pulse rounded-xl" />;
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Tender Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tenders.map((t) => (
          <div key={t.id} className="p-3 rounded-lg border border-border bg-background space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-mono text-muted-foreground">{t.id}</p>
                <p className="text-sm font-semibold text-foreground leading-tight">{t.projectName}</p>
                <p className="text-xs text-muted-foreground">{t.department}</p>
              </div>
              <Badge variant="outline" className={`text-[10px] shrink-0 ${statusColor[t.status]}`}>
                {t.status}
              </Badge>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {formatCurrency(t.estimatedBudget)}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs h-7">
                <FileText className="w-3 h-3 mr-1" />
                Document
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-7">
                <Eye className="w-3 h-3 mr-1" />
                Bids
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
