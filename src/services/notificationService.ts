import { API_BASE_URL } from "@/config";

export interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  resource_type?: string;
  resource_id?: number;
}

export const notificationService = {
  getNotifications: async (token: string): Promise<Notification[]> => {
    const response = await fetch(`${API_BASE_URL}/api/notifications/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error("Failed to fetch notifications");
    return response.json();
  },

  getUnreadCount: async (token: string): Promise<number> => {
    const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error("Failed to fetch unread count");
    const data = await response.json();
    return data.unread_count;
  },

  markAsRead: async (token: string, notificationId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error("Failed to mark notification as read");
  },

  markAllAsRead: async (token: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error("Failed to mark all as read");
  }
};
