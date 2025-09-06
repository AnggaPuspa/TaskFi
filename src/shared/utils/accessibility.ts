import { AccessibilityRole, AccessibilityState, AccessibilityInfo } from 'react-native';

// Accessibility role definitions
export const ACCESSIBILITY_ROLES = {
  BUTTON: 'button' as AccessibilityRole,
  TEXT: 'text' as AccessibilityRole,
  HEADER: 'header' as AccessibilityRole,
  LINK: 'link' as AccessibilityRole,
  IMAGE: 'image' as AccessibilityRole,
  CHECKBOX: 'checkbox' as AccessibilityRole,
  RADIO: 'radio' as AccessibilityRole,
  TABLIST: 'tablist' as AccessibilityRole,
  TAB: 'tab' as AccessibilityRole,
  TEXTINPUT: 'none' as AccessibilityRole, // Use 'none' for TextInput
  LIST: 'list' as AccessibilityRole,
  LISTITEM: 'none' as AccessibilityRole, // Use 'none' for list items
  PROGRESSBAR: 'progressbar' as AccessibilityRole,
  SLIDER: 'adjustable' as AccessibilityRole,
  SWITCH: 'switch' as AccessibilityRole,
  MENU: 'menu' as AccessibilityRole,
  MENUITEM: 'menuitem' as AccessibilityRole,
  ALERT: 'alert' as AccessibilityRole,
  TOOLBAR: 'toolbar' as AccessibilityRole,
};

// Accessibility traits for better screen reader support
export const ACCESSIBILITY_TRAITS = {
  DISABLED: { disabled: true } as AccessibilityState,
  SELECTED: { selected: true } as AccessibilityState,
  CHECKED: { checked: true } as AccessibilityState,
  UNCHECKED: { checked: false } as AccessibilityState,
  EXPANDED: { expanded: true } as AccessibilityState,
  COLLAPSED: { expanded: false } as AccessibilityState,
  BUSY: { busy: true } as AccessibilityState,
};

// Accessibility hint generators
export const createAccessibilityHints = {
  button: (action: string) => `Tap to ${action}`,
  checkbox: (isChecked: boolean, item: string) => 
    `${isChecked ? 'Uncheck' : 'Check'} ${item}`,
  navigation: (destination: string) => `Navigate to ${destination}`,
  form: (field: string) => `Enter ${field}`,
  amount: (currency: string = '$') => `Enter amount in ${currency}`,
  date: () => 'Select date',
  time: () => 'Select time',
  priority: () => 'Set task priority',
  category: () => 'Choose category',
  save: () => 'Save changes',
  delete: () => 'Delete item permanently',
  edit: () => 'Edit item details',
  toggle: (state: boolean, feature: string) => 
    `${state ? 'Disable' : 'Enable'} ${feature}`,
};

// Screen reader announcements
export const announceToScreenReader = (message: string) => {
  AccessibilityInfo.announceForAccessibility(message);
};

// Accessibility label formatters
export const formatAccessibilityLabel = {
  transaction: (title: string, amount: number, type: 'income' | 'expense', currency: string = '$') =>
    `${type === 'income' ? 'Income' : 'Expense'} transaction: ${title}, ${currency}${amount.toLocaleString()}`,
  
  todo: (title: string, priority: string, isCompleted: boolean, dueDate?: string) => {
    let label = `${isCompleted ? 'Completed' : 'Pending'} task: ${title}, ${priority} priority`;
    if (dueDate && !isCompleted) {
      label += `, due ${new Date(dueDate).toLocaleDateString()}`;
    }
    return label;
  },
  
  balance: (amount: number, currency: string = '$') =>
    `Current balance: ${currency}${Math.abs(amount).toLocaleString()}, ${amount >= 0 ? 'positive' : 'negative'}`,
  
  filter: (filterType: string, isActive: boolean) =>
    `${filterType} filter, ${isActive ? 'active' : 'inactive'}`,
  
  chart: (title: string, value?: string) =>
    `Chart: ${title}${value ? `, current value ${value}` : ''}`,
  
  progress: (current: number, total: number, unit: string = '') =>
    `Progress: ${current} of ${total} ${unit}`,
};

// Focus management utilities
export const focusManager = {
  // Set focus to element after action
  focusAfterAction: (elementRef: React.RefObject<any>, delay: number = 100) => {
    setTimeout(() => {
      if (elementRef.current && elementRef.current.focus) {
        elementRef.current.focus();
      }
    }, delay);
  },
  
  // Announce completion of action
  announceCompletion: (action: string, success: boolean = true) => {
    const message = success ? `${action} completed` : `${action} failed`;
    announceToScreenReader(message);
  },
};

// High contrast support
export const highContrastColors = {
  text: '#000000',
  background: '#FFFFFF',
  primary: '#0000FF',
  secondary: '#800080',
  success: '#008000',
  warning: '#FFA500',
  error: '#FF0000',
  border: '#000000',
};

// Accessibility validation
export const validateAccessibility = {
  hasLabel: (label?: string) => Boolean(label && label.trim()),
  hasRole: (role?: AccessibilityRole) => Boolean(role),
  hasMinimumTouchTarget: (width: number, height: number, minimum: number = 44) =>
    width >= minimum && height >= minimum,
  
  checkComponent: (props: {
    accessibilityLabel?: string;
    accessibilityRole?: AccessibilityRole;
    accessibilityHint?: string;
    dimensions?: { width: number; height: number };
  }) => {
    const issues: string[] = [];
    
    if (!validateAccessibility.hasLabel(props.accessibilityLabel)) {
      issues.push('Missing accessibility label');
    }
    
    if (!validateAccessibility.hasRole(props.accessibilityRole)) {
      issues.push('Missing accessibility role');
    }
    
    if (props.dimensions && !validateAccessibility.hasMinimumTouchTarget(
      props.dimensions.width,
      props.dimensions.height
    )) {
      issues.push('Touch target too small (minimum 44pt)');
    }
    
    return {
      isAccessible: issues.length === 0,
      issues,
    };
  },
};

// Screen reader friendly date formatting
export const formatDateForScreenReader = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  if (dateObj.toDateString() === today.toDateString()) {
    return 'today';
  } else if (dateObj.toDateString() === yesterday.toDateString()) {
    return 'yesterday';
  } else if (dateObj.toDateString() === tomorrow.toDateString()) {
    return 'tomorrow';
  } else {
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
};

// Screen reader friendly number formatting
export const formatNumberForScreenReader = (
  amount: number,
  currency: string = 'dollars',
  includeDecimal: boolean = true
): string => {
  const wholePart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - wholePart) * 100);
  
  let result = '';
  
  if (amount < 0) {
    result += 'negative ';
  }
  
  if (wholePart === 0) {
    result += 'zero';
  } else if (wholePart === 1) {
    result += `one ${currency.slice(0, -1)}`; // Remove 's' for singular
  } else {
    result += `${wholePart} ${currency}`;
  }
  
  if (includeDecimal && decimalPart > 0) {
    result += ` and ${decimalPart} cents`;
  }
  
  return result;
};

// Semantic markup helpers
export const semanticMarkup = {
  heading: (level: 1 | 2 | 3 | 4 | 5 | 6) => ({
    accessibilityRole: ACCESSIBILITY_ROLES.HEADER,
    accessibilityLevel: level,
  }),
  
  list: {
    container: () => ({
      accessibilityRole: ACCESSIBILITY_ROLES.LIST,
    }),
    item: (position: number, total: number) => ({
      accessibilityRole: ACCESSIBILITY_ROLES.LISTITEM,
      accessibilityLabel: `Item ${position} of ${total}`,
    }),
  },
  
  form: {
    field: (label: string, required: boolean = false) => ({
      accessibilityLabel: `${label}${required ? ', required' : ''}`,
      accessibilityRequired: required,
    }),
    
    error: (message: string) => ({
      accessibilityRole: ACCESSIBILITY_ROLES.ALERT,
      accessibilityLabel: `Error: ${message}`,
      accessibilityLiveRegion: 'assertive' as const,
    }),
  },
  
  navigation: {
    tab: (title: string, isSelected: boolean, position: number, total: number) => ({
      accessibilityRole: ACCESSIBILITY_ROLES.TAB,
      accessibilityLabel: `${title} tab, ${position} of ${total}`,
      accessibilityState: { selected: isSelected },
    }),
    
    button: (label: string, destination?: string) => ({
      accessibilityRole: ACCESSIBILITY_ROLES.BUTTON,
      accessibilityLabel: label,
      accessibilityHint: destination ? createAccessibilityHints.navigation(destination) : undefined,
    }),
  },
};

// Reduced motion support
export const shouldReduceMotion = async (): Promise<boolean> => {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch {
    return false;
  }
};

// Text scaling support
export const getTextScaleFactor = async (): Promise<number> => {
  try {
    const isEnabled = await AccessibilityInfo.isReduceTransparencyEnabled();
    return isEnabled ? 1.2 : 1.0; // Increase text size if reduce transparency is enabled
  } catch {
    return 1.0;
  }
};