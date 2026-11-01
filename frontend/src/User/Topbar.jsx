import { useMemo, Fragment } from "react";
import { Link, matchPath, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { LuChevronRight, LuPlus, LuUserPlus } from "react-icons/lu";
import { getTopbarActionHandler } from "./topbarActionRegistry";
import { getPublicSiteHomeUrl } from "../utils/publicSite";
import GoBackLink from "../Components/ui/GoBackLink";

// Breadcrumb trail for each workspace page, after the business crumb. Each
// step is [label, path, page]; a step links to its path (":id"/":serviceId"
// filled from the URL) when the viewer's role can open that page.
const BUSINESS_TRAILS = {
  home: [],
  clients: [["Clients"]],
  "client/:id": [["Clients", "clients", "clients"], ["Client"]],
  "client/:id/services": [
    ["Clients", "clients", "clients"],
    ["Client", "client/:id", "client"],
    ["Services"],
  ],
  services: [["Services"]],
  "service/:id": [["Services", "services", "client-services"], ["Service"]],
  "service-questionnaires": [["Questionnaires"]],
  "service-questionnaire/:id": [
    ["Questionnaires", "service-questionnaires", "service-questionnaires"],
    ["Questionnaire"],
  ],
  "service-questionnaire/:id/form": [
    ["Questionnaires", "service-questionnaires", "service-questionnaires"],
    ["Questionnaire", "service-questionnaire/:id", "service-questionnaires"],
    ["Form"],
  ],
  "service-questionnaire/:id/form/:serviceId": [
    ["Services", "services", "client-services"],
    ["Service", "service/:serviceId", "service"],
    ["Questionnaire"],
  ],
  "terms-and-conditions": [["Terms & Conditions"]],
  quotes: [["Quotes"]],
  "quote/:id": [["Quotes", "quotes", "quotes"], ["Quote"]],
  "quote/:id/preview": [
    ["Quotes", "quotes", "quotes"],
    ["Quote", "quote/:id", "quote"],
    ["Client Preview"],
  ],
  "quote/sign/:id": [["Quotes", "quotes", "quotes"], ["Review & Sign"]],
  jobs: [["Jobs"]],
  "job/:id": [["Jobs", "jobs", "jobs"], ["Job"]],
  invoices: [["Invoices"]],
  "invoice/:id": [["Invoices", "invoices", "invoices"], ["Invoice"]],
  payouts: [["Payouts"]],
  "payout/:id": [["Payouts", "payouts", "payouts"], ["Payout"]],
  "team-members": [["Team Members"]],
  "team-member/:id": [["Team Members", "team-members", "team-members"], ["Team Member"]],
};

const ACCOUNT_LABELS = {
  profile: "Profile",
  business: "Business",
  banking: "Banking",
  credentials: "Credentials",
};

function Topbar({ businessName, backFallback, canAccess }) {
  const { title, description, action } = useSelector((state) => state.topbar);
  const location = useLocation();
  const actionHandler = action?.key ? getTopbarActionHandler(action.key) : null;
  const publicSiteHomeUrl = getPublicSiteHomeUrl();

  const TOPBAR_ACTION_ICONS = {
    plus: LuPlus,
    "user-plus": LuUserPlus,
  };

  const breadcrumbItems = useMemo(() => {
    const items = [{ label: "Contractorz", href: publicSiteHomeUrl }];
    const { pathname } = location;

    const accountPage = matchPath("/user/:section", pathname)?.params.section;
    if (accountPage && ACCOUNT_LABELS[accountPage]) {
      items.push({ label: "Account" }, { label: ACCOUNT_LABELS[accountPage] });
      return items;
    }

    const isHome = Boolean(matchPath("/user/business/home", pathname));
    items.push({
      label: businessName || "Dashboard",
      to: isHome ? undefined : "/user/business/home",
    });

    for (const [pattern, trail] of Object.entries(BUSINESS_TRAILS)) {
      const match = matchPath(`/user/business/${pattern}`, pathname);
      if (!match) continue;
      trail.forEach(([label, path, page], idx) => {
        const isLast = idx === trail.length - 1;
        const canLink = path && !isLast && (!canAccess || canAccess(page));
        items.push({
          label,
          to: canLink
            ? `/user/business/${path.replace(/:(\w+)/g, (_, key) => match.params[key])}`
            : undefined,
        });
      });
      break;
    }

    return items;
  }, [location, businessName, publicSiteHomeUrl, canAccess]);

  return (
    <div className="bg-white md:p-8 md:pr-12 lg:p-8 lg:pr-14 px-4 py-4 border-b border-gray-300 w-full">
      <nav aria-label="breadcrumb-mobile" className="md:ml-6">
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          {breadcrumbItems.map((crumb, idx) => (
            <Fragment key={`${crumb.label}-${idx}`}>
              <li>
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className={`font-normal ${idx === 1 || idx === breadcrumbItems.length - 1 ? "text-secondary" : "text-accent hover:text-accentLight"}`}
                  >
                    {crumb.label}
                  </a>
                ) : crumb.to ? (
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
              {idx < breadcrumbItems.length - 1 && (
                <li className="text-gray-400">
                  <LuChevronRight />
                </li>
              )}
            </Fragment>
          ))}
        </ol>
      </nav>

      <div className={`${title || backFallback ? "flex" : "hidden"} items-start justify-between gap-y-2 mt-3`}>
        <div className="flex min-w-0 items-start gap-3 md:ml-6">
          {backFallback && (
            <div className="pt-0.5 md:pt-1">
              <GoBackLink fallback={backFallback} />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-2xl md:text-4xl font-medium text-primary">
              {title}
            </h3>
            <p className="text-sm md:text-base text-gray-500">{description}</p>
          </div>
        </div>

        <div className="ml-auto">
          {action && action.type === "button" && (
            <button
              className={action.className}
              onClick={actionHandler || undefined}
              type="button"
              title={action.title || action.label}
            >
              {action.icon && TOPBAR_ACTION_ICONS[action.icon]
                ? (() => {
                    const Icon = TOPBAR_ACTION_ICONS[action.icon];
                    return (
                      <Icon className={action.iconClassName || "h-5 w-5"} />
                    );
                  })()
                : null}
              {action.label ? (
                <span
                  className={
                    action.labelClassName ??
                    (action.icon ? "hidden md:block" : "block")
                  }
                >
                  {action.label}
                </span>
              ) : null}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Topbar;
