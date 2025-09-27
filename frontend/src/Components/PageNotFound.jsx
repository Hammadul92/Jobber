import { Link } from 'react-router-dom';

export default function PageNotFound() {
    return (
        <div className="container text-center my-5">
            <h1 className="display-4 text-danger mb-3">404</h1>
            <h3 className="mb-3">Page Not Found</h3>
            <p className="text-muted mb-4">The page you're looking for doesn't exist or has been moved.</p>
            <Link to="/" className="btn btn-success">
                Go to Home
            </Link>
        </div>
    );
}
