import { useState } from 'react';
import { IconDatabase, IconEye, IconKey, IconLink, IconTable, IconTags } from '@tabler/icons-react';
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

interface MetadataPreviewProps {
  objectName: string;
  children: React.ReactNode;
  opened?: boolean;
  onChange?: (opened: boolean) => void;
}

const getFieldTypeColor = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'id':
      return 'yellow';
    case 'string':
    case 'textarea':
    case 'phone':
    case 'email':
    case 'url':
      return 'blue';
    case 'boolean':
      return 'green';
    case 'int':
    case 'double':
    case 'currency':
    case 'percent':
      return 'orange';
    case 'date':
    case 'datetime':
    case 'time':
      return 'cyan';
    case 'reference':
      return 'red';
    case 'picklist':
    case 'multipicklist':
      return 'teal';
    default:
      return 'gray';
  }
};

const getFieldTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'id':
      return <IconKey size={12} />;
    case 'reference':
      return <IconLink size={12} />;
    case 'picklist':
    case 'multipicklist':
      return <IconTags size={12} />;
    default:
      return <IconDatabase size={12} />;
  }
};

export function MetadataPreview({ objectName, children, opened, onChange }: MetadataPreviewProps) {
  const [metadata, setMetadata] = useState<ObjectMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      loadMetadata();
    }
    onChange?.(isOpen);
  };

  return (
    <Popover
      width={400}
      position="bottom"
      withArrow
      shadow="md"
      opened={opened}
      onChange={handleOpenChange}
    >
      <Popover.Target>{children}</Popover.Target>
      <Popover.Dropdown>
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
                        {getFieldTypeIcon(field.type)}
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
                          <IconLink size={12} />
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
