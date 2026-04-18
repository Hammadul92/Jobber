import React, { useEffect, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import {
  AiOutlineInfoCircle,
  AiOutlineCheckCircle,
  AiOutlineExclamationCircle,
} from "react-icons/ai";

/**
 * Reusable alert component for displaying backend messages.
 *
 * Props:
 * - type: 'success' | 'error' | 'info' — controls alert color
 * - message: string | object | array — handles Django REST / API response formats
 * - autoDismiss: number (optional, milliseconds) — auto-closes after this time
 * - onClose: function (optional) — callback triggered when alert is dismissed
 */
export default function AlertDispatcher({
  type = "error",
  message,
  autoDismiss,
  onClose,
}) {
  const [visible, setVisible] = useState(true);

  const duration = autoDismiss ?? 5000;

  useEffect(() => {
    setVisible(true);

    if (duration) {
      const timer = setTimeout(() => handleClose(), duration);
      return () => clearTimeout(timer);
    }
  }, [message, type, duration]);

  if (!visible || !message) return null;

  const variants = {
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-800",
      accent: "bg-emerald-500",
    },
    danger: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      accent: "bg-red-500",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      accent: "bg-blue-500",
    },
  };

  const { bg, border, text, accent } = variants[type] || variants.info;

  const renderMessage = () => {
    if (Array.isArray(message)) {
      return message.map((msg, i) => <div key={i}>{msg}</div>);
    } else if (typeof message === "object") {
      return Object.entries(message).map(([key, val]) => (
        <div key={key}>
          <strong>{key}:</strong>{" "}
          {Array.isArray(val) ? val.join(", ") : String(val)}
        </div>
      ));
    } else if (typeof message === "string") {
      return <div>{message}</div>;
    } else {
      return <div>Unknown response format.</div>;
    }
  };

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  let Icon;
  if (type === "success") Icon = AiOutlineCheckCircle;
  else if (type === "danger" || type === "error")
    Icon = AiOutlineExclamationCircle;
  else Icon = AiOutlineInfoCircle;

  return (
    <div
      className="fixed top-4 right-4 z-50 flex justify-end px-4"
      role="presentation"
    >
      <div
        className={`relative flex w-full max-w-sm gap-3 rounded-lg border ${border} ${bg} p-4 text-sm shadow-lg transition`}
        role="alert"
      >
        <Icon className={`flex-shrink-0 ${text}`} size={18} />
        <div className={`flex-1 space-y-1 ${text}`}>{renderMessage()}</div>
        <button
          type="button"
          className="text-gray-400 transition hover:text-gray-600"
          aria-label="Close"
          onClick={handleClose}
        >
          <AiOutlineClose size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
