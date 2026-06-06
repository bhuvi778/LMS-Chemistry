import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="min-h-[60vh] grid place-items-center text-center px-4">
      <div>
        <div className="text-7xl font-display font-extrabold gradient-text">404</div>
        <h2 className="font-display text-2xl font-bold mt-2">Page not found</h2>
        <p className="text-slate-500 mt-2">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary mt-6">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
