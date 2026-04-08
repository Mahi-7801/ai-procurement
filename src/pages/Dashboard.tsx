import SummaryCards from "@/components/dashboard/SummaryCards";
import TenderOverview from "@/components/dashboard/TenderOverview";
import BidEvaluation from "@/components/dashboard/BidEvaluation";
import RiskPanel from "@/components/dashboard/RiskPanel";
import ComparisonChart from "@/components/dashboard/ComparisonChart";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import ProcurementOfficerDashboard from "@/components/dashboard/ProcurementOfficerDashboard";
import EvaluationCommitteeDashboard from "@/components/dashboard/EvaluationCommitteeDashboard";
import ApprovingAuthorityDashboard from "@/components/dashboard/ApprovingAuthorityDashboard";
import RTGSAuditorDashboard from "@/components/dashboard/RTGSAuditorDashboard";
import VendorDashboard from "@/components/dashboard/VendorDashboard";
import InternalVigilanceDashboard from "@/components/dashboard/InternalVigilanceDashboard";

export default function Dashboard() {
  const { auth } = useAuth();

  // Role-based Rendering
  if (auth.role === "ADMIN" || auth.role === "APPROVING_AUTHORITY") {
    return <ApprovingAuthorityDashboard />;
  }

  if (auth.role === "PROCUREMENT_OFFICER") {
    return <ProcurementOfficerDashboard />;
  }

  if (auth.role === "VENDOR") {
    return <VendorDashboard />;
  }

  if (auth.role === "EVALUATION_COMMITTEE") {
    return <EvaluationCommitteeDashboard />;
  }

  if (auth.role === "RTGS_AUDITOR") {
    return <RTGSAuditorDashboard />;
  }

  if (auth.role === "INTERNAL_VIGILANCE") {
    return <InternalVigilanceDashboard />;
  }


  // Fallback for other roles (to be implemented)
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-foreground">Government Dashboard</h1>
        <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider">
          {(auth.role as string).replace("_", " ")} View
        </p>
      </div>

      <SummaryCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Tender Overview */}
        <div className="lg:col-span-1">
          <TenderOverview />
        </div>

        {/* Center: Bid Evaluation + Chart */}
        <div className="lg:col-span-1 space-y-6">
          <BidEvaluation />
          <ComparisonChart />
        </div>

        {/* Right: Risk Panel */}
        <div className="lg:col-span-1">
          <RiskPanel />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button className="bg-gov-blue hover:bg-gov-blue-dark text-primary-foreground">
          <FileText className="w-4 h-4 mr-2" />
          Generate Evaluation Report
        </Button>
        <Button className="bg-gov-green hover:bg-gov-green/90 text-primary-foreground">
          <CheckCircle className="w-4 h-4 mr-2" />
          Approve & Finalize
        </Button>
      </div>
    </div>
  );
}
