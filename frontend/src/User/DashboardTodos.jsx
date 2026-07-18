import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuChevronRight,
  LuCircleAlert,
  LuCircleCheck,
  LuClock3,
  LuListTodo,
  LuX,
} from "react-icons/lu";
import {
  useFetchBankingInformationListQuery,
  useFetchInvoicesQuery,
  useFetchJobsQuery,
  useFetchQuotesQuery,
  useFetchServiceQuestionnairesQuery,
  useFetchServicesQuery,
  useFetchServiceTermsTemplatesQuery,
} from "../store";

const ACTIVE_SERVICE_STATUSES = new Set(["PENDING", "ACTIVE", "IN_PROGRESS"]);
const CLOSED_STATUSES = new Set(["CANCELLED", "COMPLETED"]);
const INVOICE_CLOSED_STATUSES = new Set(["PAID", "CANCELLED"]);

function normalizeCollection(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeStatus(value) {
  return normalizeText(value).toUpperCase();
}

function isActiveRecord(record) {
  return record?.is_active !== false && record?.is_active !== "False";
}

function hasFilledQuestionnaire(service) {
  const questionnaire = service?.filled_questionnaire;
  if (!questionnaire) return false;
  if (Array.isArray(questionnaire)) return questionnaire.length > 0;
  if (typeof questionnaire === "object") {
    return Object.keys(questionnaire).length > 0;
  }
  return Boolean(String(questionnaire).trim());
}

function isPastDate(dateValue) {
  if (!dateValue) return false;

  const dueDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(dueDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dueDate < today;
}

function createTodo({ id, title, description, to, type = "Setup", priority = "normal" }) {
  return { id, title, description, to, type, priority };
}

function dedupeTodos(todos) {
  const seen = new Set();
  return todos.filter((todo) => {
    if (seen.has(todo.id)) return false;
    seen.add(todo.id);
    return true;
  });
}

export default function DashboardTodos({ token, user, business }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const isManager = user?.role === "MANAGER";
  const shouldSkip = !token || !isManager || !business?.id;

  const queryOptions = {
    skip: shouldSkip,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  };

  const { data: questionnaireData, isFetching: loadingQuestionnaires } =
    useFetchServiceQuestionnairesQuery(undefined, queryOptions);
  const { data: termsData, isFetching: loadingTerms } =
    useFetchServiceTermsTemplatesQuery(undefined, queryOptions);
  const { data: servicesData, isFetching: loadingServices } =
    useFetchServicesQuery(undefined, queryOptions);
  const { data: quotesData, isFetching: loadingQuotes } =
    useFetchQuotesQuery(undefined, queryOptions);
  const { data: invoicesData, isFetching: loadingInvoices } =
    useFetchInvoicesQuery({ page_size: 100 }, queryOptions);
  const { data: jobsData, isFetching: loadingJobs } =
    useFetchJobsQuery(undefined, queryOptions);
  const { data: bankingData, isFetching: loadingBanking } =
    useFetchBankingInformationListQuery(undefined, queryOptions);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (containerRef.current?.contains(event.target)) return;
      setIsOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const todos = useMemo(() => {
    if (shouldSkip) return [];

    const offeredServices = Array.isArray(business?.services_offered)
      ? business.services_offered.map(normalizeText).filter(Boolean)
      : [];
    const questionnaires = normalizeCollection(questionnaireData);
    const termsTemplates = normalizeCollection(termsData);
    const services = normalizeCollection(servicesData);
    const quotes = normalizeCollection(quotesData);
    const invoices = normalizeCollection(invoicesData);
    const jobs = normalizeCollection(jobsData);
    const bankingItems = normalizeCollection(bankingData);

    const activeQuestionnaireServices = new Set(
      questionnaires
        .filter(isActiveRecord)
        .map((questionnaire) => normalizeKey(questionnaire.service_name))
        .filter(Boolean),
    );
    const activeTermsServices = new Set(
      termsTemplates
        .filter(isActiveRecord)
        .map((template) => normalizeKey(template.service_name))
        .filter(Boolean),
    );
    const activeQuoteServiceIds = new Set(
      quotes
        .filter((quote) => isActiveRecord(quote))
        .filter((quote) => normalizeStatus(quote.status) !== "DECLINED")
        .map((quote) => String(quote.service || quote.service_data?.id || ""))
        .filter(Boolean),
    );
    const signedQuoteServiceIds = new Set(
      quotes
        .filter((quote) => isActiveRecord(quote))
        .filter((quote) => normalizeStatus(quote.status) === "SIGNED")
        .map((quote) => String(quote.service || quote.service_data?.id || ""))
        .filter(Boolean),
    );
    const invoiceServiceIds = new Set(
      invoices
        .filter((invoice) => isActiveRecord(invoice))
        .filter((invoice) => normalizeStatus(invoice.status) !== "CANCELLED")
        .map((invoice) => String(invoice.service || ""))
        .filter(Boolean),
    );
    const hasBusinessBanking = bankingItems.some(
      (item) =>
        isActiveRecord(item) &&
        String(item.business || "") === String(business.id) &&
        !item.client,
    );

    const nextTodos = [];

    if (!offeredServices.length) {
      nextTodos.push(
        createTodo({
          id: "business:offered-services",
          title: "Add offered services",
          description:
            "Choose the services this business provides so client services can be created.",
          to: "/user/business",
          type: "Setup",
          priority: "high",
        }),
      );
    }

    offeredServices.forEach((serviceName) => {
      const serviceKey = normalizeKey(serviceName);
      if (!activeQuestionnaireServices.has(serviceKey)) {
        nextTodos.push(
          createTodo({
            id: `questionnaire:${serviceKey}`,
            title: `Create questionnaire for ${serviceName}`,
            description:
              "Clients must complete a questionnaire before this service can become active.",
            to: "/user/business/service-questionnaires",
            type: "Setup",
            priority: "high",
          }),
        );
      }

      if (!activeTermsServices.has(serviceKey)) {
        nextTodos.push(
          createTodo({
            id: `terms:${serviceKey}`,
            title: `Create terms for ${serviceName}`,
            description:
              "General terms are required and will be included with every quote for this service.",
            to: "/user/business/terms-and-conditions",
            type: "Setup",
            priority: "high",
          }),
        );
      }
    });

    services.forEach((service) => {
      const status = normalizeStatus(service.status);
      if (CLOSED_STATUSES.has(status)) return;

      const serviceId = String(service.id || "");
      const serviceName = normalizeText(service.service_name) || "Service";
      const clientName = normalizeText(service.client_name) || "client";
      const clientLink = service.client
        ? `/user/business/client/${service.client}/services`
        : "/user/business/services";

      if (!hasFilledQuestionnaire(service)) {
        nextTodos.push(
          createTodo({
            id: `service-questionnaire-response:${serviceId}`,
            title: `Collect questionnaire for ${serviceName}`,
            description: `${clientName} still needs to complete the service questionnaire.`,
            to: clientLink,
            type: "Client",
            priority: "normal",
          }),
        );
      }

      if (
        hasFilledQuestionnaire(service) &&
        service.auto_generate_quote &&
        !activeQuoteServiceIds.has(serviceId)
      ) {
        nextTodos.push(
          createTodo({
            id: `quote-missing:${serviceId}`,
            title: `Create quote for ${serviceName}`,
            description: `${clientName}'s questionnaire is complete, but no active quote exists yet.`,
            to: clientLink,
            type: "Quote",
            priority: "high",
          }),
        );
      }

      if (
        ACTIVE_SERVICE_STATUSES.has(status) &&
        service.auto_generate_invoices &&
        signedQuoteServiceIds.has(serviceId) &&
        !invoiceServiceIds.has(serviceId)
      ) {
        nextTodos.push(
          createTodo({
            id: `invoice-missing:${serviceId}`,
            title: `Create invoice for ${serviceName}`,
            description: `${clientName}'s quote is signed and the service is active.`,
            to: "/user/business/invoices",
            type: "Invoice",
            priority: "high",
          }),
        );
      }
    });

    quotes.forEach((quote) => {
      const status = normalizeStatus(quote.status);
      if (!isActiveRecord(quote)) return;

      if (status === "DRAFT") {
        nextTodos.push(
          createTodo({
            id: `quote-draft:${quote.id}`,
            title: `Send ${quote.quote_number || "quote"}`,
            description: `${quote.service_name || "Service"} quote for ${quote.client_name || "client"} is still a draft.`,
            to: `/user/business/quote/${quote.id}`,
            type: "Quote",
            priority: "normal",
          }),
        );
      }

      if (status === "SENT") {
        nextTodos.push(
          createTodo({
            id: `quote-sent:${quote.id}`,
            title: `Await signature for ${quote.quote_number || "quote"}`,
            description: `${quote.client_name || "Client"} has not signed this quote yet.`,
            to: `/user/business/quote/${quote.id}`,
            type: "Quote",
            priority: "normal",
          }),
        );
      }
    });

    invoices.forEach((invoice) => {
      const status = normalizeStatus(invoice.status);
      if (!isActiveRecord(invoice) || INVOICE_CLOSED_STATUSES.has(status)) {
        return;
      }

      if (isPastDate(invoice.due_date)) {
        nextTodos.push(
          createTodo({
            id: `invoice-overdue:${invoice.id}`,
            title: `Follow up on ${invoice.invoice_number || "invoice"}`,
            description: `${invoice.client_name || "Client"} has an overdue invoice for ${invoice.service_name || "a service"}.`,
            to: `/user/business/invoice/${invoice.id}`,
            type: "Payment",
            priority: "high",
          }),
        );
      }
    });

    jobs.forEach((job) => {
      const status = normalizeStatus(job.status);
      if (!isActiveRecord(job) || CLOSED_STATUSES.has(status)) return;

      if (!job.assigned_to && !job.assigned_to_name) {
        nextTodos.push(
          createTodo({
            id: `job-unassigned:${job.id}`,
            title: `Assign ${job.title || job.service_name || "job"}`,
            description: "This job needs a team member before work can be tracked.",
            to: `/user/business/job/${job.id}`,
            type: "Job",
            priority: "normal",
          }),
        );
      }
    });

    if (!hasBusinessBanking) {
      nextTodos.push(
        createTodo({
          id: "banking:business-payout",
          title: "Connect business banking",
          description:
            "Payments and payout flow need an active business Stripe/bank connection.",
          to: "/user/banking",
          type: "Payment",
          priority: "normal",
        }),
      );
    }

    return dedupeTodos(nextTodos).sort((a, b) => {
      if (a.priority === b.priority) return a.title.localeCompare(b.title);
      return a.priority === "high" ? -1 : 1;
    });
  }, [
    bankingData,
    business,
    invoicesData,
    jobsData,
    questionnaireData,
    quotesData,
    servicesData,
    shouldSkip,
    termsData,
  ]);

  const isFetching =
    loadingQuestionnaires ||
    loadingTerms ||
    loadingServices ||
    loadingQuotes ||
    loadingInvoices ||
    loadingJobs ||
    loadingBanking;

  if (!isManager) return null;

  return (
    <div
      ref={containerRef}
      className="fixed bottom-5 right-5 z-50 flex flex-col items-end md:bottom-7 md:right-7"
    >
      {isOpen && (
        <div className="mb-4 w-[calc(100vw-2.5rem)] max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 sm:w-[28rem]">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-500">
                Todos
              </p>
              <h2 className="text-xl font-bold text-slate-950">
                Pending Tasks
              </h2>
              <p className="text-sm text-slate-500">
                {todos.length
                  ? `${todos.length} item${todos.length === 1 ? "" : "s"} need attention`
                  : "Everything is caught up"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
              aria-label="Close todos"
            >
              <LuX className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[min(28rem,calc(100vh-12rem))] overflow-y-auto px-3 py-3">
            {isFetching && !todos.length ? (
              <div className="flex min-h-36 items-center justify-center">
                <div className="grid grid-cols-2 gap-1.5">
                  {[0, 1, 2, 3].map((item) => (
                    <span
                      key={item}
                      className="h-3 w-3 animate-pulse rounded bg-orange-500"
                      style={{ animationDelay: `${item * 120}ms` }}
                    />
                  ))}
                </div>
              </div>
            ) : todos.length ? (
              <div className="space-y-2">
                {todos.map((todo) => (
                  <Link
                    key={todo.id}
                    to={todo.to}
                    onClick={() => setIsOpen(false)}
                    className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 transition hover:border-orange-200 hover:bg-orange-50"
                  >
                    <span
                      className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        todo.priority === "high"
                          ? "bg-orange-100 text-orange-600"
                          : "bg-white text-slate-500"
                      }`}
                    >
                      {todo.priority === "high" ? (
                        <LuCircleAlert className="h-4 w-4" />
                      ) : (
                        <LuClock3 className="h-4 w-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-slate-950">
                          {todo.title}
                        </span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          {todo.type}
                        </span>
                      </span>
                      <span className="mt-1 block text-sm leading-5 text-slate-600">
                        {todo.description}
                      </span>
                    </span>
                    <LuChevronRight className="mt-2 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-orange-500" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex min-h-44 flex-col items-center justify-center px-5 text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                  <LuCircleCheck className="h-6 w-6" />
                </span>
                <p className="text-base font-bold text-slate-950">
                  No pending tasks
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  New todos will appear here automatically when something needs
                  attention.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-xl shadow-orange-500/30 transition hover:-translate-y-0.5 hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-200"
        aria-label="Open todos"
        aria-expanded={isOpen}
      >
        <span className="pointer-events-none absolute right-full top-1/2 mr-3 inline-flex h-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950 px-8 text-sm font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
          Todos
        </span>
        <LuListTodo className="h-6 w-6" />
        {todos.length > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-slate-950 px-1.5 text-xs font-bold text-white">
            {todos.length > 99 ? "99+" : todos.length}
          </span>
        )}
      </button>
    </div>
  );
}
