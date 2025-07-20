import { useEffect, useState } from 'react';
import {
  IconBook,
  IconCode,
  IconCopy,
  IconDatabase,
  IconEye,
  IconFilter,
  IconKey,
  IconLink,
  IconRefresh,
  IconSearch,
  IconTable,
  IconTags,
  IconX,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Divider,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

interface SalesforceObject {
  name: string;
  label: string;
  labelPlural: string;
  keyPrefix: string;
  custom: boolean;
  createable: boolean;
  deletable: boolean;
  queryable: boolean;
  searchable: boolean;
  updateable: boolean;
  recordTypeInfos: any[];
}

interface SalesforceField {
  name: string;
  label: string;
  type: string;
  length: number;
  precision: number;
  scale: number;
  nillable: boolean;
  unique: boolean;
  calculated: boolean;
  custom: boolean;
  createable: boolean;
  updateable: boolean;
  externalId: boolean;
  idLookup: boolean;
  picklistValues: Array<{ label: string; value: string; active: boolean }>;
  relationshipName: string;
  referenceTo: string[];
  dependentPicklist: boolean;
  controllerName: string;
  soapType: string;
}

interface ObjectMetadata {
  name: string;
  label: string;
  labelPlural: string;
  keyPrefix: string;
  custom: boolean;
  createable: boolean;
  deletable: boolean;
  queryable: boolean;
  searchable: boolean;
  updateable: boolean;
  fields: SalesforceField[];
  childRelationships: Array<{
    childSObject: string;
    field: string;
    relationshipName: string;
  }>;
  recordTypeInfos: Array<{
    name: string;
    recordTypeId: string;
    active: boolean;
  }>;
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
      return 'purple';
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
      return <IconKey size={14} />;
    case 'reference':
      return <IconLink size={14} />;
    case 'picklist':
    case 'multipicklist':
      return <IconTags size={14} />;
    default:
      return <IconDatabase size={14} />;
  }
};

export function ObjectInspector() {
  const [objects, setObjects] = useState<SalesforceObject[]>([]);
  const [filteredObjects, setFilteredObjects] = useState<SalesforceObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [objectMetadata, setObjectMetadata] = useState<ObjectMetadata | null>(null);
  const [isLoadingObjects, setIsLoadingObjects] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300);
  const [filterType, setFilterType] = useState<string | null>('all');
  const [showCustomOnly, setShowCustomOnly] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    details: true,
    fields: true,
  });

  useEffect(() => {
    loadObjects();
  }, []);

  useEffect(() => {
    filterObjects();
  }, [objects, debouncedSearchTerm, filterType, showCustomOnly]);

  const loadObjects = async () => {
    setIsLoadingObjects(true);
    setError(null);

    try {
      const response = await fetch('/api/salesforce/objects');
      if (!response.ok) {
        throw new Error('Failed to fetch objects');
      }
      const data = await response.json();
      setObjects(data.sobjects || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setIsLoadingObjects(false);
    }
  };

  const loadObjectMetadata = async (objectName: string) => {
    setIsLoadingMetadata(true);
    setError(null);

    try {
      const response = await fetch(`/api/salesforce/object/${objectName}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata for ${objectName}`);
      }
      const data = await response.json();
      setObjectMetadata(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const filterObjects = () => {
    let filtered = [...objects];

    // Filter by search term
    if (debouncedSearchTerm) {
      filtered = filtered.filter(
        (obj) =>
          obj.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          obj.label.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType && filterType !== 'all') {
      switch (filterType) {
        case 'custom':
          filtered = filtered.filter((obj) => obj.custom);
          break;
        case 'standard':
          filtered = filtered.filter((obj) => !obj.custom);
          break;
        case 'queryable':
          filtered = filtered.filter((obj) => obj.queryable);
          break;
        case 'createable':
          filtered = filtered.filter((obj) => obj.createable);
          break;
      }
    }

    // Show custom only filter
    if (showCustomOnly) {
      filtered = filtered.filter((obj) => obj.custom);
    }

    setFilteredObjects(filtered);
  };

  const handleObjectSelect = (objectName: string) => {
    setSelectedObject(objectName);
    loadObjectMetadata(objectName);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    notifications.show({
      title: 'Copied',
      message: `${label} copied to clipboard`,
      color: 'blue',
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const generateSampleQuery = (objectName: string, fields: SalesforceField[]) => {
    const queryableFields = fields
      .filter((field) => !field.calculated && field.name !== 'Id')
      .slice(0, 5)
      .map((field) => field.name);

    const allFields = ['Id', ...queryableFields];
    return `SELECT ${allFields.join(', ')} FROM ${objectName} LIMIT 10`;
  };

  return (
    <Stack gap="lg" py="md">
      <div>
        <Title order={2} mb="xs">
          Object Inspector
        </Title>
        <Text c="dimmed">Browse and inspect Salesforce objects and their metadata</Text>
      </div>

      <Group>
        <Button
          leftSection={<IconRefresh size={16} />}
          onClick={loadObjects}
          loading={isLoadingObjects}
          variant="light"
        >
          Refresh Objects
        </Button>
        <Text size="sm" c="dimmed">
          {filteredObjects.length} of {objects.length} objects
        </Text>
      </Group>

      {error && (
        <Alert color="red" title="Error" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div style={{ display: 'flex', gap: '1rem', height: '800px' }}>
        {/* Objects List */}
        <Paper
          withBorder
          style={{ flex: '0 0 400px', display: 'flex', flexDirection: 'column', width: 420 }}
        >
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
            <Stack gap="sm">
              <TextInput
                placeholder="Search objects..."
                leftSection={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                rightSection={
                  searchTerm ? (
                    <ActionIcon variant="subtle" onClick={() => setSearchTerm('')}>
                      <IconX size={16} />
                    </ActionIcon>
                  ) : null
                }
              />

              <Group>
                <Select
                  placeholder="Filter by type"
                  data={[
                    { value: 'all', label: 'All Objects' },
                    { value: 'standard', label: 'Standard Objects' },
                    { value: 'custom', label: 'Custom Objects' },
                    { value: 'queryable', label: 'Queryable' },
                    { value: 'createable', label: 'Createable' },
                  ]}
                  value={filterType}
                  onChange={(value) => setFilterType(value)}
                  leftSection={<IconFilter size={16} />}
                  size="sm"
                  style={{ flex: 1 }}
                />

                <Checkbox
                  label="Custom only"
                  checked={showCustomOnly}
                  onChange={(e) => setShowCustomOnly(e.currentTarget.checked)}
                  size="sm"
                />
              </Group>
            </Stack>
          </div>

          <ScrollArea style={{ flex: 1 }}>
            <div style={{ padding: '0.5rem' }}>
              {isLoadingObjects ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Loader size="md" />
                </div>
              ) : (
                <Stack gap="xs">
                  {filteredObjects.map((obj) => (
                    <Card
                      key={obj.name}
                      padding="sm"
                      withBorder={selectedObject === obj.name}
                      style={{
                        cursor: 'pointer',
                        backgroundColor:
                          selectedObject === obj.name ? 'var(--mantine-color-blue-0)' : undefined,
                      }}
                      onClick={() => handleObjectSelect(obj.name)}
                    >
                      <Group justify="space-between" wrap="nowrap">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Group gap="xs">
                            <IconTable size={16} color={obj.custom ? 'orange' : 'blue'} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Text size="sm" fw={500} truncate>
                                {obj.label}
                              </Text>
                              <Text size="xs" c="dimmed" truncate>
                                {obj.name}
                              </Text>
                            </div>
                          </Group>
                        </div>
                        <Group gap="xs">
                          {obj.custom && (
                            <Badge size="xs" color="orange">
                              Custom
                            </Badge>
                          )}
                          {obj.queryable && (
                            <Badge size="xs" color="green">
                              Queryable
                            </Badge>
                          )}
                        </Group>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              )}
            </div>
          </ScrollArea>
        </Paper>

        {/* Object Details */}
        <Paper withBorder style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {!selectedObject ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <Stack align="center" gap="md">
                <IconEye size={48} color="var(--mantine-color-gray-4)" />
                <Text c="dimmed">Select an object to view its details</Text>
              </Stack>
            </div>
          ) : isLoadingMetadata ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <Stack align="center" gap="md">
                <Loader size="lg" />
                <Text c="dimmed">Loading object metadata...</Text>
              </Stack>
            </div>
          ) : objectMetadata ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div
                style={{ padding: '1rem', borderBottom: '1px solid var(--mantine-color-gray-3)' }}
              >
                <Group justify="space-between">
                  <div>
                    <Group gap="xs">
                      <IconTable size={20} color={objectMetadata.custom ? 'orange' : 'blue'} />
                      <Title order={3}>{objectMetadata.label}</Title>
                      {objectMetadata.custom && <Badge color="orange">Custom</Badge>}
                    </Group>
                    <Text size="sm" c="dimmed">
                      {objectMetadata.name}
                    </Text>
                  </div>
                  <Button
                    size="sm"
                    variant="light"
                    leftSection={<IconCode size={16} />}
                    onClick={() =>
                      copyToClipboard(
                        generateSampleQuery(objectMetadata.name, objectMetadata.fields),
                        'Sample query'
                      )
                    }
                  >
                    Sample Query
                  </Button>
                </Group>
              </div>

              {/* Content */}
              <ScrollArea style={{ flex: 1 }}>
                <div style={{ padding: '1rem' }}>
                  <Tabs defaultValue="fields">
                    <Tabs.List>
                      <Tabs.Tab value="fields" leftSection={<IconDatabase size={16} />}>
                        Fields ({objectMetadata.fields.length})
                      </Tabs.Tab>
                      <Tabs.Tab value="details" leftSection={<IconBook size={16} />}>
                        Details
                      </Tabs.Tab>
                      <Tabs.Tab value="relationships" leftSection={<IconLink size={16} />}>
                        Relationships ({objectMetadata.childRelationships.length})
                      </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="fields" pt="md">
                      <Stack gap="md">
                        <Card withBorder>
                          <Table striped highlightOnHover>
                            <Table.Thead>
                              <Table.Tr>
                                <Table.Th>Field Label</Table.Th>
                                <Table.Th>API Name</Table.Th>
                                <Table.Th>Type</Table.Th>
                                <Table.Th>Properties</Table.Th>
                                <Table.Th>Actions</Table.Th>
                              </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                              {objectMetadata.fields.map((field) => (
                                <Table.Tr key={field.name}>
                                  <Table.Td>
                                    <Group gap="xs">
                                      {getFieldTypeIcon(field.type)}
                                      <Text size="sm" fw={field.name === 'Id' ? 500 : undefined}>
                                        {field.label}
                                      </Text>
                                    </Group>
                                  </Table.Td>
                                  <Table.Td>
                                    <Text size="sm" ff="monospace">
                                      {field.name}
                                    </Text>
                                  </Table.Td>
                                  <Table.Td>
                                    <Badge
                                      size="sm"
                                      color={getFieldTypeColor(field.type)}
                                      variant="light"
                                    >
                                      {field.type}
                                    </Badge>
                                  </Table.Td>
                                  <Table.Td>
                                    <Group gap="xs">
                                      {field.custom && (
                                        <Badge size="xs" color="orange">
                                          Custom
                                        </Badge>
                                      )}
                                      {field.unique && (
                                        <Badge size="xs" color="purple">
                                          Unique
                                        </Badge>
                                      )}
                                      {field.externalId && (
                                        <Badge size="xs" color="red">
                                          External ID
                                        </Badge>
                                      )}
                                      {!field.nillable && (
                                        <Badge size="xs" color="blue">
                                          Required
                                        </Badge>
                                      )}
                                      {field.calculated && (
                                        <Badge size="xs" color="gray">
                                          Calculated
                                        </Badge>
                                      )}
                                    </Group>
                                  </Table.Td>
                                  <Table.Td>
                                    <Tooltip label="Copy field name">
                                      <ActionIcon
                                        size="sm"
                                        variant="subtle"
                                        onClick={() => copyToClipboard(field.name, 'Field name')}
                                      >
                                        <IconCopy size={14} />
                                      </ActionIcon>
                                    </Tooltip>
                                  </Table.Td>
                                </Table.Tr>
                              ))}
                            </Table.Tbody>
                          </Table>
                        </Card>
                      </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="details" pt="md">
                      <Stack gap="md">
                        <Card withBorder>
                          <Stack gap="md">
                            <Group justify="space-between">
                              <Text fw={500}>Object Properties</Text>
                            </Group>

                            <Group>
                              <div>
                                <Text size="sm" c="dimmed">
                                  API Name
                                </Text>
                                <Text size="sm" ff="monospace">
                                  {objectMetadata.name}
                                </Text>
                              </div>
                              <div>
                                <Text size="sm" c="dimmed">
                                  Key Prefix
                                </Text>
                                <Text size="sm" ff="monospace">
                                  {objectMetadata.keyPrefix || 'N/A'}
                                </Text>
                              </div>
                              <div>
                                <Text size="sm" c="dimmed">
                                  Label Plural
                                </Text>
                                <Text size="sm">{objectMetadata.labelPlural}</Text>
                              </div>
                            </Group>

                            <Divider />

                            <Group>
                              <Badge
                                color={objectMetadata.createable ? 'green' : 'red'}
                                variant="light"
                              >
                                {objectMetadata.createable ? 'Createable' : 'Not Createable'}
                              </Badge>
                              <Badge
                                color={objectMetadata.updateable ? 'green' : 'red'}
                                variant="light"
                              >
                                {objectMetadata.updateable ? 'Updateable' : 'Not Updateable'}
                              </Badge>
                              <Badge
                                color={objectMetadata.deletable ? 'green' : 'red'}
                                variant="light"
                              >
                                {objectMetadata.deletable ? 'Deletable' : 'Not Deletable'}
                              </Badge>
                              <Badge
                                color={objectMetadata.queryable ? 'green' : 'red'}
                                variant="light"
                              >
                                {objectMetadata.queryable ? 'Queryable' : 'Not Queryable'}
                              </Badge>
                              <Badge
                                color={objectMetadata.searchable ? 'green' : 'red'}
                                variant="light"
                              >
                                {objectMetadata.searchable ? 'Searchable' : 'Not Searchable'}
                              </Badge>
                            </Group>
                          </Stack>
                        </Card>

                        {objectMetadata.recordTypeInfos.length > 0 && (
                          <Card withBorder>
                            <Stack gap="md">
                              <Text fw={500}>Record Types</Text>
                              <Table>
                                <Table.Thead>
                                  <Table.Tr>
                                    <Table.Th>Name</Table.Th>
                                    <Table.Th>Record Type ID</Table.Th>
                                    <Table.Th>Active</Table.Th>
                                  </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                  {objectMetadata.recordTypeInfos.map((rt) => (
                                    <Table.Tr key={rt.recordTypeId}>
                                      <Table.Td>{rt.name}</Table.Td>
                                      <Table.Td>
                                        <Text size="sm" ff="monospace">
                                          {rt.recordTypeId}
                                        </Text>
                                      </Table.Td>
                                      <Table.Td>
                                        <Badge
                                          color={rt.active ? 'green' : 'red'}
                                          variant="light"
                                          size="sm"
                                        >
                                          {rt.active ? 'Active' : 'Inactive'}
                                        </Badge>
                                      </Table.Td>
                                    </Table.Tr>
                                  ))}
                                </Table.Tbody>
                              </Table>
                            </Stack>
                          </Card>
                        )}
                      </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="relationships" pt="md">
                      <Stack gap="md">
                        {objectMetadata.childRelationships.length === 0 ? (
                          <Text c="dimmed" ta="center" py="xl">
                            No child relationships found
                          </Text>
                        ) : (
                          <Card withBorder>
                            <Stack gap="md">
                              <Text fw={500}>Child Relationships</Text>
                              <Table>
                                <Table.Thead>
                                  <Table.Tr>
                                    <Table.Th>Child Object</Table.Th>
                                    <Table.Th>Field</Table.Th>
                                    <Table.Th>Relationship Name</Table.Th>
                                  </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                  {objectMetadata.childRelationships.map((rel, index) => (
                                    <Table.Tr key={index}>
                                      <Table.Td>
                                        <Text size="sm">{rel.childSObject}</Text>
                                      </Table.Td>
                                      <Table.Td>
                                        <Text size="sm" ff="monospace">
                                          {rel.field}
                                        </Text>
                                      </Table.Td>
                                      <Table.Td>
                                        <Text size="sm" ff="monospace">
                                          {rel.relationshipName || 'N/A'}
                                        </Text>
                                      </Table.Td>
                                    </Table.Tr>
                                  ))}
                                </Table.Tbody>
                              </Table>
                            </Stack>
                          </Card>
                        )}
                      </Stack>
                    </Tabs.Panel>
                  </Tabs>
                </div>
              </ScrollArea>
            </div>
          ) : null}
        </Paper>
      </div>
    </Stack>
  );
}
