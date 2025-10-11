import { Link } from 'react-router-dom';

export default function DashboardHome({ token, role }) {
    return (
        <div>
            <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to={`/dashboard/home`} className="text-success">
                            Dashboard
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        Home
                    </li>
                </ol>
            </nav>
        </div>
    );
}
