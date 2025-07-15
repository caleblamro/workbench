import { useState } from 'react';
import {
  IconAlertCircle,
  IconBookmark,
  IconCircle,
  IconClock,
  IconCode,
  IconCopy,
  IconDownload,
  IconPlayerPlay,
  IconTrash,
} from '@tabler/icons-react';
import { CodeHighlight } from '@mantine/code-highlight';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Group,
  LoadingOverlay,
  ScrollArea,
  Stack,
  Table,
  Tabs,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { EditableCodeHighlight } from './EditableCodeHighlight';

interface QueryResult {
  totalSize: number;
  done: boolean;
  records: Array<Record<string, any>>;
  nextRecordsUrl?: string;
}

interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  success: boolean;
  recordCount?: number;
  error?: string;
}

const EXAMPLE_QUERIES = [
  {
    name: 'Basic Account Query',
    query: 'SELECT Id, Name, Type, BillingCity FROM Account LIMIT 10',
    description: 'Get basic account information',
  },
  {
    name: 'Contact with Account',
    query: 'SELECT Id, Name, Email, Account.Name FROM Contact WHERE Account.Name != null LIMIT 10',
    description: 'Contacts with their associated accounts',
  },
  {
    name: 'Recent Opportunities',
    query:
      'SELECT Id, Name, Amount, StageName, CreatedDate FROM Opportunity WHERE CreatedDate = LAST_N_DAYS:30 ORDER BY CreatedDate DESC',
    description: 'Opportunities created in the last 30 days',
  },
  {
    name: 'User Information',
    query:
      'SELECT Id, Name, Email, Profile.Name, IsActive FROM User WHERE IsActive = true LIMIT 10',
    description: 'Active users with their profiles',
  },
  {
    name: 'Custom Objects',
    query: 'SELECT Id, Name, CreatedDate FROM CustomObject__c ORDER BY CreatedDate DESC LIMIT 5',
    description: 'Query custom objects (replace with your custom object)',
  },
];

const exportToCSV = ({ result }: { result: QueryResult }) => {
  if (!result || !result.records.length) {
    return;
  }

  const headers = Object.keys(result.records[0]);
  const csvContent = [
    headers.join(','),
    ...result.records.map((record) =>
      headers
        .map((header) => {
          const value = record[header];
          if (value === null || value === undefined) {
            return '';
          }
          if (typeof value === 'object') {
            return JSON.stringify(value);
          }
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `soql-results-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const renderResultTable = ({ result }: { result: QueryResult }) => {
  if (!result || !result.records.length) {
    return null;
  }

  const headers = Object.keys(result.records[0]);

  return (
    <Card withBorder>
      <Group justify="space-between" mb="md">
        <div>
          <Text fw={500}>Query Results</Text>
          <Text size="sm" c="dimmed">
            {result.totalSize} records found
            {!result.done && ' (showing first batch)'}
          </Text>
        </div>
        <Group>
          <Button
            size="sm"
            variant="light"
            leftSection={<IconDownload size={16} />}
            onClick={() => exportToCSV({ result })}
          >
            Export CSV
          </Button>
        </Group>
      </Group>

      <ScrollArea>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              {headers.map((header) => (
                <Table.Th key={header}>{header}</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {result.records.map((record, index) => (
              <Table.Tr key={index}>
                {headers.map((header) => (
                  <Table.Td key={header}>
                    {record[header] === null || record[header] === undefined
                      ? ''
                      : typeof record[header] === 'object'
                        ? JSON.stringify(record[header])
                        : String(record[header])}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Card>
  );
};

export function SOQLQueryTool() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [queryHistory, setQueryHistory] = useLocalStorage<QueryHistoryItem[]>({
    key: 'soql-query-history',
    defaultValue: [],
  });

  const executeQuery = async () => {
    if (!query.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please enter a SOQL query',
        color: 'red',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/salesforce/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Query failed');
      }

      setResult(data);

      // Add to history
      const historyItem: QueryHistoryItem = {
        id: Date.now().toString(),
        query: query.trim(),
        timestamp: new Date(),
        success: true,
        recordCount: data.totalSize,
      };

      setQueryHistory((prev) => [historyItem, ...prev.slice(0, 19)]); // Keep last 20

      notifications.show({
        title: 'Success',
        message: `Query executed successfully. ${data.totalSize} records found.`,
        color: 'green',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);

      // Add failed query to history
      const historyItem: QueryHistoryItem = {
        id: Date.now().toString(),
        query: query.trim(),
        timestamp: new Date(),
        success: false,
        error: errorMessage,
      };

      setQueryHistory((prev) => [historyItem, ...prev.slice(0, 19)]);

      notifications.show({
        title: 'Query Failed',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    notifications.show({
      title: 'Copied',
      message: 'Query copied to clipboard',
      color: 'blue',
    });
  };

  const loadExampleQuery = (exampleQuery: string) => {
    setQuery(exampleQuery);
    setError(null);
    setResult(null);
  };

  const loadFromHistory = (historyItem: QueryHistoryItem) => {
    setQuery(historyItem.query);
    setError(null);
    setResult(null);
  };

  const clearHistory = () => {
    setQueryHistory([]);
    notifications.show({
      title: 'History Cleared',
      message: 'Query history has been cleared',
      color: 'blue',
    });
  };

  return (
    <Stack gap="lg" py="md" style={{ position: 'relative' }}>
      <div>
        <Title order={2} mb="xs">
          SOQL Query Tool
        </Title>
        <Text c="dimmed">Execute SOQL queries against your Salesforce org</Text>
      </div>

      <Tabs defaultValue="query">
        <Tabs.List>
          <Tabs.Tab value="query" leftSection={<IconCode size={16} />}>
            Query
          </Tabs.Tab>
          <Tabs.Tab value="examples" leftSection={<IconBookmark size={16} />}>
            Examples
          </Tabs.Tab>
          <Tabs.Tab value="history" leftSection={<IconClock size={16} />}>
            History ({queryHistory.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="query" pt="md">
          <Stack gap="md">
            <Card withBorder>
              <Stack gap="md">
                <Group justify="space-between">
                  <Text fw={500}>SOQL Query</Text>
                  <Group>
                    <Tooltip label="Copy query">
                      <ActionIcon
                        variant="light"
                        onClick={() => copyToClipboard(query)}
                        disabled={!query}
                      >
                        <IconCopy size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Clear query">
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => setQuery('')}
                        disabled={!query}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>

                <EditableCodeHighlight
                  value={query}
                  onChange={(value) => setQuery(value)}
                  language="sql"
                  placeholder="Enter your SOQL query here..."
                  minRows={6}
                  maxRows={12}
                />

                <Group>
                  <Button
                    leftSection={<IconPlayerPlay size={16} />}
                    onClick={executeQuery}
                    loading={isLoading}
                    disabled={!query.trim()}
                  >
                    Execute Query
                  </Button>
                  <Text size="sm" c="dimmed">
                    Tip: Use LIMIT to avoid large result sets
                  </Text>
                </Group>
              </Stack>
            </Card>

            {error && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                color="red"
                title="Query Error"
                withCloseButton
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            {result && (
              <Alert icon={<IconCircle size={16} />} color="green" title="Query Successful">
                Found {result.totalSize} records
                {!result.done && ' (showing first batch)'}
              </Alert>
            )}

            {result && renderResultTable({ result })}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="examples" pt="md">
          <Stack gap="md">
            <Text>Click on any example below to load it into the query editor:</Text>
            {EXAMPLE_QUERIES.map((example, index) => (
              <Card
                key={index}
                withBorder
                style={{ cursor: 'pointer' }}
                onClick={() => loadExampleQuery(example.query)}
              >
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text fw={500}>{example.name}</Text>
                  </Group>
                  <Text size="sm" c="dimmed">
                    {example.description}
                  </Text>
                  <CodeHighlight
                    code={example.query}
                    language="sql"
                    copyLabel="Copy query"
                    copiedLabel="Copied!"
                  />
                </Stack>
              </Card>
            ))}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="history" pt="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text>Recent queries:</Text>
              <Button
                size="sm"
                variant="light"
                color="red"
                onClick={clearHistory}
                disabled={queryHistory.length === 0}
              >
                Clear History
              </Button>
            </Group>

            {queryHistory.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                No queries in history yet
              </Text>
            ) : (
              queryHistory.map((item) => (
                <Card
                  key={item.id}
                  withBorder
                  style={{ cursor: 'pointer' }}
                  onClick={() => loadFromHistory(item)}
                >
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Group>
                        <Badge color={item.success ? 'green' : 'red'} variant="light">
                          {item.success ? 'Success' : 'Failed'}
                        </Badge>
                        <Text size="sm" c="dimmed">
                          {item.timestamp.toLocaleString()}
                        </Text>
                      </Group>
                    </Group>

                    {item.success && item.recordCount !== undefined && (
                      <Text size="sm" c="dimmed">
                        {item.recordCount} records
                      </Text>
                    )}

                    {!item.success && item.error && (
                      <Text size="sm" c="red">
                        {item.error}
                      </Text>
                    )}

                    <CodeHighlight
                      code={item.query}
                      language="sql"
                      copyLabel="Copy query"
                      copiedLabel="Copied!"
                    />
                  </Stack>
                </Card>
              ))
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <LoadingOverlay visible={isLoading} />
    </Stack>
  );
}
