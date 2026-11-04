import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LuMapPin } from "react-icons/lu";
import { useDispatch } from "react-redux";
import CreateClientServiceForm from "./CreateClientServiceForm";
import { useFetchClientQuery, useFetchClientsQuery } from "../../../../store";
import ClientServicesData from "./ClientServicesData";
import { setTopbar, resetTopbar } from "../../../../store/topbarSlice";
import {
  registerTopbarActionHandler,
  unregisterTopbarActionHandler,
} from "../../../topbarActionRegistry";
import useAlert from "../../../../hooks/useAlert";
import { apiErrorMessage } from "../../../../utils/apiError";

// The Services tab. Managers see every service and can narrow it to one
// client with ?client=<id> (the Clients table's "Services" button links here
// with it set). Clients only ever see their own services.
export default function Services({ token, role, business }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const setAlert = useAlert();
  const dispatch = useDispatch();
  const isManager = role === "MANAGER";
  const clientId = isManager ? searchParams.get("client") || "" : "";

  const handleOpenCreate = useCallback(() => setShowModal(true), []);

  const setClientFilter = useCallback(
    (value) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (value) next.set("client", value);
          else next.delete("client");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const { data: clients = [], error: clientsError } = useFetchClientsQuery(
    undefined,
    { skip: !token || !isManager },
  );
  const {
    data: client,
    error: clientError,
  } = useFetchClientQuery(clientId, { skip: !clientId || !token });

  const clientOptions = useMemo(
    () =>
      (Array.isArray(clients) ? clients : [])
        .map((item) => ({
          value: String(item.id),
          label: item.client_name || item.client_email || `Client #${item.id}`,
          isActive: item.is_active !== false,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [clients],
  );

  const title = clientId
    ? `Services for ${client?.client_name || "Client"}`
    : "Services";

  useEffect(() => {
    if (isManager) registerTopbarActionHandler("add-service", handleOpenCreate);

    dispatch(
      setTopbar({
        title,
        description:
          "Track services by status, location, and subscription type.",
        action: isManager
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
  }, [dispatch, title, isManager, handleOpenCreate]);

  const loadError = clientError || clientsError;
  useEffect(() => {
    if (loadError) setAlert({ type: "danger", message: apiErrorMessage(loadError) });
  }, [loadError, setAlert]);

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

  const clientHeader = clientId ? (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          Client
        </p>
        <h3 className="text-2xl font-semibold text-primary">
          {client?.client_name || "Loading client..."}
        </h3>
        <div className="flex flex-wrap items-center gap-3">
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
          <button
            type="button"
            onClick={() => setClientFilter("")}
            className="text-xs font-semibold text-secondary hover:text-accent"
          >
            Show all services
          </button>
        </div>
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

  return (
    <>
      {isManager && (
        <CreateClientServiceForm
          showModal={showModal}
          setShowModal={setShowModal}
          businessId={business?.id}
          serviceOptions={business?.services_offered || []}
          clients={clients}
          defaultClientId={clientId}
        />
      )}

      <ClientServicesData
        token={token}
        role={role}
        clientId={clientId || null}
        clientOptions={clientOptions}
        onClientChange={setClientFilter}
        header={clientHeader}
      />
    </>
  );
}
