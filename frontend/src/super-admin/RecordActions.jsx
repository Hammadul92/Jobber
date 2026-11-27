import { createElement, useEffect, useRef, useState } from "react";
import {
  LuPencil,
  LuTrash2,
  LuRotateCcw,
  LuCheck,
  LuBan,
} from "react-icons/lu";
import Input from "../Components/ui/Input";
import Select from "../Components/ui/Select";
import Textarea from "../Components/ui/Textarea";
import { toolbarButtonClass } from "../Components/ui/TableToolbar";
import { label } from "./navigation";

export const iconButtonClass =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-slate-600 transition hover:text-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

export function RecordActionButtons({ resource, row, onAction }) {
  const actionIcons = {
    edit: LuPencil,
    delete: LuTrash2,
    restore: LuRotateCcw,
    activate: LuCheck,
    deactivate: LuBan,
  };
  if (!row._actions?.length) return null;
  return (
    <div className="inline-flex items-center gap-0.5">
      {row._actions?.map((action) => (
        <button
          key={action}
          type="button"
          aria-label={label(action)}
          title={label(action)}
          className={`${iconButtonClass} ${action === "delete" ? "text-rose-600! hover:text-rose-700!" : ""}`}
          onClick={() => onAction({ resource, record: row, action })}
        >
          {createElement(actionIcons[action], {
            className: "h-4 w-4",
            "aria-hidden": true,
          })}
        </button>
      ))}
    </div>
  );
}

function RelationInput({ field, value, onChange, api, endpoint }) {
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState(field.choices);
  const [error, setError] = useState("");
  useEffect(() => {
    let current = true;
    const timer = setTimeout(() => {
      api(
        `${endpoint}?field=${field.name}&search=${encodeURIComponent(search)}`,
      )
        .then((data) => {
          if (current) {
            setOptions(
              [...field.choices, ...data.options].filter(
                (item, index, all) =>
                  all.findIndex((other) => other.value === item.value) ===
                  index,
              ),
            );
            setError("");
          }
        })
        .catch((e) => {
          if (current) setError(e.message);
        });
    }, 200);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [search, api, endpoint, field]);
  return (
    <div>
      <Input
        id={`search-${field.name}`}
        label={`Search ${field.label}`}
        value={search}
        onChange={setSearch}
      />
      <Select
        id={`edit-${field.name}`}
        label={field.label}
        isRequired={field.required}
        value={String(value)}
        onChange={(value) =>
          onChange(
            value,
            options.find((item) => item.value === String(value))?.label,
          )
        }
        options={[{ value: "", label: "Select a record" }, ...options]}
      />
      {error && (
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ActionDialog({ target, api, onClose, onDone }) {
  const dialog = useRef(null);
  const [data, setData] = useState(null);
  const [values, setValues] = useState({});
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const { resource, record, action } = target;
  const editing = ["create", "edit"].includes(action);
  const endpoint = `actions/${resource}/${record ? record.id + "/" : ""}`;
  useEffect(() => {
    dialog.current.showModal();
    let current = true;
    api(endpoint + (editing ? "" : `?operation=${action}`))
      .then((result) => {
        if (!current) return;
        setData(result);
        setValues(
          Object.fromEntries(
            (result.fields || []).map((f) => [
              f.name,
              f.type === "datetime-local"
                ? String(f.value).slice(0, 16)
                : f.value,
            ]),
          ),
        );
      })
      .catch((e) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
    };
  }, [api, endpoint, editing, action]);
  const submit = async () => {
    setBusy(true);
    setError("");
    setErrors({});
    try {
      let body;
      if (editing) {
        body = new FormData();
        body.set("operation", action);
        for (const field of data.fields) {
          const value = values[field.name];
          if (field.type === "file") {
            if (value instanceof File) body.set(field.name, value);
          } else if (field.type === "boolean") {
            if (value) body.set(field.name, "on");
          } else body.set(field.name, value ?? "");
        }
      } else body = JSON.stringify({ operation: action, token: data.token });
      const result = await api(endpoint, { method: "POST", body });
      onDone(result);
    } catch (e) {
      setError(e.message);
      setErrors(e.errors || {});
      if (e.status === 409) setData(null);
      setReview(false);
    } finally {
      setBusy(false);
    }
  };
  return (
    <dialog
      ref={dialog}
      aria-labelledby="record-action-title"
      onCancel={(e) => {
        if (busy) e.preventDefault();
      }}
      onClose={onClose}
      className="m-auto max-h-[90dvh] w-[calc(100vw-2rem)] max-w-3xl rounded-2xl bg-white p-6 text-slate-700 shadow-2xl backdrop:bg-black/50"
    >
      <h2
        id="record-action-title"
        className="text-xl font-semibold text-slate-900"
      >
        {label(action)} {record?._label || label(resource)}
      </h2>
      {["payments", "refunds", "invoices", "payment-methods"].includes(
        resource,
      ) && (
        <p className="mt-3 text-sm text-slate-500">
          Changes update local platform records. They do not charge a card, send
          an invoice, issue a refund, or cancel a transaction at the payment
          provider.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="my-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"
        >
          {error}
        </p>
      )}
      {!data && !error && <p className="py-6">Loading record information…</p>}
      {data && (
        <>
          {editing && !review ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setReview(true);
              }}
              className="mt-6"
            >
              <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
                {data.fields.map((field) => (
                  <div
                    key={field.name}
                    className={field.type === "textarea" ? "md:col-span-2" : ""}
                  >
                    {field.type === "relation" ? (
                      <RelationInput
                        field={field}
                        value={values[field.name]}
                        onChange={(value, name) =>
                          setValues({
                            ...values,
                            [field.name]: value,
                            [field.name + "__label"]: name,
                          })
                        }
                        api={api}
                        endpoint={endpoint}
                      />
                    ) : field.type === "boolean" ? (
                      <label className="mb-6 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={Boolean(values[field.name])}
                          onChange={(e) =>
                            setValues({
                              ...values,
                              [field.name]: e.target.checked,
                            })
                          }
                        />
                        {field.label}
                      </label>
                    ) : field.type === "select" ? (
                      <Select
                        id={`edit-${field.name}`}
                        label={field.label}
                        value={String(values[field.name])}
                        options={field.choices}
                        isRequired={field.required}
                        onChange={(value) =>
                          setValues({ ...values, [field.name]: value })
                        }
                      />
                    ) : field.type === "textarea" ? (
                      <Textarea
                        id={`edit-${field.name}`}
                        label={field.label}
                        value={values[field.name]}
                        isRequired={field.required}
                        onChange={(value) =>
                          setValues({ ...values, [field.name]: value })
                        }
                      />
                    ) : (
                      <Input
                        id={`edit-${field.name}`}
                        label={
                          field.label +
                          (field.type === "datetime-local" ? " (UTC)" : "")
                        }
                        type={field.type}
                        step="any"
                        value={
                          field.type === "file" ? undefined : values[field.name]
                        }
                        isRequired={field.required}
                        onChange={(value) =>
                          setValues({
                            ...values,
                            [field.name]:
                              field.type === "file"
                                ? value.target.files[0]
                                : value,
                          })
                        }
                      />
                    )}
                    {field.help && (
                      <p className="mb-4 text-xs text-slate-500">
                        {field.help}
                      </p>
                    )}
                    {errors[field.name] && (
                      <p className="mb-4 text-sm text-rose-600">
                        {errors[field.name].join(" ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {errors.__all__ && (
                <p role="alert" className="mb-4 text-rose-600">
                  {errors.__all__.join(" ")}
                </p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className={toolbarButtonClass}
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button type="submit" className={toolbarButtonClass}>
                  Review changes
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-5">
              {editing ? (
                <>
                  <p className="mb-4">
                    Confirm these{" "}
                    {action === "create" ? "new record values" : "changes"}{" "}
                    before saving.
                  </p>
                  <dl className="max-h-80 overflow-auto divide-y divide-gray-100">
                    {data.fields
                      .filter(
                        (field) =>
                          action === "create" ||
                          values[field.name] !== field.value,
                      )
                      .map((field) => (
                        <div key={field.name} className="py-2">
                          <dt className="font-semibold">{field.label}</dt>
                          <dd className="break-words whitespace-pre-wrap text-sm">
                            {field.type === "password"
                              ? "Password will be set"
                              : field.type === "file"
                                ? values[field.name]?.name || "No file selected"
                                : field.type === "relation"
                                  ? values[field.name + "__label"] ||
                                    field.choices.find(
                                      (item) =>
                                        item.value ===
                                        String(values[field.name]),
                                    )?.label ||
                                    "No related record"
                                  : String(values[field.name])}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </>
              ) : (
                <>
                  <p className="mb-3">
                    {action === "delete"
                      ? data.permanent
                        ? "This permanently deletes this record and removes the links listed below."
                        : "These records will move to deleted records. Their parent records remain in place."
                      : `Confirm ${action} for the records listed below.`}
                  </p>
                  {resource === "users" || resource === "admins" ? (
                    <p className="mb-3 text-sm">
                      Deleted accounts cannot sign in. Restored accounts remain
                      inactive until explicitly activated.
                    </p>
                  ) : null}
                  <p className="mb-2 font-semibold">
                    Affected records: {data.records.length}
                  </p>
                  <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100 rounded-xl border border-gray-200 p-3">
                    {data.records.map((item, index) => (
                      <li key={index} className="py-2 text-sm">
                        <strong>{item.entity}</strong>: {item.name}
                        <span className="ml-2 text-slate-500">
                          ({item.effect})
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  autoFocus
                  type="button"
                  disabled={busy}
                  className={toolbarButtonClass}
                  onClick={() => (editing ? setReview(false) : onClose())}
                >
                  {editing ? "Back" : "Cancel"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={submit}
                  className={`${toolbarButtonClass} ${action === "delete" ? "text-rose-600! border-rose-200! bg-rose-50!" : "text-accent!"}`}
                >
                  {busy ? "Saving…" : `Confirm ${label(action)}`}
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {!data && error && (
        <button className={`${toolbarButtonClass} mt-4`} onClick={onClose}>
          Close
        </button>
      )}
    </dialog>
  );
}
