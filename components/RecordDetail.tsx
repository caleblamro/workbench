import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  IconArrowLeft,
  IconCalendar,
  IconCheck,
  IconCopy,
  IconEdit,
  IconExternalLink,
  IconEye,
  IconLink,
  IconMail,
  IconPhone,
  IconRefresh,
  IconSearch,
  IconX,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Grid,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
  UnstyledButton,
  useMantineColorScheme,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  getFieldTypeColor,
  getFieldTypeIcon,
  type SalesforceField,
} from '../lib/salesforce-field-utils';
import { ObjectLink } from './ObjectLink';
import { RecordLink } from './RecordLink';

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

interface FieldRowProps {
  field: SalesforceField;
  value: any;
  onCopy: (text: string, label: string) => void;
}

function FieldRow({ field, value, onCopy }: FieldRowProps) {
  const { colorScheme } = useMantineColorScheme();

  const renderValue = () => {
    if (value === null || value === undefined) {
      return (
        <Text size="sm" c="dimmed" fs="italic">
          —
        </Text>
      );
    }

    // Handle ID fields (18-character Salesforce IDs)
    if (
      field.type.toLowerCase() === 'id' ||
      (field.name === 'Id' && typeof value === 'string' && value.length >= 15)
    ) {
      // Try to determine the object type from the ID prefix
      // This is a simplified approach - in a real implementation you might want to maintain a mapping
      const idPrefix = value.substring(0, 3);

      // Some common prefixes - you could expand this or fetch from Salesforce
      const prefixToObject: Record<string, string> = {
        '001': 'Account',
        '003': 'Contact',
        '006': 'Opportunity',
        '00Q': 'Lead',
        '500': 'Case',
        '0D5': 'OpportunityLineItem',
      };

      const objectType = prefixToObject[idPrefix];

      if (objectType && field.name !== 'Id') {
        // This is a reference ID field, create a link to the related record
        return (
          <RecordLink objectType={objectType} recordId={value} label={value} size="sm" truncate />
        );
      }
      // This is the main record ID, just show it (already linked via the page)
      return (
        <Text size="sm" ff="monospace" style={{ wordBreak: 'break-all' }}>
          {String(value)}
        </Text>
      );
    }

    // Handle reference/lookup fields (relationship fields)
    if (field.type.toLowerCase() === 'reference' && typeof value === 'string') {
      // Check if we have reference info from referenceTo
      const referencedObject = field.referenceTo?.[0];

      if (referencedObject && value.length >= 15) {
        return (
          <RecordLink
            objectType={referencedObject}
            recordId={value}
            label={value}
            size="sm"
            truncate
          />
        );
      }

      return (
        <Text size="sm" ff="monospace" style={{ wordBreak: 'break-all' }}>
          {String(value)}
        </Text>
      );
    }

    // Handle relationship fields (objects with nested data)
    if (typeof value === 'object' && value.attributes) {
      const relatedRecordName = value.Name || value.Title || value.Subject || value.Id;
      const relatedObjectType = value.attributes.type;

      if (value.Id) {
        return (
          <RecordLink
            objectType={relatedObjectType}
            recordId={value.Id}
            label={relatedRecordName}
            size="sm"
            truncate
          />
        );
      }
      return (
        <ObjectLink
          objectName={relatedObjectType}
          label={relatedRecordName}
          showIcon={false}
          size="sm"
        />
      );
    }

    // Handle different field types
    switch (field.type.toLowerCase()) {
      case 'url':
        return (
          <Anchor
            href={String(value)}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Text truncate style={{ maxWidth: 250 }}>
              {String(value)}
            </Text>
            <IconExternalLink size={12} />
          </Anchor>
        );

      case 'email':
        return (
          <Anchor
            href={`mailto:${value}`}
            size="sm"
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <IconMail size={14} />
            {String(value)}
          </Anchor>
        );

      case 'phone':
        return (
          <Anchor
            href={`tel:${value}`}
            size="sm"
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <IconPhone size={14} />
            {String(value)}
          </Anchor>
        );

      case 'boolean':
        return (
          <Group gap="xs">
            {value ? (
              <IconCheck size={16} color="var(--mantine-color-green-6)" />
            ) : (
              <IconX size={16} color="var(--mantine-color-red-6)" />
            )}
            <Text size="sm" c={value ? 'green' : 'red'}>
              {value ? 'Yes' : 'No'}
            </Text>
          </Group>
        );

      case 'date':
      case 'datetime':
        return (
          <Group gap="xs">
            <IconCalendar size={14} />
            <Text size="sm">{new Date(value).toLocaleString()}</Text>
          </Group>
        );

      case 'currency':
        return (
          <Text size="sm" fw={500} c="green">
            ${Number(value).toLocaleString()}
          </Text>
        );

      case 'percent':
        return (
          <Text size="sm" fw={500}>
            {Number(value).toLocaleString()}%
          </Text>
        );

      case 'picklist':
      case 'multipicklist':
        return (
          <Badge size="sm" color="blue" variant="dot">
            {String(value)}
          </Badge>
        );

      case 'textarea':
        return (
          <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {String(value)}
          </Text>
        );

      default:
        return (
          <Text size="sm" style={{ wordBreak: 'break-word' }}>
            {String(value)}
          </Text>
        );
    }
  };

  return (
    <Box
      p="sm"
      style={{
        borderRadius: 'var(--mantine-radius-sm)',
        backgroundColor:
          colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)',
        border: `1px solid ${colorScheme === 'dark' ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-2)'}`,
      }}
    >
      <Group justify="space-between" align="flex-start">
        <div style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" mb={2}>
            {getFieldTypeIcon(field.type)}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text size="xs" fw={500} c="dimmed" tt="uppercase" mb={2}>
                {field.label}
              </Text>
              <Text size="xs" c="dimmed" ff="monospace" style={{ opacity: 0.7 }}>
                {field.name}
              </Text>
            </div>
            <Badge size="xs" color={getFieldTypeColor(field.type)} variant="dot">
              {field.type}
            </Badge>
          </Group>
          <Box mt="xs">{renderValue()}</Box>

          {/* Additional field metadata */}
          {(field.unique || field.externalId || !field.nillable || field.calculated) && (
            <Group gap="xs" mt="xs">
              {field.unique && (
                <Badge size="xs" color="purple" variant="light">
                  Unique
                </Badge>
              )}
              {field.externalId && (
                <Badge size="xs" color="red" variant="light">
                  External ID
                </Badge>
              )}
              {!field.nillable && field.name !== 'Id' && (
                <Badge size="xs" color="blue" variant="light">
                  Required
                </Badge>
              )}
              {field.calculated && (
                <Badge size="xs" color="gray" variant="light">
                  Calculated
                </Badge>
              )}
            </Group>
          )}
        </div>
        <Tooltip label="Copy value">
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={() => onCopy(String(value || ''), field.label)}
          >
            <IconCopy size={12} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Box>
  );
}

export function RecordDetail({ objectType, recordId }: RecordDetailProps) {
  const { colorScheme } = useMantineColorScheme();
  const router = useRouter();
  const [recordData, setRecordData] = useState<RecordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldSearchTerm, setFieldSearchTerm] = useState('');
  const [debouncedFieldSearchTerm] = useDebouncedValue(fieldSearchTerm, 300);

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

  const getFieldsBySection = (fields: SalesforceField[], record: Record<string, any>) => {
    const systemFields = [
      'Id',
      'CreatedDate',
      'LastModifiedDate',
      'CreatedBy',
      'LastModifiedBy',
      'CreatedById',
      'LastModifiedById',
    ];

    // Filter fields based on search term
    const filteredFields = fields.filter((field) => {
      if (!debouncedFieldSearchTerm) {
        return true;
      }
      const searchLower = debouncedFieldSearchTerm.toLowerCase();
      return (
        field.name.toLowerCase().includes(searchLower) ||
        field.label.toLowerCase().includes(searchLower) ||
        field.type.toLowerCase().includes(searchLower) ||
        String(record[field.name] || '')
          .toLowerCase()
          .includes(searchLower)
      );
    });

    const identifierFields = filteredFields.filter(
      (f) =>
        f.name === 'Name' ||
        f.name === 'Subject' ||
        f.name === 'Title' ||
        f.externalId ||
        f.unique ||
        f.name.toLowerCase().includes('name') ||
        (f.type.toLowerCase() === 'reference' && !systemFields.includes(f.name))
    );
    const standardFields = filteredFields.filter(
      (f) =>
        !f.custom &&
        !systemFields.includes(f.name) &&
        !identifierFields.some((id) => id.name === f.name)
    );
    const customFields = filteredFields.filter((f) => f.custom);
    const systemFieldsData = filteredFields.filter(
      (f) => systemFields.includes(f.name) || systemFields.some((sf) => f.name.startsWith(sf))
    );

    return { identifierFields, standardFields, customFields, systemFieldsData };
  };

  if (loading) {
    return (
      <Center style={{ height: '60vh' }}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading record details...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Box p="lg">
        <Alert color="red" title="Error Loading Record" mb="md">
          {error}
        </Alert>
        <Group>
          <Button leftSection={<IconRefresh size={16} />} onClick={loadRecord}>
            Retry
          </Button>
          <Button
            variant="light"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </Group>
      </Box>
    );
  }

  if (!recordData) {
    return (
      <Center style={{ height: '60vh' }}>
        <Stack align="center" gap="md">
          <IconEye size={48} color="var(--mantine-color-gray-4)" />
          <Text c="dimmed">Record not found</Text>
        </Stack>
      </Center>
    );
  }

  const { record, metadata } = recordData;
  const { identifierFields, standardFields, customFields, systemFieldsData } = getFieldsBySection(
    metadata.fields,
    record
  );
  const recordName = record.Name || record.Subject || record.Title || recordId;

  // Filter sections to only show fields that have values and match search
  const keyInformationFields = identifierFields.filter((field) => record[field.name] !== undefined);
  const systemInformationFields = systemFieldsData.filter(
    (field) => record[field.name] !== undefined
  );
  const standardFieldsWithValues = standardFields.filter(
    (field) => record[field.name] !== undefined
  );
  const customFieldsWithValues = customFields.filter((field) => record[field.name] !== undefined);

  return (
    <Box style={{ height: 'calc(100vh - 60px - 2rem)' }}>
      <ScrollArea style={{ height: '100%' }}>
        <Box p="lg">
          {/* Header Card */}
          <Card withBorder mb="lg" p="lg">
            <Group justify="space-between" align="flex-start" mb="md">
              <div style={{ flex: 1, minWidth: 0 }}>
                <Group gap="md" mb="sm">
                  <UnstyledButton onClick={() => router.back()}>
                    <Group gap="xs">
                      <IconArrowLeft size={16} />
                      <Text size="sm" c="dimmed">
                        Back
                      </Text>
                    </Group>
                  </UnstyledButton>
                  <Text size="sm" c="dimmed">
                    /
                  </Text>
                  <ObjectLink
                    objectName={metadata.name}
                    label={metadata.label}
                    showPreview={false}
                    size="sm"
                  />
                  {metadata.custom && (
                    <Badge color="orange" variant="light">
                      Custom Object
                    </Badge>
                  )}
                </Group>
                <Title order={2} mb="xs" c={colorScheme === 'dark' ? 'white' : 'dark'}>
                  {recordName}
                </Title>
                <Group gap="lg">
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      Record ID:
                    </Text>
                    <Text size="sm" ff="monospace">
                      {recordId}
                    </Text>
                    <Tooltip label="Copy Record ID">
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={() => copyToClipboard(recordId, 'Record ID')}
                      >
                        <IconCopy size={12} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      Object API:
                    </Text>
                    <Text size="sm" ff="monospace">
                      {metadata.name}
                    </Text>
                  </Group>
                </Group>
              </div>
              <Group>
                <Button
                  leftSection={<IconRefresh size={16} />}
                  variant="light"
                  onClick={loadRecord}
                >
                  Refresh
                </Button>
                <Button leftSection={<IconEdit size={16} />} disabled>
                  Edit
                </Button>
              </Group>
            </Group>

            {/* Search Fields */}
            <Group justify="space-between" align="center">
              <TextInput
                placeholder="Search fields by name, label, type, or value..."
                leftSection={<IconSearch size={16} />}
                value={fieldSearchTerm}
                onChange={(e) => setFieldSearchTerm(e.currentTarget.value)}
                rightSection={
                  fieldSearchTerm ? (
                    <ActionIcon variant="subtle" onClick={() => setFieldSearchTerm('')}>
                      <IconX size={16} />
                    </ActionIcon>
                  ) : null
                }
                style={{ width: 400 }}
                size="sm"
              />
            </Group>
            {debouncedFieldSearchTerm && (
              <Text size="xs" c="dimmed" mt="xs">
                Showing fields matching "{debouncedFieldSearchTerm}"
              </Text>
            )}
          </Card>

          <Grid>
            {/* Key Information - Only show if there are matching fields */}
            {keyInformationFields.length > 0 && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder h="100%">
                  <Group gap="xs" mb="md">
                    <IconLink size={18} />
                    <Text fw={600}>Key Information</Text>
                    <Badge size="xs" color="blue" variant="light">
                      {keyInformationFields.length}
                    </Badge>
                  </Group>
                  <Stack gap="sm">
                    {keyInformationFields.map((field) => (
                      <FieldRow
                        key={field.name}
                        field={field}
                        value={record[field.name]}
                        onCopy={copyToClipboard}
                      />
                    ))}
                  </Stack>
                </Card>
              </Grid.Col>
            )}

            {/* System Information - Only show if there are matching fields */}
            {systemInformationFields.length > 0 && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder h="100%">
                  <Group gap="xs" mb="md">
                    <IconCalendar size={18} />
                    <Text fw={600}>System Information</Text>
                    <Badge size="xs" color="gray" variant="light">
                      {systemInformationFields.length}
                    </Badge>
                  </Group>
                  <Stack gap="sm">
                    {systemInformationFields.map((field) => (
                      <FieldRow
                        key={field.name}
                        field={field}
                        value={record[field.name]}
                        onCopy={copyToClipboard}
                      />
                    ))}
                  </Stack>
                </Card>
              </Grid.Col>
            )}

            {/* Standard Fields - Only show if there are matching fields */}
            {standardFieldsWithValues.length > 0 && (
              <Grid.Col span={12}>
                <Card withBorder>
                  <Group gap="xs" mb="md">
                    <IconEye size={18} />
                    <Text fw={600}>Standard Fields</Text>
                    <Badge size="xs" color="green" variant="light">
                      {standardFieldsWithValues.length}
                    </Badge>
                  </Group>
                  <Grid>
                    {standardFieldsWithValues.map((field) => (
                      <Grid.Col key={field.name} span={{ base: 12, sm: 6, lg: 4 }}>
                        <FieldRow
                          field={field}
                          value={record[field.name]}
                          onCopy={copyToClipboard}
                        />
                      </Grid.Col>
                    ))}
                  </Grid>
                </Card>
              </Grid.Col>
            )}

            {/* Custom Fields - Only show if there are matching fields */}
            {customFieldsWithValues.length > 0 && (
              <Grid.Col span={12}>
                <Card withBorder>
                  <Group gap="xs" mb="md">
                    <IconEdit size={18} />
                    <Text fw={600}>Custom Fields</Text>
                    <Badge size="xs" color="orange" variant="light">
                      {customFieldsWithValues.length}
                    </Badge>
                  </Group>
                  <Grid>
                    {customFieldsWithValues.map((field) => (
                      <Grid.Col key={field.name} span={{ base: 12, sm: 6, lg: 4 }}>
                        <FieldRow
                          field={field}
                          value={record[field.name]}
                          onCopy={copyToClipboard}
                        />
                      </Grid.Col>
                    ))}
                  </Grid>
                </Card>
              </Grid.Col>
            )}

            {/* No Results Message */}
            {debouncedFieldSearchTerm &&
              keyInformationFields.length === 0 &&
              systemInformationFields.length === 0 &&
              standardFieldsWithValues.length === 0 &&
              customFieldsWithValues.length === 0 && (
                <Grid.Col span={12}>
                  <Card withBorder>
                    <Center py="xl">
                      <Stack align="center" gap="md">
                        <IconSearch size={48} color="var(--mantine-color-gray-4)" />
                        <div style={{ textAlign: 'center' }}>
                          <Text fw={500} mb="xs">
                            No fields found
                          </Text>
                          <Text size="sm" c="dimmed">
                            No fields match your search for "{debouncedFieldSearchTerm}"
                          </Text>
                          <Button
                            size="sm"
                            variant="light"
                            mt="md"
                            onClick={() => setFieldSearchTerm('')}
                          >
                            Clear search
                          </Button>
                        </div>
                      </Stack>
                    </Center>
                  </Card>
                </Grid.Col>
              )}
          </Grid>
        </Box>
      </ScrollArea>
    </Box>
  );
}
