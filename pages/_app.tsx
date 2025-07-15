import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/code-highlight/styles.css';

import type { ReactElement } from 'react';
import Head from 'next/head';
import hljs from 'highlight.js/lib/core';
import sqlLang from 'highlight.js/lib/languages/sql';
import { CodeHighlightAdapterProvider, createHighlightJsAdapter } from '@mantine/code-highlight';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from '../theme';
import type { AppPropsWithLayout } from '../types/layout';

hljs.registerLanguage('sql', sqlLang);

const highlightJsAdapter = createHighlightJsAdapter(hljs);

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page: ReactElement) => page);

  return (
    <MantineProvider theme={theme}>
      <CodeHighlightAdapterProvider adapter={highlightJsAdapter}>
        <Head>
          <title>Workbench for Salesforce</title>
          <meta
            name="viewport"
            content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
          />
          <link rel="shortcut icon" href="/favicon.svg" />
        </Head>
        <Notifications />
        {getLayout(<Component {...pageProps} />)}
      </CodeHighlightAdapterProvider>
    </MantineProvider>
  );
}
