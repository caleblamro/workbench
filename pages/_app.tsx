import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/code-highlight/styles.css';

import type { AppProps } from 'next/app';
import Head from 'next/head';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from '../theme';
import hljs from 'highlight.js/lib/core';
import sqlLang from 'highlight.js/lib/languages/sql';
import { CodeHighlightAdapterProvider, createHighlightJsAdapter } from '@mantine/code-highlight';

hljs.registerLanguage('sql', sqlLang);

const highlightJsAdapter = createHighlightJsAdapter(hljs);

export default function App({ Component, pageProps }: AppProps) {
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
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css"
          />
        </Head>
        <Notifications />
        <Component {...pageProps} />
      </CodeHighlightAdapterProvider>
    </MantineProvider>
  );
}
