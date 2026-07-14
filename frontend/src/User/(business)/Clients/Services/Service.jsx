import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { LuInfo } from "react-icons/lu";
import { useDispatch } from "react-redux";
import {
  useFetchServiceQuery,
  useUpdateServiceMutation,
} from "../../../../store";

import SubmitButton from "../../../../Components/ui/SubmitButton";
import AlertDispatcher from "../../../../Components/ui/AlertDispatcher";
import LoadingScreen from "../../../../Components/ui/LoadingScreen";
import Select from "../../../../Components/ui/Select";
import Input from "../../../../Components/ui/Input";
import Textarea from "../../../../Components/ui/Textarea";
import { countries, provinces } from "../../../../constants/locations";
import { setTopbar, resetTopbar } from "../../../../store/topbarSlice";

export default function Service({ token }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: serviceData, isLoading } = useFetchServiceQuery(id, {
    skip: !token,
  });
  const [
    updateService,
    { isLoading: updating, error: updateError, isSuccess },
  ] = useUpdateServiceMutation();

  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [serviceType, setServiceType] = useState("ONE_TIME");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("CAD");
  const [billingCycle, setBillingCycle] = useState("");

  const [status, setStatus] = useState("PENDING");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [provinceState, setProvinceState] = useState("");
  const [country, setCountry] = useState("CA");
  const [postalCode, setPostalCode] = useState("");
  const [autoGenerateQuote, setAutoGenerateQuote] = useState(false);
  const [autoGenerateInvoices, setAutoGenerateInvoices] = useState(false);

  const [alert, setAlert] = useState({ type: "", message: "" });

  const statusTone = {
    PENDING: "bg-amber-100 text-amber-800",
    ACTIVE: "bg-green-100 text-green-800",
    COMPLETED: "bg-blue-100 text-blue-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  const formatMoney = (value, fallbackCurrency = "CAD") => {
    const amount = Number.parseFloat(value || 0);
    const safeAmount = Number.isFinite(amount) ? amount : 0;

    return `$${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount)} ${fallbackCurrency || "CAD"}`;
  };

  useEffect(() => {
    dispatch(
      setTopbar({
        title: serviceName
          ? `${serviceName} for ${serviceData?.client_name || "Client"}`
          : "Edit Service",
        description: "Review pricing, schedule, status, and service address.",
        action: null,
      }),
    );

    return () => {
      dispatch(resetTopbar());
    };
  }, [dispatch, serviceName, serviceData?.client_name]);

  useEffect(() => {
    if (serviceData) {
      setServiceName(serviceData.service_name || "");
      setDescription(serviceData.description || "");
      setStartDate(serviceData.start_date || "");
      setEndDate(serviceData.end_date || "");
      setServiceType(serviceData.service_type || "ONE_TIME");
      setPrice(serviceData.price || "");
      setCurrency(serviceData.currency || "CAD");
      setBillingCycle(serviceData.billing_cycle || "");
      setStatus(serviceData.status || "PENDING");
      setStreetAddress(serviceData.street_address || "");
      setCity(serviceData.city || "");
      setProvinceState(serviceData.province_state || "");
      setCountry(serviceData.country || "CA");
      setPostalCode(serviceData.postal_code || "");
      setAutoGenerateInvoices(serviceData.auto_generate_invoices || false);
      setAutoGenerateQuote(serviceData.auto_generate_quote || false);
    }
  }, [serviceData]);

  useEffect(() => {
    if (updateError) {
      const message =
        updateError?.data?.detail ||
        updateError?.data?.status ||
        "Failed to update service.";
      setAlert({ type: "danger", message });
    } else if (isSuccess) {
      setAlert({
        type: "success",
        message: "Service updated successfully!",
      });
    }
  }, [updateError, isSuccess, serviceData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateService({
        id,
        service_name: serviceName,
        description,
        start_date: startDate,
        end_date: endDate || null,
        service_type: serviceType,
        price,
        currency,
        billing_cycle: billingCycle,
        status,
        street_address: streetAddress,
        city,
        province_state: provinceState,
        country,
        postal_code: postalCode,
      }).unwrap();
      navigate(`/user/business/client/${serviceData.client}/services`);
    } catch (err) {
      setAlert({ type: "danger", message: `Failed to update service: ${err}` });
    }
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      {alert.message && (
        <AlertDispatcher
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: "", message: "" })}
        />
      )}

      <div className="mb-6 overflow-hidden rounded-2xl bg-accent p-px shadow-lg border-l-3 border-accent">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white/95 px-6 py-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">
              Service
            </p>
            <h3 className="text-2xl font-semibold text-primary">
              {serviceName || "Service"} for {serviceData.client_name}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-semibold uppercase text-secondary">
                {serviceType === "SUBSCRIPTION" ? "Subscription" : "One-Time"}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${statusTone[status] || "bg-gray-100 text-gray-700"}`}
              >
                {status}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-slate-800 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              Billing
            </p>
            <p className="text-xl font-medium text-slate-900">
              {price ? formatMoney(price, currency) : "Price TBD"}{" "}
              {billingCycle && `• ${billingCycle}`}
            </p>
            <p className="text-xs text-slate-500">
              {startDate ? `Starts ${startDate}` : "Start date not set"}
              {endDate ? ` • Ends ${endDate}` : ""}
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6 mb-0">
          <Input
            type="number"
            label="Price"
            value={price}
            onChange={setPrice}
            isRequired={true}
            fieldClass="mb-0 h-10 rounded-xl px-3 py-2 text-sm"
          />
          <Select
            id="currency"
            label="Currency"
            value={currency}
            isRequired={true}
            onChange={setCurrency}
            options={[
              { value: "CAD", label: "CAD" },
              { value: "USD", label: "USD" },
            ]}
            fieldClass="h-10 rounded-xl text-sm"
          />
          <Select
            id="service_type"
            label="Service Type"
            value={serviceType}
            isRequired={true}
            onChange={(value) => {
              setServiceType(value);
              setBillingCycle("");
            }}
            options={[
              { value: "ONE_TIME", label: "One Time" },
              { value: "SUBSCRIPTION", label: "Subscription" },
            ]}
            fieldClass="h-10 rounded-xl text-sm"
          />

          <Input
            type="date"
            id="start_date"
            label="Start Date"
            value={startDate}
            isRequired={true}
            onChange={setStartDate}
            fieldClass="mb-0 h-10 rounded-xl px-3 py-2 text-sm"
          />
          <Input
            type="date"
            id="end_date"
            label="End Date"
            value={endDate}
            onChange={setEndDate}
            fieldClass="mb-0 h-10 rounded-xl px-3 py-2 text-sm"
          />
          <Select
            id="status"
            label="Status"
            value={status}
            isRequired={true}
            onChange={setStatus}
            options={[
              { value: "PENDING", label: "Pending" },
              { value: "ACTIVE", label: "Active" },
              { value: "COMPLETED", label: "Completed" },
              { value: "CANCELLED", label: "Cancelled" },
            ]}
            fieldClass="h-10 rounded-xl text-sm"
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              id="generate_quote"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
              checked={autoGenerateQuote}
              onChange={() => setAutoGenerateQuote(!autoGenerateQuote)}
              disabled={true}
            />
            <span className="inline-flex items-center gap-2">
              <span className="text-gray-400">🔒</span>
              Auto-generate Quote (locked)
            </span>
          </label>
          {autoGenerateQuote && (
            <p className="flex items-start gap-2 text-sm text-slate-500">
              <LuInfo className="mt-0.5 h-4 w-4 text-slate-400" />A quote will
              be generated automatically after the questionnaire is completed.
            </p>
          )}

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              id="generate_invoices"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
              checked={autoGenerateInvoices}
              onChange={() => setAutoGenerateInvoices(!autoGenerateInvoices)}
            />
            Auto-generate Invoice(s)
          </label>
          {autoGenerateInvoices && (
            <p className="flex items-start gap-2 text-sm text-slate-500">
              <LuInfo className="mt-0.5 h-4 w-4 text-slate-400" />
              Invoices will be created automatically once the questionnaire is
              completed and the quote is signed.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <h5 className="text-lg font-semibold text-slate-900">
            Service Address
          </h5>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <Input
                id="street_address"
                label="Street Address"
                value={streetAddress}
                isRequired={true}
                onChange={setStreetAddress}
                fieldClass="mb-0 h-10 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <Select
              id="country"
              label="Country"
              value={country}
              isRequired={true}
              onChange={(value) => {
                setCountry(value);
                setProvinceState("");
              }}
              options={countries}
              fieldClass="h-10 rounded-xl text-sm"
            />
            <Select
              id="province"
              label="Province/State"
              value={provinceState}
              isRequired={true}
              onChange={setProvinceState}
              options={provinces[country]}
              fieldClass="h-10 rounded-xl text-sm"
            />

            <Input
              id="city"
              value={city}
              label="City"
              onChange={setCity}
              isRequired={true}
              fieldClass="mb-0 h-10 rounded-xl px-3 py-2 text-sm"
            />
            <Input
              id="postal_code"
              value={postalCode}
              label="Postal/Zip Code"
              onChange={setPostalCode}
              isRequired={true}
              fieldClass="mb-0 h-10 rounded-xl px-3 py-2 text-sm"
            />
          </div>

          <div className="pt-1">
            <Textarea
              id="service-description"
              label="Service Description"
              value={description}
              onChange={setDescription}
              isRequired={false}
              fieldClass="mb-0 min-h-[120px] rounded-xl px-3 py-3 text-sm"
              rows={5}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/20"
            onClick={() =>
              navigate(`/user/business/client/${serviceData.client}/services`)
            }
          >
            Cancel
          </button>
          <SubmitButton
            isLoading={updating}
            btnClass="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accentLight hover:shadow-lg disabled:opacity-60"
            btnName="Save Changes"
          />
        </div>
      </form>
    </>
  );
}
