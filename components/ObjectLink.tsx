import Link from 'next/link';
import { IconExternalLink, IconTable } from '@tabler/icons-react';
import { ActionIcon, Anchor, Badge, Group, Text, Tooltip } from '@mantine/core';
import { MetadataPreview } from './MetadataPreview';

interface ObjectLinkProps {
  objectName: string;
  label?: string;
  showIcon?: boolean;
  showExternalIcon?: boolean;
  showCustomBadge?: boolean;
  isCustom?: boolean;
  variant?: 'link' | 'button' | 'text';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showPreview?: boolean;
  truncate?: boolean;
  children?: React.ReactNode;
}

export function ObjectLink({
  objectName,
  label,
  showIcon = true,
  showExternalIcon = false,
  showCustomBadge = false,
  isCustom = false,
  variant = 'link',
  size = 'sm',
  showPreview = true,
  truncate = false,
  children,
}: ObjectLinkProps) {
  const displayLabel = label || objectName;
  const linkHref = `/objects?object=${encodeURIComponent(objectName)}`;

  const content = children || (
    <Group gap="xs" wrap="nowrap">
      {showIcon && <IconTable size={size === 'xs' ? 12 : size === 'sm' ? 14 : 16} />}
      <Text
        size={size}
        style={truncate ? { flex: 1, minWidth: 0 } : undefined}
        truncate={truncate}
      >
        {displayLabel}
      </Text>
      {showCustomBadge && isCustom && (
        <Badge size="xs" color="orange">
          Custom
        </Badge>
      )}
      {showExternalIcon && (
        <IconExternalLink size={size === 'xs' ? 10 : size === 'sm' ? 12 : 14} />
      )}
    </Group>
  );

  const linkElement = (
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

  if (showPreview) {
    return (
      <MetadataPreview objectName={objectName}>
        {linkElement}
      </MetadataPreview>
    );
  }

  return linkElement;
}

interface ObjectLinkButtonProps {
  objectName: string;
  label?: string;
  tooltip?: string;
  showPreview?: boolean;
  onClick?: () => void;
}

/**
 * ObjectLink as an ActionIcon button
 */
export function ObjectLinkButton({
  objectName,
  label,
  tooltip,
  showPreview = true,
  onClick,
}: ObjectLinkButtonProps) {
  const handleClick = () => {
    onClick?.();
    // Navigate to objects page with the selected object
    window.location.href = `/objects?object=${encodeURIComponent(objectName)}`;
  };

  const button = (
    <Tooltip label={tooltip || `View ${label || objectName} details`}>
      <ActionIcon
        variant="subtle"
        size="sm"
        onClick={handleClick}
      >
        <IconTable size={14} />
      </ActionIcon>
    </Tooltip>
  );

  if (showPreview) {
    return (
      <MetadataPreview objectName={objectName}>
        {button}
      </MetadataPreview>
    );
  }

  return button;
}
