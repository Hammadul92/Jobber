import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  useFetchInvoicesQuery,
  useFetchQuotesQuery,
  useFetchJobsQuery,
  useFetchPayoutsQuery,
} from "../../../store";
import { setTopbar, resetTopbar } from "../../../store/topbarSlice";

export default function DashboardHome({ token, user }) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      setTopbar({
        title: "Dashboard",
        description:
          "Quick overview of your workspace. Use shortcuts for invoices, quotes, jobs, and payouts.",
        action: null,
      }),
    );

    return () => {
      dispatch(resetTopbar());
    };
  }, [dispatch]);

  const { data: invoiceData, isLoading: loadingInvoices } =
    useFetchInvoicesQuery(undefined, { skip: !token });
  const { data: quoteData, isLoading: loadingQuotes } = useFetchQuotesQuery(
    undefined,
    { skip: !token },
  );
  const { data: jobsData, isLoading: loadingJobs } = useFetchJobsQuery(
    undefined,
    { skip: !token },
  );
  const { data: payoutData, isLoading: loadingPayouts } = useFetchPayoutsQuery(
    undefined,
    { skip: !token },
  );

  const invoices = invoiceData?.results || invoiceData || [];
  const quotes = quoteData || [];
  const jobs = jobsData || [];
  const payouts = payoutData?.results || [];

  const paidInvoices = invoices.filter((i) => i.status === "PAID").length;
  const signedQuotes = quotes.filter((q) => q.status === "SIGNED").length;
  const openQuotes = quotes.length - signedQuotes;
  const jobsInProgress = jobs.filter((j) => j.status === "IN_PROGRESS").length;
  const jobsPending = jobs.filter((j) => j.status === "PENDING").length;
  const paidPayouts = payouts.filter((p) => p.status === "PAID").length;
  const pendingPayouts = payouts.filter((p) => p.status === "PENDING").length;

  const safeCount = (count, loading) => (loading ? "..." : count);

  const summaryCards = [
    {
      title: "Invoices",
      value: safeCount(invoices.length, loadingInvoices),
      note: `Paid ${safeCount(paidInvoices, loadingInvoices)}`,
      link: "/user/business/invoices",
    },
    {
      title: "Quotes",
      value: safeCount(quotes.length, loadingQuotes),
      note: `Signed ${safeCount(signedQuotes, loadingQuotes)} • Open ${safeCount(openQuotes, loadingQuotes)}`,
      link: "/user/business/quotes",
    },
    {
      title: "Jobs",
      value: safeCount(jobs.length, loadingJobs),
      note: `In progress ${safeCount(jobsInProgress, loadingJobs)} • Pending ${safeCount(jobsPending, loadingJobs)}`,
      link: "/user/business/jobs",
    },
    {
      title: "Payouts",
      value: safeCount(payouts.length, loadingPayouts),
      note: `Paid ${safeCount(paidPayouts, loadingPayouts)} • Pending ${safeCount(pendingPayouts, loadingPayouts)}`,
      link: "/user/business/payouts",
    },
  ];

  return (
    <>

      <div className="mb-6 mt-16 md:mt-8 ">
        <div>
          <h3 className="text-sm md:text-base lg:text-lg font-semibold font-heading text-accent">
            Welcome back! <br />
            <span className="text-2xl md:text-3xl lg:text-4xl text-secondary">
              {" "}
              {user?.name}
            </span>
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Quick overview of your workspace. Use the shortcuts to jump into
            billing, quotes, jobs, and payouts.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <section className="lg:col-span-12 space-y-5">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <Link
                to={card.link}
                key={card.title}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-accent/60"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {card.title}
                </p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {card.value}
                </p>
                <p className="mt-2 text-xs text-gray-500">{card.note}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
