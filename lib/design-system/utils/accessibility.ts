import { useEffect, useRef, useCallback } from 'react';

/**
 * Screen Reader Only Text Utility
 * 
 * CSS class for visually hiding content while keeping it accessible to screen readers.
 * Already defined in globals.css as .sr-only
 */
export const srOnlyClass = 'sr-only';

/**
 * Creates screen reader only text element
 */
export function createSrOnlyText(text: string): string {
  return `<span class="${srOnlyClass}">${text}</span>`;
}

/**
 * Focus Trap Hook
 * 
 * Traps keyboard focus within a container element (useful for modals and dialogs).
 * Ensures Tab and Shift+Tab cycle through focusable elements within the container.
 * 
 * @param isActive - Whether the focus trap is active
 * @returns Ref to attach to the container element
 * 
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const trapRef = useFocusTrap(isOpen);
 *   
 *   return (
 *     <div ref={trapRef} role="dialog">
 *       <button onClick={onClose}>Close</button>
 *       <input type="text" />
 *       <button>Submit</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(isActive: boolean) {
  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store the currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Get all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      if (!containerRef.current) return [];

      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      return Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
      ).filter((el) => {
        // Filter out elements that are not visible
        return el.offsetParent !== null;
      });
    };

    // Focus the first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Handle Tab key to trap focus
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab: Move focus backwards
        if (activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: Move focus forwards
        if (activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup: restore focus to previous element
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Keyboard Navigation Utilities
 */

/**
 * Arrow key navigation directions
 */
export type ArrowDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Hook for handling arrow key navigation
 * 
 * @param onNavigate - Callback when arrow key is pressed
 * @param enabled - Whether navigation is enabled
 * 
 * @example
 * ```tsx
 * function Dropdown({ items }) {
 *   const [selectedIndex, setSelectedIndex] = useState(0);
 *   
 *   useArrowKeyNavigation((direction) => {
 *     if (direction === 'down') {
 *       setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
 *     } else if (direction === 'up') {
 *       setSelectedIndex((prev) => Math.max(prev - 1, 0));
 *     }
 *   }, true);
 *   
 *   return <div>{items.map((item, i) => ...)}</div>;
 * }
 * ```
 */
export function useArrowKeyNavigation(
  onNavigate: (direction: ArrowDirection) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          onNavigate('up');
          break;
        case 'ArrowDown':
          event.preventDefault();
          onNavigate('down');
          break;
        case 'ArrowLeft':
          event.preventDefault();
          onNavigate('left');
          break;
        case 'ArrowRight':
          event.preventDefault();
          onNavigate('right');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate, enabled]);
}

/**
 * Hook for handling Escape key press
 * 
 * @param onEscape - Callback when Escape is pressed
 * @param enabled - Whether the handler is enabled
 * 
 * @example
 * ```tsx
 * function Modal({ onClose }) {
 *   useEscapeKey(onClose, true);
 *   return <div>Modal content</div>;
 * }
 * ```
 */
export function useEscapeKey(onEscape: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, enabled]);
}

/**
 * ARIA Attribute Helpers
 */

/**
 * Generates ARIA attributes for a button that controls another element
 * 
 * @param controlsId - ID of the controlled element
 * @param isExpanded - Whether the controlled element is expanded
 * @returns ARIA attributes object
 * 
 * @example
 * ```tsx
 * <button {...getAriaControlsProps('menu', isOpen)}>
 *   Toggle Menu
 * </button>
 * <div id="menu" role="menu">...</div>
 * ```
 */
export function getAriaControlsProps(controlsId: string, isExpanded: boolean) {
  return {
    'aria-controls': controlsId,
    'aria-expanded': isExpanded,
  };
}

/**
 * Generates ARIA attributes for a form field with error
 * 
 * @param fieldId - ID of the field
 * @param errorId - ID of the error message element
 * @param hasError - Whether the field has an error
 * @returns ARIA attributes object
 * 
 * @example
 * ```tsx
 * <input
 *   id="email"
 *   {...getAriaErrorProps('email', 'email-error', !!errors.email)}
 * />
 * {errors.email && <p id="email-error">{errors.email}</p>}
 * ```
 */
export function getAriaErrorProps(fieldId: string, errorId: string, hasError: boolean) {
  return {
    'aria-invalid': hasError,
    'aria-describedby': hasError ? errorId : undefined,
  };
}

/**
 * Generates ARIA attributes for a required field
 * 
 * @param isRequired - Whether the field is required
 * @returns ARIA attributes object
 */
export function getAriaRequiredProps(isRequired: boolean) {
  return {
    'aria-required': isRequired,
    required: isRequired,
  };
}

/**
 * Generates ARIA live region attributes
 * 
 * @param politeness - Politeness level ('polite' | 'assertive' | 'off')
 * @param atomic - Whether the entire region should be announced
 * @returns ARIA attributes object
 * 
 * @example
 * ```tsx
 * <div {...getAriaLiveProps('polite', true)}>
 *   {statusMessage}
 * </div>
 * ```
 */
export function getAriaLiveProps(
  politeness: 'polite' | 'assertive' | 'off' = 'polite',
  atomic: boolean = false
) {
  return {
    'aria-live': politeness,
    'aria-atomic': atomic,
  };
}

/**
 * Generates unique ID for accessibility purposes
 * 
 * @param prefix - Prefix for the ID
 * @returns Unique ID string
 */
let idCounter = 0;
export function generateId(prefix: string = 'a11y'): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/**
 * Hook to generate and maintain a stable unique ID
 * 
 * @param prefix - Prefix for the ID
 * @returns Stable unique ID
 * 
 * @example
 * ```tsx
 * function FormField({ label }) {
 *   const id = useId('field');
 *   return (
 *     <>
 *       <label htmlFor={id}>{label}</label>
 *       <input id={id} />
 *     </>
 *   );
 * }
 * ```
 */
export function useId(prefix: string = 'a11y'): string {
  const idRef = useRef<string | undefined>(undefined);
  
  if (!idRef.current) {
    idRef.current = generateId(prefix);
  }
  
  return idRef.current;
}

/**
 * Announces a message to screen readers
 * 
 * @param message - Message to announce
 * @param politeness - Politeness level
 * 
 * @example
 * ```tsx
 * function handleSubmit() {
 *   // ... submit logic
 *   announceToScreenReader('Form submitted successfully', 'polite');
 * }
 * ```
 */
export function announceToScreenReader(
  message: string,
  politeness: 'polite' | 'assertive' = 'polite'
) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', politeness);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = srOnlyClass;
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Check if an element is focusable
 * 
 * @param element - Element to check
 * @returns Whether the element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  if (element.hasAttribute('disabled')) return false;
  if (element.getAttribute('tabindex') === '-1') return false;
  if (element.offsetParent === null) return false; // Hidden element

  const focusableSelectors = [
    'a[href]',
    'button',
    'textarea',
    'input',
    'select',
    '[tabindex]',
  ];

  return focusableSelectors.some((selector) => element.matches(selector));
}

/**
 * Get all focusable elements within a container
 * 
 * @param container - Container element
 * @returns Array of focusable elements
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelectors)
  ).filter((el) => el.offsetParent !== null);
}
