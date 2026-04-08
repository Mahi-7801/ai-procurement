export default {
    getDrafts: async (userId?: string) => {
        return [
            { id: '1', title: 'Solar Power Plant', date: '2025-02-10' },
            { id: '2', title: 'Road Construction Package 4', date: '2025-02-08' }
        ];
    },
    uploadDocument: async (file: File, userId: string, type: string) => {
        console.log('Mock uploading document:', file.name);
        return { success: true, id: 'doc_' + Date.now() };
    },
    logAudit: async (userId: string, action: string, resourceId: string | null, details: any) => {
        console.log('Audit Log:', { userId, action, resourceId, details });
        return { success: true };
    }
};
