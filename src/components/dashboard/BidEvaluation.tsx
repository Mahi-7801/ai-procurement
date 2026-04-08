import { VendorBid } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDashboardData } from "@/hooks/useDashboardData";

const rankColor: Record<string, string> = {
  L1: "bg-gov-green text-primary-foreground",
  L2: "bg-gov-yellow text-primary-foreground",
  L3: "bg-gov-red-light text-primary-foreground",
};

const riskColor: Record<string, string> = {
  Low: "text-gov-green",
  Medium: "text-gov-yellow",
  High: "text-gov-red",
};

export default function BidEvaluation() {
  const { bids, isLoading } = useDashboardData();

  if (isLoading) return <div className="h-96 bg-slate-50 animate-pulse rounded-xl" />;
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Bid Evaluation Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Vendor Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Vendor</TableHead>
                <TableHead className="text-xs text-center">Tech Score</TableHead>
                <TableHead className="text-xs text-right">Financial Bid</TableHead>
                <TableHead className="text-xs text-center">Rank</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bids.map((v) => (
                <TableRow key={v.vendorName}>
                  <TableCell className="text-sm font-medium">{v.vendorName}</TableCell>
                  <TableCell className="text-sm text-center">{v.technicalScore}</TableCell>
                  <TableCell className="text-sm text-right">₹{(v.financialBid / 100000).toFixed(1)}L</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`text-xs ${rankColor[v.rank]}`}>{v.rank}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Detailed Analysis */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Detailed Analysis</h4>
          <div className="space-y-4">
            {bids.map((v) => (
              <div key={v.vendorName} className="p-3 rounded-lg border border-border bg-background space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{v.vendorName}</p>
                  <Badge className={`text-xs ${rankColor[v.rank]}`}>{v.rank}</Badge>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Technical Compliance</span>
                    <span className="font-medium">{v.technicalCompliance}%</span>
                  </div>
                  <Progress value={v.technicalCompliance} className="h-2" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Financial Evaluation</span>
                    <span className="font-medium">{v.financialEvaluation}%</span>
                  </div>
                  <Progress value={v.financialEvaluation} className="h-2" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Past Performance Risk</span>
                  <span className={`font-medium ${riskColor[v.pastPerformanceRisk]}`}>
                    {v.pastPerformanceRisk}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
