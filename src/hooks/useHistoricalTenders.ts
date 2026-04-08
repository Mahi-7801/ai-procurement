import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";

export interface HistoricalBid {
    id: number;
    bid_number: string;
    title: string;
    bid_type: "SERVICE" | "PRODUCT";
    category: string;
    keywords: string;
    ministry: string;
    department: string;
    organisation: string;
    estimated_value: number;
    emd_amount: number;
    epbg_percent: number;
    contract_period: string;
    validity_days: number;
    experience_years: number;
    turnover_percent: number;
    ld_percent: number;
    security_deposit: number;
    standard_clauses: string;
    pdf_filename: string;
    data_source: string;
    template_data: any;
    created_at: string;
}

const API_BASE_URL_INTERNAL = `http://localhost:8000/api/historical`;

export function useHistoricalTenders(query?: string, category?: string) {
    const { auth } = useAuth();

    return useQuery({
        queryKey: ["historical-tenders", query, category],
        queryFn: async () => {
            let url: string;
            if (query && query.length >= 2) {
                url = `${API_BASE_URL_INTERNAL}/search?query=${encodeURIComponent(query)}`;
            } else if (category && category !== "All Categories") {
                url = `${API_BASE_URL_INTERNAL}/tenders?category=${encodeURIComponent(category)}`;
            } else {
                url = `${API_BASE_URL_INTERNAL}/tenders`;
            }

            const response = await fetch(url, {
                headers: {
                    "Authorization": `Bearer ${auth.token || ""}`
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch historical tenders");
            }

            return await response.json() as HistoricalBid[];
        },
        staleTime: 1000 * 60 * 5,
        enabled: true,
    });
}
