import { Link } from 'react-router-dom';

export default function DashboardHome({ role, business }) {
    const portalLabel =
        business?.name ||
        (role === 'CLIENT' ? 'Client Portal' : role === 'EMPLOYEE' ? 'Employee Portal' : 'Dashboard');

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

            <div className="rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-sm">
                <h3 className="text-2xl font-heading font-semibold text-primary">Welcome back</h3>
                <p className="mt-2 text-sm text-gray-600">
                    Use the side navigation to jump into clients, quotes, invoices, jobs, and more. We’ve refreshed the
                    dashboard styling to match the new accent palette.
                </p>
            </div>
        </>
    );
}
