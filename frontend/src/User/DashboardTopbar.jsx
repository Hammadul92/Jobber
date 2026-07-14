import { useEffect, useMemo, useRef, useState } from "react";
import { LuBell, LuMessageSquare, LuSearch } from "react-icons/lu";

const getFirstName = (user) => {
  const displayName =
    user?.name ||
    user?.full_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    "User";

  return displayName.split(" ")[0] || "User";
};

function DashboardTopbar({ user, notifications = [] }) {
  const firstName = getFirstName(user);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState(new Set());
  const dropdownRef = useRef(null);
  const notificationStorageKey = `contractorz:dashboard-notifications:${user?.id || user?.email || "guest"}`;

  const notificationsWithReadState = useMemo(
    () =>
      notifications.map((notification) => ({
        ...notification,
        isRead: readNotificationIds.has(notification.id),
      })),
    [notifications, readNotificationIds],
  );

  const unreadCount = notificationsWithReadState.filter(
    (notification) => !notification.isRead,
  ).length;
  const unreadNotifications = notificationsWithReadState.filter(
    (notification) => !notification.isRead,
  );

  const saveReadNotificationIds = (ids) => {
    try {
      localStorage.setItem(notificationStorageKey, JSON.stringify([...ids]));
    } catch {
      // Keep the dropdown usable if storage is unavailable.
    }
  };

  const markNotificationAsRead = (id) => {
    setReadNotificationIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(id);
      saveReadNotificationIds(nextIds);
      return nextIds;
    });
  };

  const markAllNotificationsAsRead = () => {
    setReadNotificationIds((currentIds) => {
      const nextIds = new Set(currentIds);
      notifications.forEach((notification) => nextIds.add(notification.id));
      saveReadNotificationIds(nextIds);
      return nextIds;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    try {
      const storedIds = JSON.parse(
        localStorage.getItem(notificationStorageKey) || "[]",
      );
      setReadNotificationIds(new Set(Array.isArray(storedIds) ? storedIds : []));
    } catch {
      setReadNotificationIds(new Set());
    }
  }, [notificationStorageKey]);

  return (
    <div className="w-full px-4 py-5 bg-white border-b border-gray-200 md:px-12 lg:px-12 lg:pr-14">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight md:text-3xl text-primary">
            Dashboard
          </h1>
          <p className="mt-1 text-base text-slate-500">
            Welcome back, {firstName}. Here&apos;s an overview of your
            business.
          </p>
        </div>

        <div className="flex items-center self-start gap-3 lg:self-center">
          {/* <label className="relative hidden md:block">
            <LuSearch className="absolute w-5 h-5 -translate-y-1/2 pointer-events-none left-4 top-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search..."
              className="h-12 pl-12 pr-4 text-base transition bg-white border border-gray-200 outline-none w-72 rounded-2xl text-slate-700 focus:border-accent"
            />
          </label> */}

          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              aria-label="Notifications"
              aria-expanded={isNotificationsOpen}
              onClick={() => setIsNotificationsOpen((current) => !current)}
              className="relative inline-flex items-center justify-center transition h-11 w-11 rounded-xl text-slate-500 hover:bg-gray-100 hover:text-slate-700"
            >
              <LuBell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 z-40 mt-3 min-w-80 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-4 py-4">
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      Notifications
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={markAllNotificationsAsRead}
                    disabled={!unreadCount}
                    className="mt-0.5 text-xs font-medium text-accent transition hover:text-orange-700 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    Mark all as read
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto p-3">
                  {unreadNotifications.length ? (
                    <div className="space-y-1">
                      {unreadNotifications.map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-3 rounded-2xl bg-orange-50/60 px-3 py-3 transition hover:bg-orange-50/70"
                        >
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />
                          <div className="min-w-0 w-full">
                            <div className="flex items-start justify-between gap-3">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {item.title}
                              </p>
                              <p className="shrink-0 text-xs text-slate-400">
                                {item.time}
                              </p>
                            </div>
                            <p className="mt-0.5 text-sm text-slate-600">
                              {item.description}
                            </p>
                            <div className="mt-2 flex items-center justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => markNotificationAsRead(item.id)}
                                className="text-xs font-medium text-accent transition hover:text-orange-700"
                              >
                                Mark as read
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                      No unread notifications.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* <button
            type="button"
            aria-label="Messages"
            className="inline-flex items-center justify-center transition h-11 w-11 rounded-xl text-slate-500 hover:bg-gray-100 hover:text-slate-700"
          >
            <LuMessageSquare className="w-6 h-6" />
          </button> */}
        </div>
      </div>
    </div>
  );
}

export default DashboardTopbar;
