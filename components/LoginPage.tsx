import { Container, Paper, Title, Text, Button, Stack, Group } from '@mantine/core';
import { IconCloud, IconShield } from '@tabler/icons-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

interface LoginPageProps {
  error?: string;
}

export function LoginPage({ error }: LoginPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) {
          router.push('/dashboard');
        }
      })
      .catch(() => {
        // User not authenticated, stay on login page
      });
  }, [router]);

  const handleLogin = () => {
    setIsLoading(true);
    // Redirect to Salesforce OAuth
    window.location.href = '/api/auth/login';
  };

  return (
    <Container size={420} my={40}>
      <Stack gap="xl">
        <div style={{ textAlign: 'center' }}>
          <Group justify="center" mb="md">
            <IconCloud size={48} color="#0176d3" />
          </Group>
          <Title order={1} size="h2" mb="xs">
            Workbench for Salesforce
          </Title>
          <Text c="dimmed" size="sm">
            Connect to your Salesforce org to get started
          </Text>
        </div>

        <Paper withBorder shadow="md" p={30} radius="md">
          <Stack gap="lg">
            {error && (
              <Text c="red" size="sm" ta="center">
                {getErrorMessage(error)}
              </Text>
            )}
            
            <div>
              <Text size="sm" c="dimmed" mb="xs">
                Sign in with your Salesforce credentials
              </Text>
              
              <Button
                fullWidth
                size="md"
                leftSection={<IconShield size={18} />}
                onClick={handleLogin}
                loading={isLoading}
                variant="filled"
                color="blue"
              >
                Connect to Salesforce
              </Button>
            </div>

            <div>
              <Text size="xs" c="dimmed" ta="center">
                This will redirect you to Salesforce for secure authentication.
                Your credentials are never stored by this application.
              </Text>
            </div>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}

function getErrorMessage(error: string): string {
  switch (error) {
    case 'access_denied':
      return 'Access was denied. Please try again.';
    case 'missing_code':
      return 'Authorization code was missing.';
    case 'token_exchange_failed':
      return 'Failed to exchange token. Please try again.';
    case 'callback_failed':
      return 'Authentication failed. Please try again.';
    default:
      return 'An error occurred during authentication.';
  }
}
