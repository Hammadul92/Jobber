import { useCallback, useEffect, useRef, useState } from "react";

export default function useNotifications(api, userId) {
  const [feed, setFeed] = useState({
    results: [],
    unread_count: 0,
    through: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const generation = useRef(0);
  const mounted = useRef(false);
  const pendingRef = useRef(false);
  const invalidate = useCallback(() => {
    ++generation.current;
  }, []);
  const refresh = useCallback(async () => {
    if (pendingRef.current) return;
    const current = ++generation.current;
    try {
      const data = await api("notifications/");
      if (mounted.current && current === generation.current) {
        setFeed(data);
        setError("");
      }
    } catch (e) {
      if (mounted.current && current === generation.current)
        setError(e.message);
    } finally {
      if (mounted.current && current === generation.current) setLoading(false);
    }
  }, [api]);
  useEffect(() => {
    mounted.current = true;
    setFeed({ results: [], unread_count: 0, through: 0 });
    setLoading(true);
    refresh();
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, 30000);
    const focus = () => refresh();
    window.addEventListener("focus", focus);
    return () => {
      mounted.current = false;
      invalidate();
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [refresh, userId, invalidate]);
  const read = async (id) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    const current = ++generation.current;
    try {
      const data = await api("notifications/", {
        method: "POST",
        body: JSON.stringify(
          id === undefined
            ? { operation: "read_all", through: feed.through }
            : { operation: "read", id },
        ),
      });
      if (mounted.current && current === generation.current) {
        setFeed(data);
        setError("");
      }
    } catch (e) {
      if (mounted.current && current === generation.current)
        setError(e.message);
    } finally {
      pendingRef.current = false;
      if (mounted.current && current === generation.current) setPending(false);
    }
  };
  return {
    notifications: feed.results.map((item) => ({
      ...item,
      time: new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: localStorage.getItem("super-admin-timezone") || "UTC",
      }).format(new Date(item.created_at)),
    })),
    notificationsUnreadCount: feed.unread_count,
    notificationsLoading: loading,
    notificationsError: error,
    notificationsReadPending: pending,
    onNotificationRead: read,
    onNotificationsReadAll: () => read(),
    onNotificationsOpen: refresh,
  };
}
