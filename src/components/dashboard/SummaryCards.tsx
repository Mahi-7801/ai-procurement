import { FileText, Search, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function SummaryCards() {
  const { summaryData, isLoading } = useDashboardData();

  const cards = [
    {
      label: "Active Tenders",
      value: summaryData.activeTenders,
      icon: FileText,
      colorClass: "text-gov-blue bg-gov-blue/10",
    },
    {
      label: "Under Evaluation",
      value: summaryData.underEvaluation,
      icon: Search,
      colorClass: "text-gov-yellow bg-gov-yellow/10",
    },
    {
      label: "Pending Approvals",
      value: summaryData.pendingApprovals,
      icon: Clock,
      colorClass: "text-gov-orange bg-gov-orange/10",
    },
    {
      label: "Alerts",
      value: summaryData.alerts,
      icon: AlertTriangle,
      colorClass: "text-gov-red bg-gov-red/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-xl" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="shadow-sm border-slate-100 overflow-hidden">
          <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${c.colorClass}`}>
              <c.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{c.value}</p>
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">{c.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
