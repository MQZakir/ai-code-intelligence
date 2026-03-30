import React, { useState, useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { theme } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';

const SelectInput = styled.div`
  position: relative;
  min-width: 200px;
`;

const SelectButton = styled.button<{ $isDarkMode: boolean }>`
  background-color: var(--color-background, ${theme.colors.background});
  color: var(--color-text, ${theme.colors.text});
  border: 1px solid var(--color-border, ${theme.colors.border});
  border-radius: ${theme.borderRadius.small};
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.9rem;
  cursor: pointer;
  width: 100%;
  text-align: left;
  position: relative;
  transition: ${theme.transitions.default};
  
  &:after {
    content: '';
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    background-image: ${props => `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23${props.$isDarkMode ? 'ffffff' : '222222'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`};
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
  }
  
  &:focus {
    outline: none;
    border-color: var(--color-primary, ${theme.colors.primary});
    box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb, 230, 255, 75), 0.1);
  }
  
  &:hover {
    border-color: var(--color-primary, ${theme.colors.primary});
  }
`;

const OptionsList = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--color-background, ${theme.colors.background});
  border: 1px solid var(--color-border, ${theme.colors.border});
  border-radius: ${theme.borderRadius.small};
  margin-top: 0.5rem;
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;
`;

const Option = styled.div`
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: ${theme.transitions.default};
  font-size: 0.9rem;
  line-height: 1.5;
  
  &:hover {
    background-color: var(--color-hover, ${theme.colors.hover});
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid var(--color-border, ${theme.colors.border});
  }
`;

export interface DropdownProps {
  options: { value: string; label: string }[];
  defaultValue?: string;
  value?: string;
  onChange: (value: string) => void;
}

export const Dropdown: React.FC<DropdownProps> = ({ 
  options, 
  defaultValue, 
  value, 
  onChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || defaultValue || options[0]?.value || '');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isDarkMode } = useTheme();

  // Update the selected value when the value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (value: string) => {
    setSelectedValue(value);
    onChange(value);
    setIsOpen(false);
  };

  const selectedLabel = options.find(opt => opt.value === selectedValue)?.label || selectedValue;

  return (
    <SelectInput ref={dropdownRef}>
      <SelectButton 
        $isDarkMode={isDarkMode} 
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedLabel}
      </SelectButton>
      {isOpen && (
        <OptionsList>
          {options.map((option) => (
            <Option 
              key={option.value} 
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </Option>
          ))}
        </OptionsList>
      )}
    </SelectInput>
  );
}; 