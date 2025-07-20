import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  IconCalendar,
  IconCopy,
  IconEdit,
  IconExternalLink,
  IconEye,
  IconKey,
  IconRefresh,
  IconTable,
  IconUser,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Divider,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { 
  getFieldTypeColor, 
  getFieldTypeIcon, 
  type SalesforceField 
} from '../lib/salesforce-field-utils';
import { ObjectLink } from './ObjectLink';

interface RecordData {
  record: Record<string, any>;
  metadata: {
    name: string;
    label: string;
    labelPlural: string;
    custom: boolean;
    fields: SalesforceField[];
  };
}

interface RecordDetailProps {
  objectType: string;
  recordId: string;
}

export function RecordDetail({ objectType, recordId }: RecordDetailProps) {
  const { colorScheme } = useMantineColorScheme();
  const router = useRouter();
  const [recordData, setRecordData] = useState<RecordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (objectType && recordId) {
      loadRecord();
    }
  }, [objectType, recordId]);

  const loadRecord = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/salesforce/record/${objectType}/${recordId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch record');
      }
      const data = await response.json();
      setRecordData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    notifications.show({
      title: 'Copied',
      message: `${label} copied to clipboard`,
      color: 'blue',
    });
  };

  const formatFieldValue = (field: SalesforceField, value: any) => {
    if (value === null || value === undefined) {
      return <Text size="sm" c="dimmed" fs="italic">null</Text>;
    }

    // Handle relationship fields (objects)
    if (typeof value === 'object' && value.attributes) {
      return (
        <ObjectLink
          objectName={value.attributes.type}
          label={value.Name || value.Id}
          showIcon={false}
          size="sm"
        />
      );
    }

    // Handle different field types
    switch (field.type.toLowerCase()) {
      case 'url':
        return (
          <Group gap="xs">
            <Text size="sm" truncate style={{ maxWidth: 200 }}>
              {String(value)}
            </Text>
            <ActionIcon
              size="sm"
              variant="subtle"
              component="a"
              href={String(value)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconExternalLink size={12} />
            </ActionIcon>
          </Group>
        );
      
      case 'email':
        return (
          <Group gap="xs">
            <Text size="sm">{String(value)}</Text>
            <ActionIcon
              size="sm"
              variant="subtle"
              component="a"
              href={`mailto:${value}`}
            >
              <IconExternalLink size={12} />
            </ActionIcon>
          </Group>
        );
      
      case 'phone':
        return (
          <Group gap="xs">
            <Text size="sm">{String(value)}</Text>
            <ActionIcon
              size="sm"
              variant="subtle"
              component="a"
              href={`tel:${value}`}
            >
              <IconExternalLink size={12} />
            </ActionIcon>
          </Group>
        );
      
      case 'boolean':
        return (
          <Badge 
            size="sm" 
            color={value ? 'green' : 'red'} 
            variant="light"
          >
            {value ? 'True' : 'False'}
          </Badge>
        );
      
      case 'date':
      case 'datetime':
        return (
          <Group gap="xs">
            <IconCalendar size={14} />
            <Text size="sm">
              {new Date(value).toLocaleString()}
            </Text>
          </Group>
        );
      
      case 'currency':
      case 'percent':
        return (
          <Text size="sm" fw={500}>
            {field.type.toLowerCase() === 'currency' ? '$' : ''}
            {Number(value).toLocaleString()}
            {field.type.toLowerCase() === 'percent' ? '%' : ''}
          </Text>
        );
      
      case 'picklist':
      case 'multipicklist':
        return (
          <Badge size="sm" color="blue" variant="light">
            {String(value)}
          </Badge>
        );
      
      default:
        return (
          <Text size="sm" style={{ wordBreak: 'break-word' }}>
            {String(value)}
          </Text>
        );
    }
  };

  const getFieldsBySection = (fields: SalesforceField[], record: Record<string, any>) => {
    const systemFields = ['Id', 'CreatedDate', 'LastModifiedDate', 'CreatedBy', 'LastModifiedBy'];
    const standardFields = fields.filter(f => !f.custom && !systemFields.includes(f.name));
    const customFields = fields.filter(f => f.custom);
    const systemFieldsData = fields.filter(f => systemFields.includes(f.name) || systemFields.some(sf => f.name.startsWith(sf)));

    return { standardFields, customFields, systemFieldsData };
  };

  // Theme-aware colors
  const borderColor = colorScheme === 'dark' ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-3)';

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading record details...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Stack gap="lg" py="md">
        <Alert color="red" title="Error Loading Record">
          {error}
        </Alert>
        <Group>
          <Button leftSection={<IconRefresh size={16} />} onClick={loadRecord}>
            Retry
          </Button>
          <Button variant="light" onClick={() => router.back()}>
            Go Back
          </Button>
        </Group>
      </Stack>
    );
  }

  if (!recordData) {
    return (
      <Center style={{ height: '50vh' }}>
        <Stack align="center" gap="md">
          <IconEye size={48} color="var(--mantine-color-gray-4)" />
          <Text c="dimmed">Record not found</Text>
        </Stack>
      </Center>
    );
  }

  const { record, metadata } = recordData;
  const { standardFields, customFields, systemFieldsData } = getFieldsBySection(metadata.fields, record);
  const recordName = record.Name || record.Subject || record.Title || recordId;

  return (
    <div style={{ height: 'calc(100vh - 60px - 2rem)', display: 'flex', flexDirection: 'column' }}>
      <Stack gap="lg" py="md" style={{ flex: 1, minHeight: 0 }}>
        {/* Header */}
        <div>
          <Group justify="space-between" align="flex-start">
            <div>
              <Group gap="xs" mb="xs">
                <ObjectLink
                  objectName={metadata.name}
                  label={metadata.label}
                  showPreview={false}
                  size="md"
                />
                {metadata.custom && <Badge color="orange">Custom</Badge>}
              </Group>
              <Title order={2} mb="xs">
                {recordName}
              </Title>
              <Text size="sm" c="dimmed" ff="monospace">
                ID: {recordId}
              </Text>
            </div>
            <Group>
              <Tooltip label="Copy Record ID">
                <ActionIcon
                  variant="light"
                  onClick={() => copyToClipboard(recordId, 'Record ID')}
                >
                  <IconCopy size={16} />
                </ActionIcon>
              </Tooltip>
              <Button
                leftSection={<IconRefresh size={16} />}
                variant="light"
                onClick={loadRecord}
              >
                Refresh
              </Button>
              <Button
                leftSection={<IconEdit size={16} />}
                variant="filled"
                disabled
              >
                Edit (Coming Soon)
              </Button>
            </Group>
          </Group>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <ScrollArea style={{ height: '100%' }}>
            <Stack gap="lg">
              {/* System Fields */}
              <Card withBorder>
                <Stack gap="md">
                  <Group gap="xs">
                    <IconKey size={16} />
                    <Text fw={500}>System Information</Text>
                  </Group>
                  <Table>
                    <Table.Tbody>
                      {systemFieldsData
                        .filter(field => record[field.name] !== undefined)
                        .map((field) => (
                          <Table.Tr key={field.name}>
                            <Table.Td style={{ width: 200 }}>
                              <Group gap="xs">
                                {getFieldTypeIcon(field.type)}
                                <Text size="sm" fw={500}>
                                  {field.label}
                                </Text>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              {formatFieldValue(field, record[field.name])}
                            </Table.Td>
                            <Table.Td style={{ width: 100 }}>
                              <Group gap="xs">
                                <Badge 
                                  size="xs" 
                                  color={getFieldTypeColor(field.type)} 
                                  variant="light"
                                >
                                  {field.type}
                                </Badge>
                                <Tooltip label="Copy field value">
                                  <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    onClick={() => 
                                      copyToClipboard(
                                        String(record[field.name] || ''), 
                                        field.label
                                      )
                                    }
                                  >
                                    <IconCopy size={12} />
                                  </ActionIcon>
                                </Tooltip>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                    </Table.Tbody>
                  </Table>
                </Stack>
              </Card>

              {/* Standard Fields */}
              {standardFields.some(field => record[field.name] !== undefined) && (
                <Card withBorder>
                  <Stack gap="md">
                    <Group gap="xs">
                      <IconTable size={16} />
                      <Text fw={500}>Standard Fields</Text>
                    </Group>
                    <Table>
                      <Table.Tbody>
                        {standardFields
                          .filter(field => record[field.name] !== undefined)
                          .map((field) => (
                            <Table.Tr key={field.name}>
                              <Table.Td style={{ width: 200 }}>
                                <Group gap="xs">
                                  {getFieldTypeIcon(field.type)}
                                  <Text size="sm" fw={500}>
                                    {field.label}
                                  </Text>
                                </Group>
                              </Table.Td>
                              <Table.Td>
                                {formatFieldValue(field, record[field.name])}
                              </Table.Td>
                              <Table.Td style={{ width: 100 }}>
                                <Group gap="xs">
                                  <Badge 
                                    size="xs" 
                                    color={getFieldTypeColor(field.type)} 
                                    variant="light"
                                  >
                                    {field.type}
                                  </Badge>
                                  <Tooltip label="Copy field value">
                                    <ActionIcon
                                      size="sm"
                                      variant="subtle"
                                      onClick={() => 
                                        copyToClipboard(
                                          String(record[field.name] || ''), 
                                          field.label
                                        )
                                      }
                                    >
                                      <IconCopy size={12} />
                                    </ActionIcon>
                                  </Tooltip>
                                </Group>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                      </Table.Tbody>
                    </Table>
                  </Stack>
                </Card>
              )}

              {/* Custom Fields */}
              {customFields.some(field => record[field.name] !== undefined) && (
                <Card withBorder>
                  <Stack gap="md">
                    <Group gap="xs">
                      <IconUser size={16} />
                      <Text fw={500}>Custom Fields</Text>
                    </Group>
                    <Table>
                      <Table.Tbody>
                        {customFields
                          .filter(field => record[field.name] !== undefined)
                          .map((field) => (
                            <Table.Tr key={field.name}>
                              <Table.Td style={{ width: 200 }}>
                                <Group gap="xs">
                                  {getFieldTypeIcon(field.type)}
                                  <Text size="sm" fw={500}>
                                    {field.label}
                                  </Text>
                                </Group>
                              </Table.Td>
                              <Table.Td>
                                {formatFieldValue(field, record[field.name])}
                              </Table.Td>
                              <Table.Td style={{ width: 100 }}>
                                <Group gap="xs">
                                  <Badge 
                                    size="xs" 
                                    color={getFieldTypeColor(field.type)} 
                                    variant="light"
                                  >
                                    {field.type}
                                  </Badge>
                                  <Tooltip label="Copy field value">
                                    <ActionIcon
                                      size="sm"
                                      variant="subtle"
                                      onClick={() => 
                                        copyToClipboard(
                                          String(record[field.name] || ''), 
                                          field.label
                                        )
                                      }
                                    >
                                      <IconCopy size={12} />
                                    </ActionIcon>
                                  </Tooltip>
                                </Group>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                      </Table.Tbody>
                    </Table>
                  </Stack>
                </Card>
              )}
            </Stack>
          </ScrollArea>
        </div>
      </Stack>
    </div>
  );
}
