import { Link } from 'react-router-dom';
import {
    useFetchInvoicesQuery,
    useFetchQuotesQuery,
    useFetchJobsQuery,
    useFetchPayoutsQuery,
} from '../../../../store';

export default function DashboardHome({ business, token, user }) {
    
    const portalLabel =
        business?.name ||
        (user.role === 'CLIENT' ? 'Client Portal' : user.role === 'EMPLOYEE' ? 'Employee Portal' : 'Dashboard');

    const { data: invoiceData, isLoading: loadingInvoices } = useFetchInvoicesQuery(undefined, { skip: !token });
    const { data: quoteData, isLoading: loadingQuotes } = useFetchQuotesQuery(undefined, { skip: !token });
    const { data: jobsData, isLoading: loadingJobs } = useFetchJobsQuery(undefined, { skip: !token });
    const { data: payoutData, isLoading: loadingPayouts } = useFetchPayoutsQuery(undefined, { skip: !token });

    const invoices = invoiceData?.results || invoiceData || [];
    const quotes = quoteData || [];
    const jobs = jobsData || [];
    const payouts = payoutData?.results || [];

    const paidInvoices = invoices.filter((i) => i.status === 'PAID').length;
    const signedQuotes = quotes.filter((q) => q.status === 'SIGNED').length;
    const openQuotes = quotes.length - signedQuotes;
    const jobsInProgress = jobs.filter((j) => j.status === 'IN_PROGRESS').length;
    const jobsPending = jobs.filter((j) => j.status === 'PENDING').length;
    const paidPayouts = payouts.filter((p) => p.status === 'PAID').length;
    const pendingPayouts = payouts.filter((p) => p.status === 'PENDING').length;

    const safeCount = (count, loading) => (loading ? '...' : count);

    const summaryCards = [
        {
            title: 'Invoices',
            value: safeCount(invoices.length, loadingInvoices),
            note: `Paid ${safeCount(paidInvoices, loadingInvoices)}`,
            link: '/dashboard/invoices',
        },
        {
            title: 'Quotes',
            value: safeCount(quotes.length, loadingQuotes),
            note: `Signed ${safeCount(signedQuotes, loadingQuotes)} • Open ${safeCount(openQuotes, loadingQuotes)}`,
            link: '/dashboard/quotes',
        },
        {
            title: 'Jobs',
            value: safeCount(jobs.length, loadingJobs),
            note: `In progress ${safeCount(jobsInProgress, loadingJobs)} • Pending ${safeCount(jobsPending, loadingJobs)}`,
            link: '/dashboard/jobs',
        },
        {
            title: 'Payouts',
            value: safeCount(payouts.length, loadingPayouts),
            note: `Paid ${safeCount(paidPayouts, loadingPayouts)} • Pending ${safeCount(pendingPayouts, loadingPayouts)}`,
            link: '/dashboard/payouts',
        },
    ];

    return (
        <>
            <nav aria-label="breadcrumb" className="mb-6">
                <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <li>
                        <Link to={`/`} className="font-semibold text-accent hover:text-accentLight">
                            Contractorz
                        </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li>
                        <Link to="/dashboard/home" className="font-semibold text-secondary hover:text-accent">
                            {portalLabel}
                        </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li className="text-gray-700 font-semibold">Dashboard</li>
                </ol>
            </nav>

            <div className="mb-6 mt-8 ">
                <div>
                    <h3 className="text-lg font-semibold font-heading text-accent">
                        Welcome back! <br />
                        <span className='text-4xl text-secondary'> {user?.name}</span>
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm text-gray-600">
                        Quick overview of your workspace. Use the shortcuts to jump into billing, quotes, jobs, and
                        payouts.
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
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{card.title}</p>
                                <p className="mt-2 text-2xl font-semibold text-gray-900">{card.value}</p>
                                <p className="mt-2 text-xs text-gray-500">{card.note}</p>
                            </Link>
                        ))}
                    </div>
                </section>

            </div>
        </>
    );
}
