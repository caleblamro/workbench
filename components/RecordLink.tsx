import Link from 'next/link';
import { IconExternalLink } from '@tabler/icons-react';
import { Anchor, Group, Text } from '@mantine/core';

interface RecordLinkProps {
  objectType: string;
  recordId: string;
  label?: string;
  showExternalIcon?: boolean;
  variant?: 'link' | 'text';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  truncate?: boolean;
  children?: React.ReactNode;
}

export function RecordLink({
  objectType,
  recordId,
  label,
  showExternalIcon = false,
  variant = 'link',
  size = 'sm',
  truncate = false,
  children,
}: RecordLinkProps) {
  const displayLabel = label || recordId;
  const linkHref = `/record/${encodeURIComponent(objectType)}/${encodeURIComponent(recordId)}`;

  const content = children || (
    <Group gap="xs" wrap="nowrap">
      <Text
        size={size}
        style={truncate ? { flex: 1, minWidth: 0 } : undefined}
        truncate={truncate}
      >
        {displayLabel}
      </Text>
      {showExternalIcon && (
        <IconExternalLink size={size === 'xs' ? 10 : size === 'sm' ? 12 : 14} />
      )}
    </Group>
  );

  return (
    <Link href={linkHref} passHref legacyBehavior>
      <Anchor
        component="a"
        underline={variant === 'link' ? 'hover' : 'never'}
        c={variant === 'text' ? 'inherit' : undefined}
      >
        {content}
      </Anchor>
    </Link>
  );
}
