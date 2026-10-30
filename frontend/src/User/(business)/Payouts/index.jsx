import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import PayoutDatatable from "./PayoutDatatable";
import { setTopbar, resetTopbar } from "../../../store/topbarSlice";

export default function Payouts({ token, role }) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      setTopbar({
        title: "Payouts",
        description:
          "Track processed payouts, payment status, and refund activity.",
        action: null,
      }),
    );

    return () => {
      dispatch(resetTopbar());
    };
  }, [dispatch]);

  return (
    <>
      <PayoutDatatable role={role} token={token} />
    </>
  );
}
