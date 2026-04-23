import { useState } from "react";
import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import { useDispatch } from "react-redux";
import CreateClientServiceForm from "./CreateClientServiceForm";
import { useFetchClientQuery, useFetchBusinessQuery } from "../../../../store";
import ClientServicesData from "./ClientServicesData";
import AlertDispatcher from "../../../../Components/ui/AlertDispatcher";
import { setTopbar, resetTopbar } from "../../../../store/topbarSlice";

export default function ClientServices({ token, role }) {
  const { id: clientId } = useParams();
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const dispatch = useDispatch();

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
    dispatch(
      setTopbar({
        title,
        description:
          "Organize subscriptions and one-time jobs with clear statuses, billing cadence, and on-site details.",
        action:
          isManagerMode && role === "MANAGER" ? (
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accentLight disabled:opacity-60"
              onClick={() => setShowModal(true)}
              disabled={loadingClient || !!clientError}
              type="button"
            >
              <FaPlus className="h-4 w-4" /> Add Service
            </button>
          ) : null,
      }),
    );

    return () => {
      dispatch(resetTopbar());
    };
  }, [dispatch, title, isManagerMode, role, loadingClient, clientError]);

  const displayError = (error) => {
    const msg = Array.isArray(error?.data)
      ? error.data.join(", ")
      : typeof error?.data === "object"
        ? Object.entries(error.data)
          .map(
            ([field, messages]) =>
              `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`,
          )
          .join(" | ")
        : error?.data?.detail || "Something went wrong";
    setAlert({ type: "danger", message: msg });
  };

  if (clientError && !alert.message) displayError(clientError);
  if (businessError && !alert.message) displayError(businessError);

  return (
    <>

      {isManagerMode && (
        <div className="mb-6 overflow-hidden rounded-2xl bg-linear-to-r from-accent to-secondary p-px shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-white/95 px-6 py-5">
            <div className="flex flex-col items-start gap-2 rounded-xl bg-linear-to-br from-secondary to-primary px-4 py-3 text-white shadow-md">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-white/70">
                Client
              </span>
              <p className="text-sm font-semibold leading-tight">
                {client?.client_name || "Pending client"}
              </p>
              <p className="text-xs text-white/80">
                {client?.city || client?.province_state || client?.country
                  ? [client?.city, client?.province_state, client?.country]
                    .filter(Boolean)
                    .join(", ")
                  : "Location not provided"}
              </p>
            </div>
          </div>
        </div>
      )}

      {alert.message && (
        <AlertDispatcher
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: "", message: "" })}
        />
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white/90 px-4 py-3 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-primary">{title}</h3>
          <p className="text-sm text-gray-600">
            Track services by status, location, and subscription type.
          </p>
        </div>
        {isManagerMode && (
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent to-secondary px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-lg disabled:opacity-60"
            onClick={() => setShowModal(true)}
            disabled={loadingClient || !!clientError}
            type="button"
          >
            <FaPlus className="h-4 w-4" /> Add Service
          </button>
        )}
      </div>

      {isManagerMode && (
        <CreateClientServiceForm
          showModal={showModal}
          setShowModal={setShowModal}
          clientId={client?.id}
          businessId={client?.business}
          serviceOptions={business?.services_offered || []}
          loadingOptions={loadingBusiness}
          errorOptions={businessError}
          setAlert={setAlert}
        />
      )}

      <ClientServicesData
        token={token}
        role={role}
        clientId={isManagerMode ? clientId : null}
        setAlert={setAlert}
      />
    </>
  );
}
