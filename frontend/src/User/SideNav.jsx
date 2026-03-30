import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { LuLogOut, LuUser, LuReceipt, LuBriefcase, LuArrowUpRight, LuFileText, LuUsers, LuCircleUser, LuClipboardList, LuBuilding2, LuCreditCard, LuKey } from "react-icons/lu";
import { RiDashboardLine } from "react-icons/ri";
import {
    useFetchBusinessesQuery,
    useFetchUserQuery,
    useLogoutUserMutation,
    userApi,
    businessApi,
    clientApi,
    serviceQuestionnaireApi,
    teamMemberApi,
    serviceApi,
    quoteApi,
    jobApi,
    bankingInformationApi,
    invoiceApi,
    payoutApi,
} from '../store';

// Unified Sidebar for both UserAccount and UserDashboard
export default function SideNav({ user, businessRegistered }) {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const token = localStorage.getItem('token');
    const [logoutUser] = useLogoutUserMutation();

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
    const showBusinessTab = role === 'USER' || role === 'MANAGER' || hasBusiness;
    const displayName =
        currentUser?.name ||
        currentUser?.full_name ||
        [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(' ') ||
        'User';
    const displayEmail = currentUser?.email || '';

    // Account menu items
    const accountMenu = [
        { key: 'profile', label: 'Profile', icon: LuUser, path: '/user/profile', visible: true },
        { key: 'business', label: 'Business', icon: LuBuilding2, path: '/user/business', visible: showBusinessTab },
        { key: 'banking', label: 'Banking', icon: LuCreditCard, path: '/user/banking', visible: true },
        { key: 'credentials', label: 'Credentials', icon: LuKey, path: '/user/credentials', visible: true },
    ];

    // Role-based dashboard menu aligned with Header dropdown role menus
    const roleDashboardMenu = {
        MANAGER: [
            { name: 'Dashboard', path: '/user/business/home', icon: RiDashboardLine },
            { name: 'Team Members', path: '/user/business/team-members', icon: LuUsers },
            { name: 'Clients', path: '/user/business/clients', icon: LuCircleUser },
            { name: 'Questionnaires', path: '/user/business/service-questionnaires', icon: LuClipboardList },
            { name: 'Quotes', path: '/user/business/quotes', icon: LuFileText },
            { name: 'Jobs', path: '/user/business/jobs', icon: LuBriefcase },
            { name: 'Payouts', path: '/user/business/payouts', icon: LuArrowUpRight },
            { name: 'Invoices', path: '/user/business/invoices', icon: LuReceipt },
        ],
        CLIENT: [
            { name: 'Services', path: '/user/business/services', icon: LuFileText },
            { name: 'Quotes', path: '/user/business/quotes', icon: LuFileText },
            { name: 'Jobs', path: '/user/business/jobs', icon: LuBriefcase },
            { name: 'Invoices', path: '/user/business/invoices', icon: LuFileText },
        ],
        EMPLOYEE: [
            { name: 'Jobs', path: '/user/business/jobs', icon: LuBriefcase },
            { name: 'Team Members', path: '/user/business/team-members', icon: LuUsers },
        ],
    };
    const dashboardMenu = roleDashboardMenu[role] || [];

    const handleLogout = async () => {
        await logoutUser();
        [
            userApi,
            businessApi,
            clientApi,
            serviceQuestionnaireApi,
            teamMemberApi,
            serviceApi,
            quoteApi,
            jobApi,
            bankingInformationApi,
            invoiceApi,
            payoutApi,
        ].forEach((api) => dispatch(api.util.resetApiState()));

        localStorage.removeItem('token');
        navigate('/sign-in');
    };

    return (
        <aside className="hidden md:block sidebar min-h-screen px-4 py-6 w-92">
            <div className='bg-white min-h-full flex flex-col shadow-md rounded-2xl p-6'>

                {/* Profile Section */}
                <div className="flex items-center gap-3 mb-6">
                    {/* Profile avatar */}
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                        {currentUser?.profile_picture ? (
                            <img src={currentUser.profile_picture} alt="Profile" className="h-full w-full rounded-full object-cover" />
                        ) : (
                            <span className="text-gray-500 text-lg font-bold">{displayName.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <div>
                        <div className="font-semibold text-xl">{displayName}</div>
                        <div className="text-sm text-gray-500">{displayEmail}</div>
                    </div>
                </div>

                {/* Account Menu */}
                <nav className="mb-4 space-y-1 bg-gray-50 border border-gray-100 p-2 rounded-xl">
                    {accountMenu.filter((item) => item.visible).map(item => (
                        <NavLink
                            key={item.key}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-xl p-3 font-medium transition ${isActive
                                    ? 'bg-accent text-white font-bold shadow-lg shadow-accent/50'
                                    : 'text-gray-500 hover:bg-secondary hover:text-white font-medium'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Workspace Section */}
                {isBusinessRegistered && role && role !== 'USER' && (
                    <div className="mt-4 text-[0.7rem] text-gray-400 font-semibold">WORKSPACE</div>
                )}
                {isBusinessRegistered && role && role !== 'USER' && (
                    <div className="mb-4 font-bold text-lg text-gray-900">{currentUser?.business?.name || businesses?.[0]?.name || 'Test Business'}</div>
                )}

                {/* Dashboard Menu */}
                <nav className="mb-4 space-y-1 px-2 rounded-xl">
                    {isBusinessRegistered && role && role !== 'USER' &&
                        dashboardMenu.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-xl p-3 font-medium transition ${isActive
                                        ? 'bg-gray-100 text-black font-bold'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-black font-medium'
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.name}</span>
                            </NavLink>
                        ))}
                </nav>

                {/* Logout */}
                <div className="mt-auto pt-6 px-3">
                    <button
                        onClick={handleLogout}
                        type="button"
                        className=" p-3 flex items-center gap-2 text-gray-500 hover:text-accent hover:bg-gray-100 w-full text-sm font-medium rounded-xl"
                    >
                        <LuLogOut className="w-5 h-5" />
                        Logout Account
                    </button>
                </div>

            </div>
        </aside>
    );
}
