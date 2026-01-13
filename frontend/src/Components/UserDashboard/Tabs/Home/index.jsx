import { Link } from 'react-router-dom';

export default function DashboardHome({ role, business }) {
    const portalLabel =
        business?.name ||
        (role === 'CLIENT' ? 'Client Portal' : role === 'EMPLOYEE' ? 'Employee Portal' : 'Dashboard');

    const summaryCards = [
        { title: 'Invoices', value: '—', note: 'Connect data to display billing status', link: '/dashboard/invoices' },
        { title: 'Quotes', value: '—', note: 'Track drafts, sent, and signed', link: '/dashboard/quotes' },
        { title: 'Jobs', value: '—', note: 'Monitor pending and in progress', link: '/dashboard/jobs' },
        { title: 'Payouts', value: '—', note: 'View processed and pending payouts', link: '/dashboard/payouts' },
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
                    <li className="text-gray-700 font-semibold">Home</li>
                </ol>
            </nav>

            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h3 className="text-2xl font-semibold text-gray-900">Welcome back</h3>
                        <p className="mt-2 max-w-2xl text-sm text-gray-600">
                            Quick overview of your workspace. Use the shortcuts to jump into billing, quotes, jobs, and
                            payouts.
                        </p>
                    </div>
                    <Link
                        to="/dashboard/invoices"
                        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentLight"
                    >
                        View Billing
                    </Link>
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
