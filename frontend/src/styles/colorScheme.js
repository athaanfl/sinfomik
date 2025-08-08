// Unified Color Scheme for SINFOMIK Application
// A harmonious color palette that's easy on the eyes

export const colorScheme = {
  // Primary Brand Colors - Soft Blue Theme
  primary: {
    50: 'bg-blue-50',
    100: 'bg-blue-100',
    500: 'bg-blue-500',
    600: 'bg-blue-600',
    700: 'bg-blue-700',
    gradientMain: 'from-blue-500 to-indigo-600',
    gradientLight: 'from-blue-50 to-indigo-100',
    gradientHover: 'from-blue-600 to-indigo-700'
  },
  
  // Text Colors
  text: {
    primary: 'text-gray-800',
    secondary: 'text-gray-600',
    light: 'text-gray-500',
    white: 'text-white',
    primaryGradient: 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'
  },
  
  // Status Colors
  status: {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-700',
      icon: 'text-green-500'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-700',
      icon: 'text-red-500'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-500',
      text: 'text-yellow-700',
      icon: 'text-yellow-500'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      text: 'text-blue-700',
      icon: 'text-blue-500'
    }
  },
  
  // Button Colors
  buttons: {
    primary: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-600',
    success: 'bg-green-500 hover:bg-green-600',
    danger: 'bg-red-500 hover:bg-red-600',
    edit: 'bg-blue-500 hover:bg-blue-600',
    delete: 'bg-red-50 text-red-600 hover:bg-red-100'
  },
  
  // Background Colors
  backgrounds: {
    main: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    card: 'bg-white/90',
    header: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    sidebar: 'bg-gray-800',
    overlay: 'bg-black bg-opacity-50'
  },
  
  // Input & Form Colors
  forms: {
    input: 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    inputBg: 'bg-white',
    label: 'text-gray-500 peer-focus:text-blue-600',
    disabled: 'bg-gray-100 text-gray-500'
  },
  
  // Icon Colors (consistent with theme)
  icons: {
    primary: 'text-blue-500',
    secondary: 'text-indigo-500',
    success: 'text-green-500',
    danger: 'text-red-500',
    warning: 'text-yellow-500'
  },
  
  // Hover & Interaction States
  interactions: {
    hover: 'hover:shadow-lg hover:-translate-y-0.5',
    active: 'active:scale-95',
    focus: 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    transition: 'transition-all duration-200'
  }
};

// Helper functions for easy access
export const getStatusClasses = (type) => {
  const statusType = colorScheme.status[type] || colorScheme.status.info;
  return `${statusType.bg} ${statusType.border} ${statusType.text} border-l-4`;
};

export const getButtonClasses = (variant = 'primary', size = 'default') => {
  const baseClasses = 'px-6 py-2 rounded-lg font-medium shadow-lg transform transition-all duration-200';
  const variantClasses = colorScheme.buttons[variant] || colorScheme.buttons.primary;
  const hoverClasses = 'hover:-translate-y-0.5 hover:shadow-xl';
  
  return `${baseClasses} ${variantClasses} ${hoverClasses}`;
};

export const getCardClasses = () => {
  return `${colorScheme.backgrounds.card} backdrop-blur-sm rounded-2xl shadow-xl p-6 transition-all duration-300 hover:shadow-2xl`;
};

export const getHeaderClasses = () => {
  return `${colorScheme.backgrounds.header} -m-6 mb-6 p-6 rounded-t-2xl`;
};
