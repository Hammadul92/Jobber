import WorkspaceNavigation from "../Components/ui/WorkspaceNavigation";
import { useLocation } from "react-router-dom";
import {
  LuUser,
  LuReceipt,
  LuBriefcase,
  LuArrowUpRight,
  LuFileText,
  LuUsers,
  LuCircleUser,
  LuClipboardList,
  LuBuilding2,
  LuCreditCard,
  LuKey,
  LuScrollText,
  LuTrash2,
} from "react-icons/lu";
import { RiDashboardLine } from "react-icons/ri";
import { useFetchBusinessesQuery, useFetchUserQuery } from "../store";
import useLogout from "./useLogout";

// Unified Sidebar for both UserAccount and UserDashboard
export default function SideNav({ user, businessRegistered }) {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const handleLogout = useLogout();

  const { data: fetchedUser } = useFetchUserQuery(undefined, {
    skip: Boolean(user) || !token,
  });
  const { data: businesses } = useFetchBusinessesQuery(undefined, {
    skip: !token,
  });

  const currentUser = user || fetchedUser;
  const role = currentUser?.role;
  const hasBusiness = Array.isArray(businesses) && businesses.length > 0;
  const isBusinessRegistered = Boolean(businessRegistered || hasBusiness);
  const showBusinessTab = role === "USER" || role === "MANAGER" || hasBusiness;
  const displayName =
    currentUser?.name ||
    currentUser?.full_name ||
    [currentUser?.first_name, currentUser?.last_name]
      .filter(Boolean)
      .join(" ") ||
    "User";
  const displayEmail = currentUser?.email || "";

  // Account menu items
  const accountMenu = [
    {
      key: "profile",
      label: "Profile",
      icon: LuUser,
      path: "/user/profile",
      visible: true,
    },
    {
      key: "business",
      label: "Business",
      icon: LuBuilding2,
      path: "/user/business",
      visible: showBusinessTab,
    },
    {
      key: "banking",
      label: "Banking",
      icon: LuCreditCard,
      path: "/user/banking",
      visible: true,
    },
    {
      key: "credentials",
      label: "Credentials",
      icon: LuKey,
      path: "/user/credentials",
      visible: true,
    },
  ];

  // Role-based dashboard menu aligned with Header dropdown role menus
  const roleDashboardMenu = {
    MANAGER: [
      { name: "Dashboard", path: "/user/business/home", icon: RiDashboardLine },
      {
        name: "Questionnaires",
        path: "/user/business/service-questionnaires",
        icon: LuClipboardList,
      },
      {
        name: "Terms & Conditions",
        path: "/user/business/terms-and-conditions",
        icon: LuScrollText,
      },
      { name: "Clients", path: "/user/business/clients", icon: LuCircleUser },
      { name: "Services", path: "/user/business/services", icon: LuFileText },
      { name: "Quotes", path: "/user/business/quotes", icon: LuFileText },
      { name: "Invoices", path: "/user/business/invoices", icon: LuReceipt },
      {
        name: "Team Members",
        path: "/user/business/team-members",
        icon: LuUsers,
      },
      { name: "Jobs", path: "/user/business/jobs", icon: LuBriefcase },
      { name: "Payouts", path: "/user/business/payouts", icon: LuArrowUpRight },
      { name: "Trash", path: "/user/business/trash", icon: LuTrash2 },
    ],
    CLIENT: [
      { name: "Services", path: "/user/business/services", icon: LuFileText },
      { name: "Quotes", path: "/user/business/quotes", icon: LuFileText },
      { name: "Invoices", path: "/user/business/invoices", icon: LuFileText },
      { name: "Jobs", path: "/user/business/jobs", icon: LuBriefcase },
    ],
    EMPLOYEE: [
      { name: "Jobs", path: "/user/business/jobs", icon: LuBriefcase },
      {
        name: "Team Members",
        path: "/user/business/team-members",
        icon: LuUsers,
      },
    ],
  };
  const dashboardMenu = roleDashboardMenu[role] || [];

  // Helper function to check if a menu item should be highlighted
  const isMenuItemActive = (menuPath) => {
    const currentPath = location.pathname;

    // Exact match
    if (currentPath.startsWith(menuPath)) return true;

    // Map of plural menu paths to their singular detail page patterns
    const singularPatternsMap = {
      "/user/business/clients": "/user/business/client/",
      "/user/business/team-members": "/user/business/team-member/",
      "/user/business/services": "/user/business/service/",
      "/user/business/quotes": "/user/business/quote/",
      "/user/business/jobs": "/user/business/job/",
      "/user/business/invoices": "/user/business/invoice/",
      "/user/business/payouts": "/user/business/payout/",
      "/user/business/service-questionnaires":
        "/user/business/service-questionnaire/",
      "/user/business/terms-and-conditions":
        "/user/business/terms-and-condition/",
    };

    // Check if current path matches a singular detail page pattern
    const singularPattern = singularPatternsMap[menuPath];
    if (singularPattern && currentPath.startsWith(singularPattern)) {
      return true;
    }

    return false;
  };

  return (
    <aside className="hidden lg:block sidebar min-h-screen border-r border-gray-200 w-76 shrink-0">
      <WorkspaceNavigation
        user={{ ...currentUser, name: displayName, email: displayEmail }}
        accountItems={accountMenu}
        navigationItems={
          isBusinessRegistered && role && role !== "USER"
            ? dashboardMenu.map((item) => ({
                ...item,
                active: isMenuItemActive(item.path),
              }))
            : []
        }
        workspaceName={
          isBusinessRegistered && role && role !== "USER"
            ? currentUser?.business?.name ||
              businesses?.[0]?.name ||
              "Test Business"
            : null
        }
        onLogout={handleLogout}
      />
    </aside>
  );
}
