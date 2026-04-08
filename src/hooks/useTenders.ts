import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tender } from "@/lib/mock-data";
export type { Tender };
import { API_BASE_URL } from "@/config";
import { useAuth } from "@/lib/auth-context";

export function useTenders() { 
    const queryClient = useQueryClient();
    const { auth } = useAuth();

    const tendersQuery = useQuery({
        queryKey: ["tenders"],
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
                db_id: t.id,
                projectName: t.project_name,
                department: t.department,
                estimatedBudget: t.estimated_budget,
                status: t.status as Tender["status"],
                publishedDate: t.published_date,
                closingDate: t.closing_date,
                platform: t.platform || "gem",
                description: t.description
            })) as Tender[];
        },
        enabled: !!auth.token,
    });

    const createTenderMutation = useMutation({
        mutationFn: async (newTender: Omit<Tender, "id">) => {
            const response = await fetch(`${API_BASE_URL}/api/tenders/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    project_name: newTender.projectName,
                    department: newTender.department,
                    estimated_budget: newTender.estimatedBudget,
                    description: newTender.description,
                    closing_date: newTender.closingDate,
                }),
            });
            if (!response.ok) throw new Error("Failed to create tender");
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tenders"] });
        },
    });

    const updateTenderMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: Partial<Tender> }) => {
            const response = await fetch(`${API_BASE_URL}/api/tenders/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    project_name: data.projectName,
                    department: data.department,
                    estimated_budget: data.estimatedBudget,
                    description: data.description,
                    status: data.status,
                    closing_date: data.closingDate,
                }),
            });
            if (!response.ok) throw new Error("Failed to update tender");
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tenders"] });
        },
    });

    const deleteTenderMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`${API_BASE_URL}/api/tenders/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${auth.token}`,
                },
            });
            if (!response.ok) {
                let message = "Failed to delete tender";
                try {
                    const err = await response.json();
                    if (err?.detail) message = err.detail;
                } catch (_) {}
                throw new Error(message);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tenders"] });
        },
    });

    return {
        tenders: tendersQuery.data || [],
        isLoading: tendersQuery.isLoading,
        error: tendersQuery.error,
        createTender: createTenderMutation.mutateAsync,
        updateTender: updateTenderMutation.mutateAsync,
        deleteTender: deleteTenderMutation.mutateAsync,
    };
}
