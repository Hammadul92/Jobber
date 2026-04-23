import { useMemo, Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { LuChevronRight } from "react-icons/lu";

const SEGMENT_LABELS = {
    user: "User",
    home: "Home",
    profile: "Profile",
    business: "Business",
    banking: "Banking",
    credentials: "Credentials",
    "team-members": "Team Members",
    "team-member": "Team Member",
    clients: "Clients",
    client: "Client",
    services: "Services",
    service: "Service",
    "service-questionnaires": "Questionnaires",
    "service-questionnaire": "Questionnaire",
    quotes: "Quotes",
    quote: "Quote",
    jobs: "Jobs",
    job: "Job",
    payouts: "Payouts",
    payout: "Payout",
    invoices: "Invoices",
    invoice: "Invoice",
    settings: "Settings",
};

function Topbar({ businessName }) {
    const { title, description, action } = useSelector((state) => state.topbar);
    const location = useLocation();

    const toTitle = (segment) =>
        segment
            .split("-")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");

    const isDynamicSegment = (segment) =>
        /^\d+$/.test(segment) ||
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(segment);

    const breadcrumbItems = useMemo(() => {
        const businessLabel = businessName || "Dashboard";
        const segments = location.pathname.split("/").filter(Boolean);

        if (!segments.length) {
            return [{ label: "Contractorz", to: "/" }];
        }

        const items = [
            { label: "Contractorz", to: "/" },
        ];

        if (segments[0] !== "user") {
            const label = SEGMENT_LABELS[segments[0]] || toTitle(decodeURIComponent(segments[0]));
            items.push({ label });
            return items;
        }

        // /user/profile, /user/banking, etc.
        if (segments[1] && segments[1] !== "business") {
            items.push({ label: "Account", to: "/user/profile" });

            let path = "/user";
            for (let i = 1; i < segments.length; i += 1) {
                const segment = decodeURIComponent(segments[i]);
                if (isDynamicSegment(segment)) continue;

                path += `/${segment}`;
                const label = SEGMENT_LABELS[segment] || toTitle(segment);
                const isLast = i === segments.length - 1;
                items.push({ label, to: isLast ? undefined : path });
            }

            return items;
        }

        // /user/business/... workspace pages
        items.push({ label: businessLabel, to: "/user/business/home" });

        let path = "/user/business";
        for (let i = 2; i < segments.length; i += 1) {
            const segment = decodeURIComponent(segments[i]);
            if (isDynamicSegment(segment)) continue;

            path += `/${segment}`;
            const label = SEGMENT_LABELS[segment] || toTitle(segment);
            const isLast = i === segments.length - 1;
            items.push({ label, to: isLast ? undefined : path });
        }

        return items;
    }, [location.pathname, businessName]);

    return (
        <div className="bg-white space-y-3 px-8 py-10 border-b border-gray-300 w-full">
            
            <nav aria-label="breadcrumb-mobile" className="ml-6">
                <ol className="flex flex-wrap items-center gap-2 text-sm">
                    {breadcrumbItems.map((crumb, idx) => (
                        <Fragment key={`${crumb.label}-${idx}`}>
                            <li>
                                {crumb.to ? (
                                    <Link
                                        to={crumb.to}
                                        className={`font-normal ${idx === 1 || idx === breadcrumbItems.length - 1 ? "text-secondary" : "text-accent hover:text-accentLight"}`}
                                    >
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className="font-medium">{crumb.label}</span>
                                )}
                            </li>
                            {idx < breadcrumbItems.length - 1 && <li className="text-gray-400"><LuChevronRight /></li>}
                        </Fragment>
                    ))}
                </ol>
            </nav>

            <div className="flex flex-wrap items-start justify-between gap-y-2">
                <div className="ml-6">
                    <h3 className="text-xl md:text-4xl font-medium text-primary">{title}</h3>
                    <p className="text-sm md:text-base text-gray-500">{description}</p>
                </div>

                <div className="ml-auto">
                    {action}
                </div>
            </div>
        </div>
    );
}

export default Topbar;