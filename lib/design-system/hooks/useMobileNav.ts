import { useState, useEffect } from 'react';

/**
 * Hook for managing mobile navigation state
 * Provides open/close functionality and handles responsive behavior
 */
export function useMobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  // Close mobile nav when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
