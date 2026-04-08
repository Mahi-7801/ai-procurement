import { vendorBids } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const chartData = vendorBids.map((v) => ({
  name: v.vendorName.split(" ")[0],
  "Technical Score": v.technicalScore,
  "Financial Bid (₹L)": Math.round(v.financialBid / 100000),
}));

export default function ComparisonChart() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Vendor Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar dataKey="Technical Score" fill="hsl(var(--gov-blue))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Financial Bid (₹L)" fill="hsl(var(--gov-green))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
