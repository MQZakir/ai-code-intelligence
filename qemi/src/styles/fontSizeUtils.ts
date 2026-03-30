import { css } from '@emotion/react';
import { theme } from '../theme';

// Font size utility functions for styled components
export const getFontSize = (size: keyof typeof theme.fontSize) => css`
  font-size: ${theme.fontSize[size]};
`;

// Helper function to get font size for components
export const getFontSizeByType = (type: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'label' | 'button') => {
  switch (type) {
    case 'h1':
      return getFontSize('xxl');
    case 'h2':
      return getFontSize('xl');
    case 'h3':
      return getFontSize('lg');
    case 'h4':
      return getFontSize('md');
    case 'h5':
      return getFontSize('base');
    case 'h6':
      return getFontSize('sm');
    case 'p':
      return getFontSize('base');
    case 'span':
      return getFontSize('base');
    case 'label':
      return getFontSize('sm');
    case 'button':
      return getFontSize('base');
    default:
      return getFontSize('base');
  }
}; 