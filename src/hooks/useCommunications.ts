import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/config";
import { useAuth } from "@/lib/auth-context";

export interface Communication {
    id: string;
    tender_id: number;
    tender_ref: string;
    communication_type: string;
    from_user?: string;
    from_role?: string;
    to_role?: string;
    subject: string;
    message: string;
    sent_at: string;
    read_at?: string | null;
    requires_action: boolean;
    action_taken: boolean;
    priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    status: string;
}

export function useCommunications() {
    const queryClient = useQueryClient();
    const { auth } = useAuth();

    const inboxQuery = useQuery({
        queryKey: ["communications", "inbox"],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/api/communications/inbox`, {
                headers: {
                    'Authorization': `Bearer ${auth.token}`,
                },
            });
            if (!response.ok) throw new Error("Failed to fetch inbox");
            return await response.json() as Communication[];
        },
        enabled: !!auth.token,
    });

    const sentQuery = useQuery({
        queryKey: ["communications", "sent"],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/api/communications/sent`, {
                headers: {
                    'Authorization': `Bearer ${auth.token}`,
                },
            });
            if (!response.ok) throw new Error("Failed to fetch sent items");
            return await response.json() as Communication[];
        },
        enabled: !!auth.token,
    });

    const sendMessage = useMutation({
        mutationFn: async (message: Omit<Communication, "id" | "sent_at">) => {
            const response = await fetch(`${API_BASE_URL}/api/communications/send`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.token}`,
                },
                body: JSON.stringify(message),
            });
            if (!response.ok) throw new Error("Failed to send message");
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["communications"] });
        },
    });

    const markAsRead = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`${API_BASE_URL}/api/communications/${id}/read`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${auth.token}`,
                },
            });
            if (!response.ok) throw new Error("Failed to mark as read");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["communications"] });
        },
    });

    const takeAction = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`${API_BASE_URL}/api/communications/${id}/action`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${auth.token}`,
                },
            });
            if (!response.ok) throw new Error("Failed to take action");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["communications"] });
        },
    });

    return {
        inbox: inboxQuery.data || [],
        sent: sentQuery.data || [],
        isLoading: inboxQuery.isLoading || sentQuery.isLoading,
        sendMessage,
        markAsRead,
        takeAction
    };
}
