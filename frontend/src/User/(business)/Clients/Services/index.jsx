import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { LuMapPin, LuPlus, LuX } from "react-icons/lu";
import { useDispatch } from "react-redux";
import CreateClientServiceForm from "./CreateClientServiceForm";
import { useFetchClientQuery, useFetchBusinessQuery } from "../../../../store";
import ClientServicesData from "./ClientServicesData";
import AlertDispatcher from "../../../../Components/ui/AlertDispatcher";
import { setTopbar, resetTopbar } from "../../../../store/topbarSlice";
import {
  registerTopbarActionHandler,
  unregisterTopbarActionHandler,
} from "../../../topbarActionRegistry";

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
    if (isManagerMode && role === "MANAGER") {
      registerTopbarActionHandler("add-service", () => setShowModal(true));
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
                iconClassName: "h-6 w-6 md:h-4 md:w-4",
                labelClassName: "hidden md:inline-flex",
                className:
                  "inline-flex items-center gap-2 rounded-lg bg-accent px-2 md:px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accentLight disabled:opacity-60",
              }
            : null,
      }),
    );

    return () => {
      unregisterTopbarActionHandler("add-service");
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
        <div className="mb-6 overflow-hidden rounded-2xl bg-secondary px-6 py-5 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-white/70">
                Client
              </span>
              <p className="text-3xl font-semibold leading-tight">
                {client?.client_name || "Pending client"}
              </p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm text-white/80">
                <LuMapPin className="h-4 w-4" />
                {client?.city || client?.province_state || client?.country
                  ? [client?.city, client?.province_state, client?.country]
                      .filter(Boolean)
                      .join(", ")
                  : "Location not provided"}
              </p>
            </div>

            <Link
              to="/user/business/clients"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
              aria-label="Close"
            >
              <LuX className="h-5 w-5" />
            </Link>
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

      {isManagerMode && (
        <CreateClientServiceForm
          showModal={showModal}
          setShowModal={setShowModal}
          clientId={client?.id}
          businessId={client?.business}
          clientName={client?.client_name}
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
