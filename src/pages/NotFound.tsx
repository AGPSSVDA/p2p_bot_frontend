import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="text-center surface-card rounded-2xl p-10 max-w-md"
      >
        <p className="text-7xl font-bold text-gradient-primary">404</p>
        <h1 className="mt-4 text-xl font-bold">Page not found</h1>
        <p className="text-sm text-muted-foreground mt-1.5">The page you are looking for doesn't exist.</p>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition">
          <Home className="h-4 w-4" /> Back to dashboard
        </Link>
      </motion.div>
    </div>
  );
}
