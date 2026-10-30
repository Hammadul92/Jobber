import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { showAlert } from "../store/alertSlice";

// Returns setAlert({ type, message }) that shows a toast in the top-right
// corner. Calls without a message (the old "clear" call) are ignored.
export default function useAlert({ autoDismiss } = {}) {
  const dispatch = useDispatch();
  return useCallback(
    (alert) => {
      if (!alert?.message) return;
      dispatch(showAlert({ autoDismiss, ...alert }));
    },
    [dispatch, autoDismiss],
  );
}
