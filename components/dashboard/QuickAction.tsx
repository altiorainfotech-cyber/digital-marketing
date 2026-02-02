import React from 'react';
import { Button } from '@/lib/design-system/components/primitives';
import { Icon } from '@/lib/design-system/components/primitives';

export interface QuickActionProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

export function QuickAction({ label, icon, onClick, variant = 'outline' }: QuickActionProps) {
  return (
    <Button
      variant={variant}
      size="md"
      onClick={onClick}
      icon={<Icon size={20}>{icon}</Icon>}
      iconPosition="left"
      fullWidth
      className="justify-start"
    >
      {label}
    </Button>
  );
}
