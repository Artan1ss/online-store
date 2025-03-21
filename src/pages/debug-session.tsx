import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from '@/styles/DebugSession.module.css';

interface DebugData {
  serverSession: any;
  databaseStatus: {
    connected: boolean;
    error?: string;
    code?: string;
    details?: any;
  };
  userInfo: any;
  addresses: any[];
  paymentMethods: any[];
  userDataError?: {
    message: string;
    code?: string;
  };
}

export default function DebugSession() {
  const { data: clientSession, status } = useSession();
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDebugData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/debug');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get debug data');
        }
        
        const data = await response.json();
        setDebugData(data);
        setError(null);
      } catch (err: any) {
        console.error('Error getting debug data:', err);
        setError(err.message || 'An error occurred while getting debug data');
      } finally {
        setLoading(false);
      }
    };

    fetchDebugData();
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Session and Database Debug Page</h1>
      
      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : error ? (
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      ) : (
        <div className={styles.content}>
          <section className={styles.section}>
            <h2>Client Session State</h2>
            <div className={styles.statusBadge} data-status={status}>
              {status}
            </div>
            <pre className={styles.codeBlock}>
              {JSON.stringify(clientSession, null, 2)}
            </pre>
          </section>

          <section className={styles.section}>
            <h2>Server Session State</h2>
            <div className={styles.statusBadge} data-status={debugData?.serverSession ? 'authenticated' : 'unauthenticated'}>
              {debugData?.serverSession ? 'authenticated' : 'unauthenticated'}
            </div>
            <pre className={styles.codeBlock}>
              {JSON.stringify(debugData?.serverSession, null, 2)}
            </pre>
          </section>
          
          <section className={styles.section}>
            <h2>Database Status</h2>
            <div className={styles.statusBadge} data-status={debugData?.databaseStatus.connected ? 'connected' : 'disconnected'}>
              {debugData?.databaseStatus.connected ? 'connected' : 'disconnected'}
            </div>
            {debugData?.databaseStatus.error && (
              <div className={styles.error}>
                <p>Error: {debugData.databaseStatus.error}</p>
                {debugData.databaseStatus.code && <p>Error Code: {debugData.databaseStatus.code}</p>}
              </div>
            )}
          </section>

          {debugData?.userInfo && (
            <section className={styles.section}>
              <h2>User Information</h2>
              <pre className={styles.codeBlock}>
                {JSON.stringify(debugData.userInfo, null, 2)}
              </pre>
            </section>
          )}

          {debugData?.addresses && debugData.addresses.length > 0 && (
            <section className={styles.section}>
              <h2>Address Information ({debugData.addresses.length})</h2>
              <pre className={styles.codeBlock}>
                {JSON.stringify(debugData.addresses, null, 2)}
              </pre>
            </section>
          )}

          {debugData?.paymentMethods && debugData.paymentMethods.length > 0 && (
            <section className={styles.section}>
              <h2>Payment Methods ({debugData.paymentMethods.length})</h2>
              <pre className={styles.codeBlock}>
                {JSON.stringify(debugData.paymentMethods, null, 2)}
              </pre>
            </section>
          )}

          {debugData?.userDataError && (
            <section className={styles.section}>
              <h2>User Data Retrieval Error</h2>
              <div className={styles.error}>
                <p>Error: {debugData.userDataError.message}</p>
                {debugData.userDataError.code && <p>Error Code: {debugData.userDataError.code}</p>}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
} 