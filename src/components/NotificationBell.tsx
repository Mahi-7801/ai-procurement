import { useState, useEffect, useCallback } from "react";
import { Bell, Check, Mail, BellOff, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { notificationService, Notification } from "@/services/notificationService";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationBell() {
  const { auth } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!auth.token) return;
    try {
      const [list, count] = await Promise.all([
        notificationService.getNotifications(auth.token),
        notificationService.getUnreadCount(auth.token)
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [auth.token]);

  useEffect(() => {
    fetchNotifications();
    // Refresh unread count every 30 seconds
    const interval = setInterval(() => {
      if (!isOpen) { // Only fetch in background if popover is closed
        notificationService.getUnreadCount(auth.token || "").then(count => setUnreadCount(count)).catch(() => {});
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, isOpen, auth.token]);

  const handleMarkAsRead = async (id: number) => {
    if (!auth.token) return;
    try {
      await notificationService.markAsRead(auth.token, id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!auth.token) return;
    try {
      await notificationService.markAllAsRead(auth.token);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // Trigger fetch when opening popover
  const onToggle = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      fetchNotifications();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={onToggle}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-slate-100 transition-colors duration-200"
          aria-label="Notifications"
        >
          <motion.div
            animate={unreadCount > 0 ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
            transition={{ repeat: Infinity, duration: 2, repeatDelay: 5 }}
          >
            <Bell className="h-5 w-5 text-slate-600" />
          </motion.div>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <Badge 
                className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white border-0 flex items-center justify-center p-0 text-[10px] font-black"
                variant="destructive"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-2xl border-slate-200 overflow-hidden rounded-xl" align="end">
        <div className="bg-white border-b border-slate-100 p-4 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-0 text-[10px] px-1.5 py-0">
                {unreadCount} New
              </Badge>
            )}
          </h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[11px] font-bold text-blue-600 h-auto p-0 hover:bg-transparent hover:text-blue-700" 
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[350px]">
          {isLoading ? (
             <div className="flex flex-col items-center justify-center h-full p-8 space-y-3">
               <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-xs text-slate-400 font-medium tracking-tight">Refreshing...</p>
             </div>
          ) : notifications.length > 0 ? (
            <div className="flex flex-col divide-y divide-slate-50">
              <AnimatePresence initial={false}>
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "p-4 flex gap-3 transition-colors hover:bg-slate-50 relative group",
                      !notification.is_read && "bg-blue-50/30"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full shrink-0 flex items-center justify-center shadow-sm",
                      notification.is_read ? "bg-slate-100 text-slate-400" : "bg-blue-100 text-blue-600"
                    )}>
                      {notification.title.toLowerCase().includes('reset') ? <BellOff className="w-5 h-5"/> : <Mail className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className={cn(
                          "text-[13px] leading-tight truncate pr-2",
                          notification.is_read ? "text-slate-600 font-medium" : "text-slate-900 font-bold"
                        )}>
                          {notification.title}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap shrink-0">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className={cn(
                        "text-[11px] leading-relaxed break-words",
                        notification.is_read ? "text-slate-500" : "text-slate-700"
                      )}>
                        {notification.message}
                      </p>
                      
                      {!notification.is_read && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 h-7 w-7 transition-opacity duration-200"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Check className="h-3 w-3 text-blue-600" />
                        </Button>
                      )}
                    </div>
                    {!notification.is_read && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-3 rounded-full bg-blue-500" />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                <Bell className="h-8 w-8 text-slate-200" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">All caught up!</p>
                <p className="text-xs text-slate-500 mt-1">No notifications to show right now.</p>
              </div>
            </div>
          )}
        </ScrollArea>
        <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
          <Button variant="ghost" className="text-[11px] font-bold text-slate-500 hover:bg-white hover:text-slate-700 h-8 w-full rounded-lg">
            View all history
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
