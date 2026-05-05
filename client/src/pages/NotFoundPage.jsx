import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Heart } from 'lucide-react';

const NotFoundPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0a0a0b' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                <div className="text-8xl font-bold gradient-text mb-4">404</div>
                <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
                <p className="text-zinc-500 mb-8">The page you're looking for doesn't exist.</p>
                <Link to="/" className="btn-primary inline-flex items-center gap-2">
                    <Home className="w-5 h-5" /> Go Home
                </Link>
            </motion.div>
        </div>
    );
};

export default NotFoundPage;
