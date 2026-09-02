import { useEffect, useRef, useState } from "react";

const API_BASE = "/api/notifications";
const POLL_INTERVAL_MS = 30000;

function formatCreatedAt(dateTime) {
  if (!dateTime) return "";
  return dateTime.slice(0, 16).replace("T", " ");
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  const loadUnreadCount = async () => {
    try {
      const response = await fetch(`${API_BASE}/me/unread-count`, {
        credentials: "include",
      });
      if (!response.ok) return;
      const data = await response.json();
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error("알림 개수 조회 오류:", error);
    }
  };

  useEffect(() => {
    loadUnreadCount();
    const timer = setInterval(loadUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openPanel = async () => {
    const next = !open;
    setOpen(next);

    if (!next) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/me`, {
        credentials: "include",
      });

      if (!response.ok) {
        setNotifications([]);
        return;
      }

      const data = await response.json();
      setNotifications(data);

      if (data.some((item) => !item.read)) {
        await fetch(`${API_BASE}/read-all`, {
          method: "POST",
          credentials: "include",
        });
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("알림 목록 조회 오류:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notification-bell" ref={wrapperRef}>
      <button
        type="button"
        className="notification-bell-button"
        onClick={openPanel}
        aria-label="알림"
      >
        <svg
          viewBox="0 0 24 24"
          width="19"
          height="19"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-panel">
          <div className="notification-panel-header">알림</div>

          {loading && (
            <p className="notification-empty">불러오는 중입니다...</p>
          )}

          {!loading && notifications.length === 0 && (
            <p className="notification-empty">알림이 없어요.</p>
          )}

          {!loading && notifications.length > 0 && (
            <ul className="notification-list">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={notification.read ? "" : "unread"}
                >
                  <strong>{notification.title}</strong>
                  <p>{notification.content}</p>
                  <span>{formatCreatedAt(notification.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
