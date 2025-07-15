import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  IconApi,
  IconChevronDown,
  IconCode,
  IconDatabase,
  IconHome,
  IconLogout,
  IconMoon,
  IconSearch,
  IconSettings,
  IconSun,
  IconUser,
} from '@tabler/icons-react';
import {
  AppShell,
  Avatar,
  Button,
  Group,
  LoadingOverlay,
  Menu,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import type { AuthSession } from '../types/salesforce';

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const isLight = useMemo(() => {
    return colorScheme === 'light';
  }, [colorScheme]);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const sessionData = await response.json();
        setSession(sessionData);
      } else {
        router.push('/');
      }
    } catch (error) {
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      notifications.show({
        title: 'Logged out',
        message: 'You have been successfully logged out',
        color: 'green',
      });
      router.push('/');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to logout',
        color: 'red',
      });
    }
  };

  const navigationItems = [
    {
      icon: <IconHome size={16} />,
      label: 'Dashboard',
      href: '/dashboard',
    },
    {
      icon: <IconCode size={16} />,
      label: 'SOQL Query',
      href: '/query',
    },
    {
      icon: <IconSearch size={16} />,
      label: 'Object Inspector',
      href: '/objects',
      disabled: true,
    },
    {
      icon: <IconApi size={16} />,
      label: 'REST Explorer',
      href: '/rest',
      disabled: true,
    },
    {
      icon: <IconDatabase size={16} />,
      label: 'Data Tools',
      href: '/data',
      disabled: true,
    },
  ];

  if (loading) {
    return <LoadingOverlay visible />;
  }

  if (!session) {
    return null;
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: true },
      }}
      padding="md"
    >
      <AppShell.Header p="md">
        <Group justify="space-between">
          <Group>
            <Title order={3}>Workbench</Title>
          </Group>

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button variant="subtle" rightSection={<IconChevronDown size={16} />}>
                <Group gap="xs">
                  <Avatar src={session.user.photos?.thumbnail} size={24} radius="xl" />
                  <Text size="sm">{session.user.display_name}</Text>
                </Group>
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item leftSection={<IconUser size={14} />}>Profile</Menu.Item>
              <Menu.Item leftSection={<IconSettings size={14} />}>Settings</Menu.Item>
              <Menu.Item
                leftSection={isLight ? <IconMoon size={14} /> : <IconSun size={14} />}
                onClick={() => setColorScheme(isLight ? 'dark' : 'light')}
              >
                {isLight ? 'Dark mode' : 'Light mode'}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={handleLogout}>
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow my="md" component={ScrollArea}>
          <Stack gap="xs">
            {navigationItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                leftSection={item.icon}
                active={router.pathname === item.href}
                disabled={item.disabled}
                onClick={() => {
                  if (!item.disabled) {
                    router.push(item.href);
                  }
                }}
              />
            ))}
          </Stack>
        </AppShell.Section>

        <AppShell.Section>
          <Stack gap="xs">
            <Text size="xs" c="dimmed" fw={500}>
              Connected to:
            </Text>
            <Text size="xs" c="dimmed">
              {session.user.username}
            </Text>
            <Text size="xs" c="dimmed">
              {session.instanceUrl}
            </Text>
          </Stack>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
