import { useState, useEffect } from 'react';

interface ThemeColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}

interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

interface ThemeRadius {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  radius: ThemeRadius;
  shadows: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
}

const defaultTheme: Theme = {
  colors: {
    primary: '#7033ff',
    primaryForeground: '#ffffff',
    secondary: '#edf0f4',
    secondaryForeground: '#080808',
    background: '#fdfdfd',
    foreground: '#000000',
    card: '#fdfdfd',
    cardForeground: '#000000',
    muted: '#f5f5f5',
    mutedForeground: '#525252',
    accent: '#e2ebff',
    accentForeground: '#1e69dc',
    destructive: '#e54b4f',
    destructiveForeground: '#ffffff',
    border: '#e7e7ee',
    input: '#ebebeb',
    ring: '#000000',
    chart1: '#4ac885',
    chart2: '#7033ff',
    chart3: '#fd822b',
    chart4: '#3276e4',
    chart5: '#747474',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },
};

function convertCSSValue(cssValue: string): string {
  if (typeof window === 'undefined') return cssValue;
  
  // If it's already a hex color, return as is
  if (cssValue.startsWith('#')) {
    return cssValue;
  }
  
  // Create a temporary element to convert CSS values to computed values
  const tempElement = document.createElement('div');
  tempElement.style.position = 'absolute';
  tempElement.style.visibility = 'hidden';
  tempElement.style.color = cssValue;
  document.body.appendChild(tempElement);
  
  const computedValue = getComputedStyle(tempElement).color;
  document.body.removeChild(tempElement);
  
  return computedValue || cssValue;
}

export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateTheme = () => {
      const root = getComputedStyle(document.documentElement);
      
      const getColorValue = (varName: string): string => {
        const value = root.getPropertyValue(varName).trim();
        return value ? convertCSSValue(value) : defaultTheme.colors.primary;
      };

      const updatedTheme: Theme = {
        colors: {
          primary: getColorValue('--primary'),
          primaryForeground: getColorValue('--primary-foreground'),
          secondary: getColorValue('--secondary'),
          secondaryForeground: getColorValue('--secondary-foreground'),
          background: getColorValue('--background'),
          foreground: getColorValue('--foreground'),
          card: getColorValue('--card'),
          cardForeground: getColorValue('--card-foreground'),
          muted: getColorValue('--muted'),
          mutedForeground: getColorValue('--muted-foreground'),
          accent: getColorValue('--accent'),
          accentForeground: getColorValue('--accent-foreground'),
          destructive: getColorValue('--destructive'),
          destructiveForeground: getColorValue('--destructive-foreground'),
          border: getColorValue('--border'),
          input: getColorValue('--input'),
          ring: getColorValue('--ring'),
          chart1: getColorValue('--chart-1'),
          chart2: getColorValue('--chart-2'),
          chart3: getColorValue('--chart-3'),
          chart4: getColorValue('--chart-4'),
          chart5: getColorValue('--chart-5'),
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem',
        },
        radius: {
          sm: `calc(${root.getPropertyValue('--radius').trim()} - 4px)`,
          md: `calc(${root.getPropertyValue('--radius').trim()} - 2px)`,
          lg: root.getPropertyValue('--radius').trim() || '0.75rem',
          xl: `calc(${root.getPropertyValue('--radius').trim()} + 4px)`,
        },
        shadows: {
          xs: root.getPropertyValue('--shadow-xs').trim() || defaultTheme.shadows.xs,
          sm: root.getPropertyValue('--shadow-sm').trim() || defaultTheme.shadows.sm,
          md: root.getPropertyValue('--shadow-md').trim() || defaultTheme.shadows.md,
          lg: root.getPropertyValue('--shadow-lg').trim() || defaultTheme.shadows.lg,
          xl: root.getPropertyValue('--shadow-xl').trim() || defaultTheme.shadows.xl,
          '2xl': root.getPropertyValue('--shadow-2xl').trim() || defaultTheme.shadows['2xl'],
        },
      };

      setTheme(updatedTheme);
    };

    updateTheme();

    // Listen for theme changes (if you implement theme switching)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => updateTheme();
    
    mediaQuery.addEventListener('change', handleThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  return theme;
} 