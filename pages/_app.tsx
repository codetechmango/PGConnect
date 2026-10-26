import type { AppProps } from 'next/app';
import Head from 'next/head';
import { AuthProvider } from '../lib/authContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Head>
        <title>PG Connect | Find a PG That Feels Like Home</title>
        <meta
          name="description"
          content="India's trusted institutional rental discovery platform for students and working professionals. Zero brokerage, 100% verified properties, and digital rent agreements."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
