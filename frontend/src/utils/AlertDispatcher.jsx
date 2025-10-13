import React, { useState, useEffect } from 'react';

/**
 * Reusable alert component for displaying backend messages.
 *
 * Props:
 * - type: 'success' | 'error' | 'info' — controls alert color
 * - message: string | object | array — handles Django REST / API response formats
 * - autoDismiss: number (optional, milliseconds) — auto-closes after this time
 * - onClose: function (optional) — callback triggered when alert is dismissed
 */
export default function AlertDispatcher({ type = 'error', message, autoDismiss, onClose }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        setVisible(true);

        if (autoDismiss && type === 'success') {
            const timer = setTimeout(() => handleClose(), autoDismiss);
            return () => clearTimeout(timer);
        }
    }, [message, type, autoDismiss]);

    if (!visible || !message) return null;

    const alertClass =
        type === 'success'
            ? 'alert-custom alert alert-success alert-dismissible mb-3'
            : type === 'danger'
              ? 'alert-custom alert alert-danger alert-dismissible mb-3'
              : 'alert-custom alert alert-info alert-dismissible mb-3';

    const renderMessage = () => {
        if (Array.isArray(message)) {
            return message.map((msg, i) => <div key={i}>{msg}</div>);
        } else if (typeof message === 'object') {
            return Object.entries(message).map(([key, val]) => (
                <div key={key}>
                    <strong>{key}:</strong> {Array.isArray(val) ? val.join(', ') : String(val)}
                </div>
            ));
        } else if (typeof message === 'string') {
            return <div>{message}</div>;
        } else {
            return <div>Unknown response format.</div>;
        }
    };

    const handleClose = () => {
        setVisible(false);
        if (onClose) onClose();
    };

    return (
        <div className={alertClass} role="alert">
            {renderMessage()}
            <button
                type="button"
                className="btn-close"
                data-bs-dismiss="alert"
                aria-label="Close"
                onClick={handleClose}
            ></button>
        </div>
    );
}
