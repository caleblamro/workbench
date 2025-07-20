import { useRef, useState } from 'react';
import { IconEye, IconTable } from '@tabler/icons-react';
import {
  Badge,
  Box,
  Divider,
  Group,
  Loader,
  Popover,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core';
import type { ObjectMetadata } from '../lib/metadata-cache';
import { getFieldTypeColor, getFieldTypeIconSmall } from '../lib/salesforce-field-utils';

interface MetadataPreviewProps {
  objectName: string;
  children: React.ReactNode;
}

export function MetadataPreview({ objectName, children }: MetadataPreviewProps) {
  const [metadata, setMetadata] = useState<ObjectMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  const loadMetadata = async () => {
    if (metadata || loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/salesforce/object/${objectName}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata for ${objectName}`);
      }
      const data = await response.json();
      setMetadata(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setOpened(true);
    loadMetadata();
  };

  const handleMouseLeave = () => {
    // Add a small delay before closing to allow moving to popover content
    timeoutRef.current = setTimeout(() => {
      setOpened(false);
    }, 100);
  };

  const handlePopoverMouseEnter = () => {
    // Clear timeout when mouse enters popover content
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handlePopoverMouseLeave = () => {
    // Close when leaving popover content
    setOpened(false);
  };

  return (
    <Popover
      width={400}
      position="bottom"
      shadow="md"
      opened={opened}
      onChange={setOpened}
      offset={{ mainAxis: 5, crossAxis: 0 }}
      withArrow
      withinPortal
    >
      <Popover.Target>
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ display: 'inline-block' }}
        >
          {children}
        </div>
      </Popover.Target>
      <Popover.Dropdown
        onMouseEnter={handlePopoverMouseEnter}
        onMouseLeave={handlePopoverMouseLeave}
        style={{ padding: 0 }}
      >
        {loading ? (
          <Group justify="center" p="md">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              Loading metadata...
            </Text>
          </Group>
        ) : error ? (
          <Box p="md">
            <Text size="sm" c="red">
              Error: {error}
            </Text>
          </Box>
        ) : metadata ? (
          <ScrollArea.Autosize mah={400}>
            <Stack gap="md" p="md">
              {/* Header */}
              <Group gap="xs">
                <IconTable size={16} color={metadata.custom ? 'orange' : 'gray'} />
                <div>
                  <Text size="sm" fw={500}>
                    {metadata.label}
                  </Text>
                  <Text size="xs" c="dimmed" ff="monospace">
                    {metadata.name}
                  </Text>
                </div>
                {metadata.custom && (
                  <Badge size="xs" color="orange">
                    Custom
                  </Badge>
                )}
              </Group>

              <Divider />

              {/* Object Properties */}
              <Stack gap="xs">
                <Text size="xs" fw={500} c="dimmed" tt="uppercase">
                  Properties
                </Text>
                <Group gap="xs" wrap="wrap">
                  <Badge size="xs" color={metadata.createable ? 'green' : 'red'} variant="light">
                    {metadata.createable ? 'Createable' : 'Read-only'}
                  </Badge>
                  <Badge size="xs" color={metadata.queryable ? 'green' : 'red'} variant="light">
                    {metadata.queryable ? 'Queryable' : 'Not Queryable'}
                  </Badge>
                  <Badge size="xs" color={metadata.searchable ? 'green' : 'red'} variant="light">
                    {metadata.searchable ? 'Searchable' : 'Not Searchable'}
                  </Badge>
                </Group>
              </Stack>

              <Divider />

              {/* Field Summary */}
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="xs" fw={500} c="dimmed" tt="uppercase">
                    Fields
                  </Text>
                  <Text size="xs" c="dimmed">
                    {metadata.fields.length} total
                  </Text>
                </Group>

                {/* Key Fields Preview */}
                <Stack gap="xs">
                  {metadata.fields
                    .filter((field) => field.name === 'Id' || field.externalId || field.unique)
                    .slice(0, 5)
                    .map((field) => (
                      <Group key={field.name} gap="xs" wrap="nowrap">
                        {getFieldTypeIconSmall(field.type)}
                        <Text size="xs" style={{ flex: 1 }} truncate>
                          {field.label}
                        </Text>
                        <Badge size="xs" color={getFieldTypeColor(field.type)} variant="light">
                          {field.type}
                        </Badge>
                      </Group>
                    ))}

                  {metadata.fields.length > 5 && (
                    <Text size="xs" c="dimmed" ta="center">
                      +{metadata.fields.length - 5} more fields
                    </Text>
                  )}
                </Stack>
              </Stack>

              {/* Relationships */}
              {metadata.childRelationships.length > 0 && (
                <>
                  <Divider />
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="xs" fw={500} c="dimmed" tt="uppercase">
                        Child Relationships
                      </Text>
                      <Text size="xs" c="dimmed">
                        {metadata.childRelationships.length}
                      </Text>
                    </Group>
                    <Stack gap="xs">
                      {metadata.childRelationships.slice(0, 3).map((rel, index) => (
                        <Group key={index} gap="xs" wrap="nowrap">
                          <IconTable size={12} />
                          <Text size="xs" style={{ flex: 1 }} truncate>
                            {rel.childSObject}
                          </Text>
                        </Group>
                      ))}
                      {metadata.childRelationships.length > 3 && (
                        <Text size="xs" c="dimmed" ta="center">
                          +{metadata.childRelationships.length - 3} more
                        </Text>
                      )}
                    </Stack>
                  </Stack>
                </>
              )}

              {/* Record Types */}
              {metadata.recordTypeInfos.length > 0 && (
                <>
                  <Divider />
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="xs" fw={500} c="dimmed" tt="uppercase">
                        Record Types
                      </Text>
                      <Text size="xs" c="dimmed">
                        {metadata.recordTypeInfos.length}
                      </Text>
                    </Group>
                    <Stack gap="xs">
                      {metadata.recordTypeInfos.slice(0, 3).map((rt) => (
                        <Group key={rt.recordTypeId} gap="xs" wrap="nowrap">
                          <Text size="xs" style={{ flex: 1 }} truncate>
                            {rt.name}
                          </Text>
                          <Badge size="xs" color={rt.active ? 'green' : 'red'} variant="light">
                            {rt.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </Group>
                      ))}
                      {metadata.recordTypeInfos.length > 3 && (
                        <Text size="xs" c="dimmed" ta="center">
                          +{metadata.recordTypeInfos.length - 3} more
                        </Text>
                      )}
                    </Stack>
                  </Stack>
                </>
              )}
            </Stack>
          </ScrollArea.Autosize>
        ) : (
          <Box p="md">
            <Group justify="center">
              <IconEye size={24} color="var(--mantine-color-gray-4)" />
              <Text size="sm" c="dimmed">
                Hover to load metadata
              </Text>
            </Group>
          </Box>
        )}
      </Popover.Dropdown>
    </Popover>
  );
}
