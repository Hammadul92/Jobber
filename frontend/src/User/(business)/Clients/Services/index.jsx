import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { LuMapPin, LuPlus } from "react-icons/lu";
import { useDispatch } from "react-redux";
import CreateClientServiceForm from "./CreateClientServiceForm";
import { useFetchClientQuery, useFetchBusinessQuery } from "../../../../store";
import ClientServicesData from "./ClientServicesData";
import { setTopbar, resetTopbar } from "../../../../store/topbarSlice";
import {
  registerTopbarActionHandler,
  unregisterTopbarActionHandler,
} from "../../../topbarActionRegistry";
import useAlert from "../../../../hooks/useAlert";

const errorMessage = (error) =>
  Array.isArray(error?.data)
    ? error.data.join(", ")
    : typeof error?.data === "object"
      ? Object.entries(error.data)
          .map(
            ([field, messages]) =>
              `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`,
          )
          .join(" | ")
      : error?.data?.detail || "Something went wrong";

export default function ClientServices({ token, role }) {
  const { id: clientId } = useParams();
  const [showModal, setShowModal] = useState(false);
  const setAlert = useAlert();
  const dispatch = useDispatch();

  const handleOpenCreate = useCallback(() => {
    setShowModal(true);
  }, []);

  const isManagerMode = !!clientId;

  const {
    data: client,
    isLoading: loadingClient,
    error: clientError,
  } = useFetchClientQuery(clientId, { skip: !isManagerMode || !token });

  const {
    data: business,
    isLoading: loadingBusiness,
    error: businessError,
  } = useFetchBusinessQuery(client?.business, {
    skip: !client?.business || !token,
  });

  const title = isManagerMode
    ? `Services for ${client?.client_name || "Client"}`
    : "Services";

  useEffect(() => {
    if (isManagerMode && role === "MANAGER") {
      registerTopbarActionHandler("add-service", handleOpenCreate);
    }

    dispatch(
      setTopbar({
        title,
        description:
          "Track services by status, location, and subscription type.",
        action:
          isManagerMode && role === "MANAGER"
            ? {
                type: "button",
                key: "add-service",
                label: "Add Service",
                title: "Add Service",
                icon: "plus",
                iconClassName: "h-6 w-6 md:h-4.5 md:w-4.5",
                labelClassName: "hidden md:inline-flex",
                className:
                  "inline-flex items-center gap-2 rounded-xl bg-accent px-2 md:px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accentLight disabled:opacity-60",
              }
            : null,
      }),
    );

    return () => {
      unregisterTopbarActionHandler("add-service");
      dispatch(resetTopbar());
    };
  }, [dispatch, title, isManagerMode, role, loadingClient, clientError, handleOpenCreate]);

  const isClientActive = client?.is_active !== false && client?.is_active !== "False";
  const billingAddress = [
    client?.billing_street_address,
    client?.billing_city,
    client?.billing_province_state,
    client?.billing_country,
    client?.billing_postal_code,
  ]
    .filter(Boolean)
    .join(", ");

  const clientHeader = isManagerMode ? (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          Client
        </p>
        <h3 className="text-2xl font-semibold text-primary">
          {client?.client_name || "Pending client"}
        </h3>
        {client && (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${
              isClientActive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {isClientActive ? "Active" : "Inactive"}
          </span>
        )}
      </div>

      <div className="space-y-1 text-right">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          Billing address
        </p>
        <p className="inline-flex items-center gap-2 text-sm text-slate-700">
          <LuMapPin className="h-4 w-4 text-slate-400" />
          {billingAddress || "Not provided"}
        </p>
      </div>
    </div>
  ) : null;

  const loadError = clientError || businessError;
  useEffect(() => {
    if (loadError) setAlert({ type: "danger", message: errorMessage(loadError) });
  }, [loadError, setAlert]);

  return (
    <>
      {isManagerMode && role === "MANAGER" && (
        <CreateClientServiceForm
          showModal={showModal}
          setShowModal={setShowModal}
          clientId={client?.id}
          businessId={client?.business}
          clientName={client?.client_name}
          clientBillingAddress={client}
          serviceOptions={business?.services_offered || []}
          loadingOptions={loadingBusiness}
          errorOptions={businessError}
        />
      )}

      <ClientServicesData
        token={token}
        role={role}
        clientId={isManagerMode ? clientId : null}
        header={clientHeader}
      />
    </>
  );
}
