const syncData = useCallback(async () => {
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
      console.log('[Sync] Syncing for user:', uid);

      // Force re-sync of legacy mock data when switching to real firebase mode
      const hasResetSyncStatus = localStorage.getItem('syncStatusReset_v1');
      if (!hasResetSyncStatus) {
        console.log('[Sync] Resetting syncStatus of local data to force upload to Real Firebase...');
        await db.transaction('rw', [db.customers, db.cases, db.consultations, db.evidenceFiles], async () => {
          await db.customers.toCollection().modify({ syncStatus: 'pending' });
          await db.cases.toCollection().modify({ syncStatus: 'pending' });
          await db.consultations.toCollection().modify({ syncStatus: 'pending' });
          await db.evidenceFiles.toCollection().modify({ syncStatus: 'pending' });
        });
        localStorage.setItem('syncStatusReset_v1', 'true');
        console.log('[Sync] Local data reset complete.');
      }

      // 1. Sync Up Customers
      const pendingCustomers = await db.customers.where('syncStatus').equals('pending').toArray();
      console.log('[Sync] Found pending customers:', pendingCustomers.length);

      for (const customer of pendingCustomers) {
        if (!rtdb) {
          console.warn('[Sync] rtdb is not available');
          continue;
        }
        const firebaseRef = ref(rtdb, `users/${uid}/customers/${customer.customerId}`);
        await set(firebaseRef, {
          ...customer,
          syncStatus: 'synced'
        });
        await db.customers.update(customer.customerId, { syncStatus: 'synced' });
        console.log('[Sync] Uploaded customer:', customer.customerId);
      }

      // 2. Sync Up Cases
      const pendingCases = await db.cases.where('syncStatus').equals('pending').toArray();
      console.log('[Sync] Found pending cases:', pendingCases.length);

      for (const kase of pendingCases) {
        if (!rtdb) continue;
        const firebaseRef = ref(rtdb, `users/${uid}/cases/${kase.caseId}`);
        await set(firebaseRef, {
          ...kase,
          syncStatus: 'synced'
        });
        await db.cases.update(kase.caseId, { syncStatus: 'synced' });
        console.log('[Sync] Uploaded case:', kase.caseId);
      }

      // 3. Sync Up Consultations
      const pendingConsultations = await db.consultations.where('syncStatus').equals('pending').toArray();
      console.log('[Sync] Found pending consultations:', pendingConsultations.length);

      for (const consultation of pendingConsultations) {
        if (!rtdb) continue;
        const firebaseRef = ref(rtdb, `users/${uid}/consultations/${consultation.consultationId}`);
        await set(firebaseRef, {
          ...consultation,
          syncStatus: 'synced'
        });
        await db.consultations.update(consultation.consultationId, { syncStatus: 'synced' });
        console.log('[Sync] Uploaded consultation:', consultation.consultationId);
      }

      // 4. Sync Up Evidence Files
      const pendingEvidence = await db.evidenceFiles.where('syncStatus').equals('pending').toArray();
      console.log('[Sync] Found pending evidence:', pendingEvidence.length);

      for (const ev of pendingEvidence) {
        let downloadUrl = ev.cloudStorageUrl || '';

        // Upload file if it has binary data and Firebase Storage is available
        if (ev.fileData && storage) {
          const fileRef = sRef(storage, `users/${uid}/evidence/${ev.evidenceId}/${ev.name}`);
          const uploadResult = await uploadBytes(fileRef, ev.fileData);
          downloadUrl = await getDownloadURL(uploadResult.ref);
          console.log('[Sync] Uploaded file:', ev.name);
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
          console.log('[Sync] Uploaded evidence metadata:', ev.evidenceId);
        }
      }

      // 5. Sync Down Customers
      if (rtdb) {
        const customersRef = ref(rtdb, `users/${uid}/customers`);
        const customersSnapshot = await get(customersRef);
        if (customersSnapshot.exists()) {
          const remoteCustomers = customersSnapshot.val();
          console.log('[Sync] Syncing down customers...');
          for (const key of Object.keys(remoteCustomers)) {
            const remoteCustomer = remoteCustomers[key];
            const localCustomer = await db.customers.get(remoteCustomer.customerId);
            if (!localCustomer || localCustomer.syncStatus !== 'pending') {
              await db.customers.put({ ...remoteCustomer, syncStatus: 'synced' });
            }
          }
        }

        // 6. Sync Down Cases
        const casesRef = ref(rtdb, `users/${uid}/cases`);
        const casesSnapshot = await get(casesRef);
        if (casesSnapshot.exists()) {
          const remoteCases = casesSnapshot.val();
          console.log('[Sync] Syncing down cases...');
          for (const key of Object.keys(remoteCases)) {
            const remoteCase = remoteCases[key];
            const localCase = await db.cases.get(remoteCase.caseId);
            if (!localCase || localCase.syncStatus !== 'pending') {
              await db.cases.put({ ...remoteCase, syncStatus: 'synced' });
            }
          }
        }

        // 7. Sync Down Consultations
        const consultationsRef = ref(rtdb, `users/${uid}/consultations`);
        const consultationsSnapshot = await get(consultationsRef);
        if (consultationsSnapshot.exists()) {
          const remoteConsultations = consultationsSnapshot.val();
          console.log('[Sync] Syncing down consultations...');
          for (const key of Object.keys(remoteConsultations)) {
            const remoteConsultation = remoteConsultations[key];
            const localConsultation = await db.consultations.get(remoteConsultation.consultationId);
            if (!localConsultation || localConsultation.syncStatus !== 'pending') {
              await db.consultations.put({ ...remoteConsultation, syncStatus: 'synced' });
            }
          }
        }

        // 8. Sync Down Evidence metadata
        const evidenceRef = ref(rtdb, `users/${uid}/evidence`);
        const evidenceSnapshot = await get(evidenceRef);
        if (evidenceSnapshot.exists()) {
          const remoteEvidences = evidenceSnapshot.val();
          console.log('[Sync] Syncing down evidence...');
          for (const key of Object.keys(remoteEvidences)) {
            const remoteEvidence = remoteEvidences[key];
            const localEvidence = await db.evidenceFiles.get(remoteEvidence.evidenceId);
            if (!localEvidence || localEvidence.syncStatus !== 'pending') {
              await db.evidenceFiles.put({ ...remoteEvidence, syncStatus: 'synced' });
            }
          }
        }
      }

      console.log('[Sync] Real synchronization complete (Sync Up & Sync Down)!');
    }

    const timestamp = new Date().toLocaleString();
    setLastSyncedAt(timestamp);
    localStorage.setItem('lastSyncedAt', timestamp);
  } catch (error) {
    console.error('[Sync] Error during synchronization:', error);
  } finally {
    setIsSyncing(false);
  }
}, [user]); // ← isSyncing を削除！

// Auto-sync when online and user is logged in
useEffect(() => {
  if (!isOnline || !user || isSyncing) return;

  syncData();
}, [isOnline, user, syncData, isSyncing]); // ← isSyncing を追加