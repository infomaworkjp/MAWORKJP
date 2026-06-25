import { useState, useEffect, useCallback } from 'react';
import { db } from '../db';
import { auth, rtdb, storage, isMockMode } from '../lib/firebase';
import { ref, set } from 'firebase/database';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export function useSync() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(
    localStorage.getItem('lastSyncedAt')
  );

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncData = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    console.log('[Sync] Synchronization started...');

    try {
      if (isMockMode) {
        // Simulate sync in Mock Mode
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Update all pending items in Dexie to synced
        await db.transaction('rw', [db.customers, db.cases, db.consultations, db.evidenceFiles], async () => {
          await db.customers.where('syncStatus').equals('pending').modify({ syncStatus: 'synced' });
          await db.cases.where('syncStatus').equals('pending').modify({ syncStatus: 'synced' });
          await db.consultations.where('syncStatus').equals('pending').modify({ syncStatus: 'synced' });
          await db.evidenceFiles.where('syncStatus').equals('pending').modify({ syncStatus: 'synced' });
        });

        console.log('[Sync] Mock synchronization complete!');
      } else {
        const currentUser = auth?.currentUser;
        if (!currentUser) {
          console.warn('[Sync] Cannot sync: User is not authenticated.');
          setIsSyncing(false);
          return;
        }

        const uid = currentUser.uid;

        // 1. Sync Customers
        const pendingCustomers = await db.customers.where('syncStatus').equals('pending').toArray();
        for (const customer of pendingCustomers) {
          if (!rtdb) continue;
          const firebaseRef = ref(rtdb, `users/${uid}/customers/${customer.customerId}`);
          await set(firebaseRef, {
            ...customer,
            syncStatus: 'synced'
          });
          await db.customers.update(customer.customerId, { syncStatus: 'synced' });
        }

        // 2. Sync Cases
        const pendingCases = await db.cases.where('syncStatus').equals('pending').toArray();
        for (const kase of pendingCases) {
          if (!rtdb) continue;
          const firebaseRef = ref(rtdb, `users/${uid}/cases/${kase.caseId}`);
          await set(firebaseRef, {
            ...kase,
            syncStatus: 'synced'
          });
          await db.cases.update(kase.caseId, { syncStatus: 'synced' });
        }

        // 3. Sync Consultations
        const pendingConsultations = await db.consultations.where('syncStatus').equals('pending').toArray();
        for (const consultation of pendingConsultations) {
          if (!rtdb) continue;
          const firebaseRef = ref(rtdb, `users/${uid}/consultations/${consultation.consultationId}`);
          await set(firebaseRef, {
            ...consultation,
            syncStatus: 'synced'
          });
          await db.consultations.update(consultation.consultationId, { syncStatus: 'synced' });
        }

        // 4. Sync Evidence Files
        const pendingEvidence = await db.evidenceFiles.where('syncStatus').equals('pending').toArray();
        for (const ev of pendingEvidence) {
          let downloadUrl = ev.cloudStorageUrl || '';

          // Upload file if it has binary data and Firebase Storage is available
          if (ev.fileData && storage) {
            const fileRef = sRef(storage, `users/${uid}/evidence/${ev.evidenceId}/${ev.name}`);
            const uploadResult = await uploadBytes(fileRef, ev.fileData);
            downloadUrl = await getDownloadURL(uploadResult.ref);
          }

          if (rtdb) {
            const firebaseRef = ref(rtdb, `users/${uid}/evidence/${ev.evidenceId}`);
            // Save metadata without local binary fileData
            await set(firebaseRef, {
              evidenceId: ev.evidenceId,
              caseId: ev.caseId,
              name: ev.name,
              type: ev.type,
              size: ev.size,
              cloudStorageUrl: downloadUrl,
              createdAt: ev.createdAt,
              syncStatus: 'synced'
            });

            await db.evidenceFiles.update(ev.evidenceId, {
              syncStatus: 'synced',
              cloudStorageUrl: downloadUrl
            });
          }
        }

        console.log('[Sync] Real synchronization complete!');
      }

      const timestamp = new Date().toLocaleString();
      setLastSyncedAt(timestamp);
      localStorage.setItem('lastSyncedAt', timestamp);
    } catch (error) {
      console.error('[Sync] Error during synchronization:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  // Auto-sync when online
  useEffect(() => {
    if (isOnline) {
      syncData();
    }
  }, [isOnline, syncData]);

  return {
    isOnline,
    isSyncing,
    lastSyncedAt,
    syncData,
  };
}
