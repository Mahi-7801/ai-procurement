import { useQuery } from "@tanstack/react-query";
import { VendorBid } from "@/lib/mock-data";
import { API_BASE_URL } from "@/config";
import { useAuth } from "@/lib/auth-context";

export function useEvaluations(tenderId?: string) {
    const { auth } = useAuth();

    const evaluationsQuery = useQuery({
        queryKey: ["evaluations", tenderId || "all"],
        queryFn: async () => {
            const url = tenderId 
                ? `${API_BASE_URL}/api/evaluation/tender/${tenderId}/bids`
                : `${API_BASE_URL}/api/evaluation/my-bids`;
                
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${auth.token}`,
                },
            });
            if (!response.ok) throw new Error("Failed to fetch evaluations");
            const data = await response.json();

            return data.map((b: any) => ({
                id: b.id,
                tenderId: b.tenderId,
                projectName: b.projectName,
                vendorName: b.vendorName,
                technicalScore: b.technicalScore,
                financialBid: b.financialBid,
                pastPerformanceRisk: b.pastPerformanceRisk as VendorBid["pastPerformanceRisk"],
                rank: b.rank as VendorBid["rank"],
                complianceStatus: b.technicalCompliance >= 70 ? "Compliant" : "Partial",
                technicalDocumentPath: b.technicalDocumentPath,
                financialDocumentPath: b.financialDocumentPath,
                eligibilityScore: b.eligibilityScore,
                experienceScore: b.experienceScore,
                specsScore: b.specsScore,
                docsScore: b.docsScore,
                financialScore: b.financialEvaluation,
                finalScore: b.finalScore,
                isL1: b.isL1,
                aiAnalysis: b.aiAnalysis,
                status: b.status,
                submissionDurationMs: b.submissionDurationMs,
                submittedAt: b.submittedAt
            })) as (VendorBid & { 
                id: number,
                tenderId?: string,
                projectName?: string,
                complianceStatus: string, 
                technicalDocumentPath?: string, 
                financialDocumentPath?: string,
                eligibilityScore?: number,
                experienceScore?: number,
                specsScore?: number,
                docsScore?: number,
                financialScore?: number,
                finalScore?: number,
                aiAnalysis?: any,
                status?: string,
                submissionDurationMs?: number,
                submittedAt?: string
            })[];
        },
        enabled: !!auth.token,
    });

    return {
        bids: evaluationsQuery.data || [],
        isLoading: evaluationsQuery.isLoading,
        error: evaluationsQuery.error,
    };
}
