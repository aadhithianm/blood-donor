import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Tooltip = ({ children, content }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div 
            className="relative inline-flex items-center justify-center cursor-help"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full mb-2 px-3 py-1.5 text-xs text-white bg-zinc-800 dark:bg-zinc-700 rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none font-medium text-center"
                    >
                        {content}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-800 dark:border-t-zinc-700" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
