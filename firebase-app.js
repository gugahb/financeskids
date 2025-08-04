
async function waitForFirebase() {
    return new Promise((resolve, reject) => {
        const checkFirebase = () => {
            if (window.firebase && window.firebase.db) {
                resolve(window.firebase.db);
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
        
        setTimeout(() => {
            reject(new Error('❌ Timeout aguardando Firebase'));
        }, 10000);
    });
}

const LocalStorage = {
    save(key, data) {
        try {
            localStorage.setItem(`financeskids-${key}`, JSON.stringify(data));
            return true;
        } catch (error) {
            return false;
        }
    },

    load(key) {
        try {
            const data = localStorage.getItem(`financeskids-${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            return null;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(`financeskids-${key}`);
            return true;
        } catch (error) {
            return false;
        }
    },

    addPendingOperation(operation) {
        const pending = this.load('pending-operations') || [];
        pending.push({
            ...operation,
            timestamp: Date.now(),
            id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
        this.save('pending-operations', pending);
    },

    getPendingOperations() {
        return this.load('pending-operations') || [];
    },

    clearPendingOperations() {
        this.remove('pending-operations');
    }
};

const FirebaseDB = {
    db: null,
    isOnline: navigator.onLine,
    syncInProgress: false,
    
    async init() {
        try {
            this.db = await waitForFirebase();
            
            this.setupNetworkListeners();
            
            if (this.isOnline) {
                this.syncPendingOperations();
            }
            
        } catch (error) {
            this.db = null;
        }
    },

    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncPendingOperations();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    },

    async loadAllChildren() {
        try {
            const localChildren = LocalStorage.load('all-children') || [];

            if (this.isOnline && this.db) {
                try {
                    const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
                    
                    const querySnapshot = await getDocs(collection(this.db, 'children'));
                    
                    const firebaseChildren = [];
                    const firebaseChildNames = new Set();
                    
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        const child = {
                            name: doc.id,
                            avatar: data.avatar || '🧒',
                            balance: data.balance || 0,
                            lastUpdate: data.lastUpdate
                        };
                        firebaseChildren.push(child);
                        firebaseChildNames.add(doc.id);
                    });
                    
                    
                    const validLocalChildren = localChildren.filter(localChild => {
                        const stillExists = firebaseChildNames.has(localChild.name);
                        if (!stillExists) {
                            LocalStorage.remove(`child-${localChild.name}`);
                        }
                        return stillExists;
                    });
                    
                    const mergedChildren = this.mergeChildrenData(validLocalChildren, firebaseChildren);
                    
                    LocalStorage.save('all-children', mergedChildren);
                    
                    return mergedChildren;
                    
                } catch (firebaseError) {
                    return localChildren;
                }
            } else {
                return localChildren;
            }
            
        } catch (error) {
            return [];
        }
    },

    mergeChildrenData(localChildren, firebaseChildren) {
        const merged = [...firebaseChildren];
        
        localChildren.forEach(localChild => {
            const existsInFirebase = merged.find(child => child.name === localChild.name);
            if (!existsInFirebase) {
                merged.push(localChild);
            }
        });
        
        return merged;
    },

    async loadChildData(childName) {
        try {
            const localData = LocalStorage.load(`child-${childName}`);

            if (this.isOnline && this.db) {
                try {
                    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
                    
                    const docRef = doc(this.db, 'children', childName);
                    const docSnap = await getDoc(docRef);
                    
                    if (docSnap.exists()) {
                        const firebaseData = docSnap.data();
                        const childData = {
                            currentChild: { name: childName, avatar: firebaseData.avatar || '🧒' },
                            balance: firebaseData.balance || 0,
                            transactions: firebaseData.transactions || [],
                            achievements: firebaseData.achievements || []
                        };
                        
                        LocalStorage.save(`child-${childName}`, childData);
                        return childData;
                    }
                } catch (firebaseError) {
                }
            }

            if (localData) {
                return localData;
            } else {
                const newChildData = {
                    currentChild: { name: childName, avatar: '🧒' },
                    balance: 0,
                    transactions: [],
                    achievements: []
                };
                LocalStorage.save(`child-${childName}`, newChildData);
                return newChildData;
            }
            
        } catch (error) {
            return null;
        }
    },

    async saveChildData(childName, childData) {
        try {
            LocalStorage.save(`child-${childName}`, childData);

            if (this.isOnline && this.db) {
                try {
                    const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
                    
                    const dataToSave = {
                        avatar: childData.currentChild?.avatar || '🧒',
                        balance: childData.balance || 0,
                        transactions: childData.transactions || [],
                        achievements: childData.achievements || [],
                        lastUpdate: serverTimestamp()
                    };
                    
                    const docRef = doc(this.db, 'children', childName);
                    await setDoc(docRef, dataToSave);
                    
                    return true;
                } catch (firebaseError) {
                    
                    LocalStorage.addPendingOperation({
                        type: 'saveChild',
                        childName: childName,
                        data: childData
                    });
                }
            } else {
                
                LocalStorage.addPendingOperation({
                    type: 'saveChild',
                    childName: childName,
                    data: childData
                });
            }
            
            return true;
        } catch (error) {
            return false;
        }
    },

    async syncPendingOperations() {
        if (this.syncInProgress || !this.isOnline || !this.db) {
            return;
        }

        const pendingOps = LocalStorage.getPendingOperations();
        if (pendingOps.length === 0) {
            return;
        }

        this.syncInProgress = true;

        let syncedCount = 0;
        const failedOps = [];

        for (const operation of pendingOps) {
            try {
                switch (operation.type) {
                    case 'saveChild':
                        await this.forceSaveToFirebase(operation.childName, operation.data);
                        syncedCount++;
                        break;
                    case 'createChild':
                        await this.forceCreateInFirebase(operation.name, operation.avatar);
                        syncedCount++;
                        break;
                    default:
                }
            } catch (error) {
                failedOps.push(operation);
            }
        }

        if (failedOps.length > 0) {
            LocalStorage.save('pending-operations', failedOps);
        } else {
            LocalStorage.clearPendingOperations();
        }

        this.syncInProgress = false;
        
        if (window.onSyncComplete) {
            window.onSyncComplete(syncedCount, failedOps.length);
        }
    },

    async forceSaveToFirebase(childName, childData) {
        const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        
        const dataToSave = {
            avatar: childData.currentChild?.avatar || '🧒',
            balance: childData.balance || 0,
            transactions: childData.transactions || [],
            achievements: childData.achievements || [],
            lastUpdate: serverTimestamp()
        };
        
        const docRef = doc(this.db, 'children', childName);
        await setDoc(docRef, dataToSave);
    },

    async forceCreateInFirebase(name, avatar) {
        const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        
        const childData = {
            avatar: avatar,
            balance: 0,
            transactions: [],
            achievements: [],
            createdAt: serverTimestamp(),
            lastUpdate: serverTimestamp()
        };
        
        const docRef = doc(this.db, 'children', name);
        await setDoc(docRef, childData);
    },

    async manualSync() {
        
        if (!this.isOnline) {
            throw new Error('Sem conexão com a internet');
        }
        
        if (!this.db) {
            throw new Error('Firebase não disponível');
        }

        const allLocalChildren = LocalStorage.load('all-children') || [];
        let syncedCount = 0;

        for (const child of allLocalChildren) {
            try {
                const localChildData = LocalStorage.load(`child-${child.name}`);
                if (localChildData) {
                    await this.forceSaveToFirebase(child.name, localChildData);
                    syncedCount++;
                }
            } catch (error) {
            }
        }

        await this.syncPendingOperations();

        return syncedCount;
    },

    async forceRefreshFromFirebase() {
        
        if (!this.isOnline) {
            throw new Error('Sem conexão com a internet');
        }
        
        if (!this.db) {
            throw new Error('Firebase não disponível');
        }

        try {
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            
            const querySnapshot = await getDocs(collection(this.db, 'children'));
            
            const firebaseChildren = [];
            const firebaseChildNames = new Set();
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const child = {
                    name: doc.id,
                    avatar: data.avatar || '🧒',
                    lastUpdate: data.lastUpdate
                };
                firebaseChildren.push(child);
                firebaseChildNames.add(doc.id);
            });
            
            const localChildren = LocalStorage.load('all-children') || [];
            localChildren.forEach(child => {
                LocalStorage.remove(`child-${child.name}`);
            });
            
            LocalStorage.save('all-children', firebaseChildren);
            
            for (const child of firebaseChildren) {
                const childData = await this.loadChildDataFromFirebase(child.name);
                if (childData) {
                    LocalStorage.save(`child-${child.name}`, childData);
                }
            }
            
            return firebaseChildren.length;
            
        } catch (error) {
            throw error;
        }
    },

    async loadChildDataFromFirebase(childName) {
        try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            
            const docRef = doc(this.db, 'children', childName);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    currentChild: { name: childName, avatar: data.avatar || '🧒' },
                    balance: data.balance || 0,
                    transactions: data.transactions || [],
                    achievements: data.achievements || []
                };
            }
            return null;
        } catch (error) {
            return null;
        }
    },

    getSyncStatus() {
        const pendingOps = LocalStorage.getPendingOperations();
        return {
            isOnline: this.isOnline,
            hasPendingOperations: pendingOps.length > 0,
            pendingCount: pendingOps.length,
            syncInProgress: this.syncInProgress
        };
    },

    clearAllLocalData() {
        try {
            
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('financeskids-')) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
            return keysToRemove.length;
        } catch (error) {
            throw error;
        }
    },
    async createChild(name, avatar) {
        try {
            const childData = {
                avatar: avatar,
                balance: 0,
                transactions: [],
                achievements: [],
                createdAt: new Date().toISOString()
            };
            
            LocalStorage.save(`child-${name}`, childData);
            
            const allChildren = LocalStorage.load('all-children') || [];
            if (!allChildren.find(c => c.name === name)) {
                allChildren.push({ name, avatar });
                LocalStorage.save('all-children', allChildren);
            }
            

            if (this.isOnline && this.db) {
                try {
                    await this.forceCreateInFirebase(name, avatar);
                } catch (firebaseError) {
                    LocalStorage.addPendingOperation({
                        type: 'createChild',
                        name: name,
                        avatar: avatar
                    });
                }
            } else {
                LocalStorage.addPendingOperation({
                    type: 'createChild',
                    name: name,
                    avatar: avatar
                });
            }
            
            return true;
        } catch (error) {
            return false;
        }
    },

    async childExists(childName) {
        try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            
            const docRef = doc(this.db, 'children', childName);
            const docSnap = await getDoc(docRef);
            
            return docSnap.exists();
        } catch (error) {
            return false;
        }
    },

    async deleteChild(childName) {
        try {
            const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            
            const docRef = doc(this.db, 'children', childName);
            await deleteDoc(docRef);
            
            return true;
        } catch (error) {
            return false;
        }
    },

    async resetDatabase() {
        try {
            const { collection, getDocs, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            
            const querySnapshot = await getDocs(collection(this.db, 'children'));
            
            const deletePromises = [];
            querySnapshot.forEach((doc) => {
                deletePromises.push(deleteDoc(doc.ref));
            });
            
            await Promise.all(deletePromises);
            return true;
        } catch (error) {
            return false;
        }
    },

    async exportAllData() {
        try {
            const children = await this.loadAllChildren();
            
            const exportData = {
                version: "2.0-firebase",
                exportDate: new Date().toISOString(),
                platform: "firebase",
                children: children.map(child => ({
                    name: child.name,
                    avatar: child.avatar
                })),
                childrenData: {}
            };
            
            for (const child of children) {
                const childData = await this.loadChildData(child.name);
                if (childData) {
                    exportData.childrenData[child.name] = childData;
                }
            }
            
            return exportData;
        } catch (error) {
            return null;
        }
    }
};

window.FirebaseDB = FirebaseDB;
