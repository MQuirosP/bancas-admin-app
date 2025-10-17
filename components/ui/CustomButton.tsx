// components/ui/CustomButton.tsx
import React from 'react';
import { Button, ButtonProps, Spinner } from 'tamagui';

interface CustomButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';
  loading?: boolean;
}

export function CustomButton({
  variant = 'primary',
  loading = false,
  children,
  disabled,
  ...props
}: CustomButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: '$info',
          color: 'white',
          hoverStyle: {
            backgroundColor: '$blue11',
            scale: 1.02,
          },
          pressStyle: {
            backgroundColor: '$blue9',
            scale: 0.98,
          },
        };
      case 'secondary':
        return {
          backgroundColor: '$gray8',
          color: 'white',
          hoverStyle: {
            backgroundColor: '$gray9',
            scale: 1.02,
          },
          pressStyle: {
            backgroundColor: '$gray7',
            scale: 0.98,
          },
        };
      case 'success':
        return {
          backgroundColor: '$green10',
          color: 'white',
          hoverStyle: {
            backgroundColor: '$green11',
            scale: 1.02,
          },
          pressStyle: {
            backgroundColor: '$green9',
            scale: 0.98,
          },
        };
      case 'danger':
        return {
          backgroundColor: '$red10',
          color: 'white',
          hoverStyle: {
            backgroundColor: '$red11',
            scale: 1.02,
          },
          pressStyle: {
            backgroundColor: '$red9',
            scale: 0.98,
          },
        };
      case 'warning':
        return {
          backgroundColor: '$orange10',
          color: 'white',
          hoverStyle: {
            backgroundColor: '$orange11',
            scale: 1.02,
          },
          pressStyle: {
            backgroundColor: '$orange9',
            scale: 0.98,
          },
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: '$color',
          borderWidth: 1,
          borderColor: '$borderColor',
          hoverStyle: {
            backgroundColor: '$backgroundHover',
            scale: 1.02,
          },
          pressStyle: {
            backgroundColor: '$backgroundPress',
            scale: 0.98,
          },
        };
      default:
        return {};
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Button
      {...variantStyles}
      {...props}
      disabled={disabled || loading}
      icon={loading ? <Spinner color={variantStyles.color} /> : props.icon}
      borderRadius="$3"
      fontWeight="600"
      shadowColor="$borderColor"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.1}
      shadowRadius={4}
      disabledStyle={{
        opacity: 0.5,
        cursor: 'not-allowed',
      }}
    >
      {children}
    </Button>
  );
}