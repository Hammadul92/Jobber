import { memo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { dismissAlert } from "../../store/alertSlice";
import { Alert, AlertStack } from "./AlertDispatcher";

const HostedAlert = memo(function HostedAlert({ id, type, message, autoDismiss }) {
  const dispatch = useDispatch();
  const close = useCallback(() => dispatch(dismissAlert(id)), [dispatch, id]);
  return (
    <Alert type={type} message={message} autoDismiss={autoDismiss} onClose={close} />
  );
});

// Renders the alerts raised with useAlert(), once for the whole app.
export default function AlertHost() {
  const alerts = useSelector((state) => state.alerts);
  if (!alerts.length) return null;
  return (
    <AlertStack>
      <div aria-live="polite" className="contents">
        {alerts.map((alert) => (
          <HostedAlert key={alert.id} {...alert} />
        ))}
      </div>
    </AlertStack>
  );
}
