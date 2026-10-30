import { useCallback, useEffect, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import {
  AiOutlineInfoCircle,
  AiOutlineCheckCircle,
  AiOutlineExclamationCircle,
} from "react-icons/ai";

const VARIANTS = {
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800",
    Icon: AiOutlineCheckCircle,
  },
  danger: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    Icon: AiOutlineExclamationCircle,
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    Icon: AiOutlineInfoCircle,
  },
};
VARIANTS.error = VARIANTS.danger;

const renderMessage = (message) => {
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
  }
  return <div>Unknown response format.</div>;
};

/**
 * One alert box for backend messages. Closes itself after autoDismiss ms
 * (default 5000; 0 keeps it open) by calling onClose.
 *
 * - type: 'success' | 'danger' | 'error' | 'info'
 * - message: string | object | array (Django REST error formats)
 */
export function Alert({ type = "error", message, autoDismiss, onClose }) {
  const duration = autoDismiss ?? 5000;

  useEffect(() => {
    if (!duration || !onClose) return undefined;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, type, duration, onClose]);

  const { bg, border, text, Icon } = VARIANTS[type] || VARIANTS.info;

  return (
    <div
      className={`pointer-events-auto relative flex w-full gap-3 rounded-lg border ${border} ${bg} p-4 text-sm shadow-lg transition`}
      role="alert"
    >
      <Icon className={`shrink-0 ${text}`} size={18} />
      <div className={`flex-1 space-y-1 ${text}`}>{renderMessage(message)}</div>
      <button
        type="button"
        className="text-gray-400 transition hover:text-gray-600"
        aria-label="Close"
        onClick={onClose}
      >
        <AiOutlineClose size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

// Top-right corner stack that every alert is placed in.
export function AlertStack({ children }) {
  return (
    <div className="pointer-events-none fixed top-4 right-4 z-9999 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
      {children}
    </div>
  );
}

// A single alert rendered on its own. Pages normally use useAlert() instead.
export default function AlertDispatcher({ type, message, autoDismiss, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
  }, [message, type]);

  const handleClose = useCallback(() => {
    setVisible(false);
    if (onClose) onClose();
  }, [onClose]);

  if (!visible || !message) return null;

  return (
    <AlertStack>
      <Alert
        type={type}
        message={message}
        autoDismiss={autoDismiss}
        onClose={handleClose}
      />
    </AlertStack>
  );
}
