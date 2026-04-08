export const localAuth = {
    getCurrentUser: async () => {
        // Mock user for development
        return {
            data: {
                user: {
                    id: 'dev-user-id',
                    email: 'dev@example.com',
                    role: 'procurement_officer'
                }
            },
            error: null
        };
    }
};
