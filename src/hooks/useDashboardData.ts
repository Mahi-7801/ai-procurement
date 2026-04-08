import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/config";
import { useAuth } from "@/lib/auth-context";

export function useDashboardData() {
    const { auth } = useAuth();

    const statsQuery = useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/api/tenders/stats/summary`, {
                headers: {
                    'Authorization': `Bearer ${auth.token}`,
                },
            });
            if (!response.ok) throw new Error("Failed to fetch stats");
            return await response.json();
        },
        enabled: !!auth.token,
    });

    const tendersQuery = useQuery({
        queryKey: ["tenders-summary"],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/api/tenders/`, {
                headers: {
                    'Authorization': `Bearer ${auth.token}`,
                },
            });
            if (!response.ok) throw new Error("Failed to fetch tenders");
            const data = await response.json();
            return data.map((t: any) => ({
                id: t.tender_id,
                projectName: t.project_name,
                department: t.department,
                estimatedBudget: t.estimated_budget,
                status: t.status,
                publishedDate: t.published_date,
                closingDate: t.closing_date,
                platform: t.platform || "gem"
            }));
        },
        enabled: !!auth.token,
    });

    const alertsQuery = useQuery({
        queryKey: ["dashboard-alerts"],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/api/risks/all`, {
                headers: {
                    'Authorization': `Bearer ${auth.token}`,
                },
            });
            if (!response.ok) throw new Error("Failed to fetch alerts");
            return await response.json();
        },
        enabled: !!auth.token,
    });

    const summaryData = {
        activeTenders: statsQuery.data?.activeTenders || 0,
        underEvaluation: statsQuery.data?.underEvaluation || 0,
        pendingApprovals: statsQuery.data?.pendingApprovals || 0,
        alerts: alertsQuery.data?.length || 0,
    };

    return {
        tenders: tendersQuery.data || [],
        bids: [],
        alerts: alertsQuery.data || [],
        summaryData,
        isLoading: statsQuery.isLoading || tendersQuery.isLoading || alertsQuery.isLoading,
        error: statsQuery.error || tendersQuery.error || alertsQuery.error,
    };
}
