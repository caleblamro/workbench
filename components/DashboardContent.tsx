import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  IconApi,
  IconCode,
  IconSearch,
} from '@tabler/icons-react';
import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import type { AuthSession } from '../types/salesforce';

export function DashboardContent() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    // Get session data (we know we're authenticated if we're here)
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setSession(data))
      .catch(() => {
        // Handle error, user should be redirected by layout
      });
  }, []);

  if (!session) {
    return null;
  }

  return (
    <Container size="lg">
      <Stack gap="lg">
        <div>
          <Title order={1} mb="xs">
            Welcome, {session.user.first_name}!
          </Title>
          <Text c="dimmed">You're connected to your Salesforce org</Text>
        </div>

        <Card withBorder shadow="sm" padding="lg" radius="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={3}>Connection Details</Title>
              <Badge color="green" variant="light">
                Connected
              </Badge>
            </Group>

            <div>
              <Text size="sm" c="dimmed" mb="xs">
                Organization
              </Text>
              <Text>{session.user.organization_id}</Text>
            </div>

            <div>
              <Text size="sm" c="dimmed" mb="xs">
                Instance URL
              </Text>
              <Text>{session.instanceUrl}</Text>
            </div>

            <div>
              <Text size="sm" c="dimmed" mb="xs">
                Username
              </Text>
              <Text>{session.user.username}</Text>
            </div>

            <div>
              <Text size="sm" c="dimmed" mb="xs">
                User Type
              </Text>
              <Text>{session.user.user_type}</Text>
            </div>
          </Stack>
        </Card>

        <Card withBorder shadow="sm" padding="lg" radius="md">
          <Title order={3} mb="md">
            Quick Actions
          </Title>
          <Group>
            <Button
              variant="light"
              leftSection={<IconCode size={16} />}
              onClick={() => router.push('/query')}
            >
              Query Data
            </Button>
            <Button 
              variant="light" 
              leftSection={<IconSearch size={16} />}
              onClick={() => router.push('/objects')}
            >
              Object Inspector
            </Button>
            <Button variant="light" leftSection={<IconApi size={16} />} disabled>
              REST Explorer
            </Button>
          </Group>
        </Card>
      </Stack>
    </Container>
  );
}
