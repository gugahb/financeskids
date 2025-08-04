    async function loadAllChildren() {
        try {
            allChildren = await FirebaseDB.loadAllChildren();
        } catch (e) {
            allChildren = [];
        }
    }

    async function loadAndDisplayChild() {
        if (state.currentChild) {
            await loadChildStateFromFirebase(state.currentChild.name);
            await loadAllChildren(); 
            render();
        }
    }

document.addEventListener('DOMContentLoaded', async function() {
    const app = document.getElementById('app');
    if (!app) {
        return;
    }

    try {
        await FirebaseDB.init();
    } catch (error) {
    }

    let state = {
        currentChild: null,
        balance: 0,
        transactions: [],
        achievements: []
    };

    let allChildren = [];

    async function loadAllChildren() {
        try {
            allChildren = await FirebaseDB.loadAllChildren();
        } catch (e) {
            allChildren = [];
        }
    }

    async function loadChildStateFromFirebase(childName) {
        try {
            const childData = await FirebaseDB.loadChildData(childName);
            if (childData) {
                state = { ...state, ...childData };
            }
        } catch (e) {
        }
    }

    async function saveChildStateToFirebase() {
        if (!state.currentChild) return;
        
        try {
            const success = await FirebaseDB.saveChildData(state.currentChild.name, state);
        } catch (e) {
        }
    }

    function formatMoney(value) {
        return 'R$ ' + Number(value).toLocaleString('pt-BR', {minimumFractionDigits: 2});
    }

    function renderWelcome() {
        const existingChildren = allChildren.map(child => {
            const childBalance = child.balance || 0;
            
            return `
                <div class="existing-child flex items-center gap-3 p-3 border rounded-lg hover:bg-green-50 cursor-pointer transition-colors" data-child='${JSON.stringify({name: child.name, avatar: child.avatar})}'>
                    <span class="text-3xl">${child.avatar}</span>
                    <div class="flex-1">
                        <div class="font-medium text-lg">${child.name}</div>
                        <div class="text-sm text-green-600 font-bold">${formatMoney(childBalance)}</div>
                    </div>
                    <span class="text-green-500">
                        <i class="fas fa-arrow-right"></i>
                    </span>
                </div>
            `;
        }).join('');

        app.innerHTML = `
            <div class="max-w-xs w-full mx-auto bg-white rounded-xl shadow-lg p-6 flex flex-col items-center gap-4">
                <div class="text-5xl">🧒💰</div>
                <h1 class="text-xl font-bold text-center">Bem-vindo ao<br>FinancesKids!</h1>
                
                ${allChildren.length > 0 ? `
                    <div class="w-full">
                        <p class="text-sm text-gray-600 mb-3 font-medium">Selecione uma criança:</p>
                        <div class="space-y-2 mb-4">
                            ${existingChildren}
                        </div>
                        <div class="text-center text-sm text-gray-400 mb-3">── ou ──</div>
                    </div>
                ` : ''}
                
                <div class="w-full">
                    <p class="text-sm font-medium mb-3 text-blue-700">
                        <i class="fas fa-plus-circle"></i> Nova criança:
                    </p>
                    <input id="childName" class="w-full px-4 py-3 border rounded-lg mb-4 text-center font-medium" placeholder="Nome da criança" maxlength="20" />
                    <div class="grid grid-cols-4 gap-2 mb-4">
                        <button class="avatar-btn text-2xl p-3 border rounded-lg hover:bg-green-100 transition-colors" data-avatar="🦁">🦁</button>
                        <button class="avatar-btn text-2xl p-3 border rounded-lg hover:bg-green-100 transition-colors" data-avatar="🦄">🦄</button>
                        <button class="avatar-btn text-2xl p-3 border rounded-lg hover:bg-green-100 transition-colors" data-avatar="🐼">🐼</button>
                        <button class="avatar-btn text-2xl p-3 border rounded-lg hover:bg-green-100 transition-colors" data-avatar="🐸">🐸</button>
                        <button class="avatar-btn text-2xl p-3 border rounded-lg hover:bg-green-100 transition-colors" data-avatar="👧">👧</button>
                        <button class="avatar-btn text-2xl p-3 border rounded-lg hover:bg-green-100 transition-colors" data-avatar="👦">👦</button>
                        <button class="avatar-btn text-2xl p-3 border rounded-lg hover:bg-green-100 transition-colors" data-avatar="🐻">🐻</button>
                        <button class="avatar-btn text-2xl p-3 border rounded-lg hover:bg-green-100 transition-colors" data-avatar="🐶">🐶</button>
                    </div>
                    <button id="startBtn" class="bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-lg w-full font-bold text-lg shadow-md transition-colors">
                        Começar 🚀
                    </button>
                </div>
            </div>
        `;
    }

    function renderApp() {
        app.innerHTML = `
            <div class="max-w-md w-full mx-auto space-y-4">
                <!-- Header -->
                <div class="bg-white rounded-lg shadow-md p-4">
                    <div class="flex items-center gap-3 mb-2">
                        <span class="text-4xl">${state.currentChild.avatar}</span>
                        <div class="flex-1">
                            <div class="font-bold text-xl text-gray-800">${state.currentChild.name}</div>
                            <div class="text-sm text-gray-500">
                                ${allChildren.length > 1 ? `${allChildren.length} crianças cadastradas` : 'Primeira criança!'}
                            </div>
                        </div>
                        <div class="flex gap-2">
                            ${allChildren.length > 1 ? `
                                <button id="switchChild" class="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-colors" title="Trocar criança">
                                    <i class="fas fa-users"></i>
                                </button>
                            ` : ''}
                            <button id="manualSync" class="bg-purple-100 hover:bg-purple-200 text-purple-700 p-2 rounded-lg transition-colors" title="Sincronizar com Firebase">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                            <button id="forceRefresh" class="bg-orange-100 hover:bg-orange-200 text-orange-700 p-2 rounded-lg transition-colors" title="Atualizar do Firebase">
                                <i class="fas fa-cloud-download-alt"></i>
                            </button>
                            <button id="clearCache" class="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-colors" title="Limpar Cache">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                            <button id="exportFirebase" class="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg transition-colors" title="Exportar backup">
                                <i class="fas fa-download"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Saldo -->
                <div class="bg-gradient-to-r from-green-400 to-green-500 rounded-lg p-6 text-center text-white shadow-md">
                    <div class="text-sm opacity-90 mb-1">💰 Saldo atual</div>
                    <div class="text-3xl font-bold">${formatMoney(state.balance)}</div>
                </div>

                <!-- Botões de Ação -->
                <div class="grid grid-cols-2 gap-3">
                    <button id="addIncome" class="bg-green-500 hover:bg-green-600 text-white rounded-lg py-4 font-bold text-lg shadow-md transition-colors">
                        <i class="fas fa-plus"></i><br>
                        <span class="text-sm">Entrada</span>
                    </button>
                    <button id="addExpense" class="bg-red-500 hover:bg-red-600 text-white rounded-lg py-4 font-bold text-lg shadow-md transition-colors">
                        <i class="fas fa-minus"></i><br>
                        <span class="text-sm">Saída</span>
                    </button>
                </div>

                <!-- Histórico -->
                <div class="bg-white rounded-lg shadow-md p-4">
                    <div class="font-bold text-lg mb-3 text-green-700">
                        <i class="fas fa-list"></i> Histórico Recente
                    </div>
                    <div>
                        ${state.transactions.length === 0 ? 
                            '<div class="text-sm text-gray-500 text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">Nenhuma movimentação ainda.<br>Faça sua primeira transação! 💸</div>' :
                            state.transactions.slice(0, 8).map((t, index) => `
                                <div class="py-3 flex justify-between items-center text-sm ${index < state.transactions.length - 1 ? 'border-b' : ''} group hover:bg-gray-50">
                                    <div class="flex-1">
                                        <div class="font-medium">${t.desc}</div>
                                        <div class="text-xs text-gray-500">${new Date(t.date).toLocaleDateString('pt-BR')} às ${new Date(t.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="${t.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} px-2 py-1 rounded font-bold text-sm">
                                            ${t.type === 'in' ? '+' : '-'}${formatMoney(t.value)}
                                        </span>
                                        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button class="edit-transaction bg-blue-100 hover:bg-blue-200 text-blue-600 p-1 rounded text-xs" 
                                                    data-index="${index}" title="Editar transação">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="delete-transaction bg-red-100 hover:bg-red-200 text-red-600 p-1 rounded text-xs" 
                                                    data-index="${index}" title="Deletar transação">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')
                        }
                        ${state.transactions.length > 8 ? `
                            <div class="text-center mt-3">
                                <span class="text-xs text-gray-400">... e mais ${state.transactions.length - 8} transações</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    function render() {
        if (!state.currentChild) {
            renderWelcome();
        } else {
            renderApp();
        }
    }

    async function switchChild() {
        if (state.currentChild) {
            await saveChildStateToFirebase();
        }
        state.currentChild = null;
        render();
    }

    async function selectExistingChild(childData) {
        state.currentChild = childData;
        await loadChildStateFromFirebase(childData.name);
        render();
    }

    async function createNewChild(name, avatar) {
        const exists = await FirebaseDB.childExists(name);
        if (exists) {
            alert('Já existe uma criança com este nome! Escolha outro nome.');
            return;
        }
        
        const success = await FirebaseDB.createChild(name, avatar);
        if (!success) {
            alert('Erro ao criar criança. Tente novamente.');
            return;
        }
        
        state.currentChild = { name, avatar };
        
        state.balance = 0;
        state.transactions = [];
        state.achievements = [];
        
        await loadAllChildren();
        render();
    }

    async function exportFirebaseData() {
        if (state.currentChild) {
            await saveChildStateToFirebase();
        }
        
        const exportData = await FirebaseDB.exportAllData();
        if (!exportData) {
            alert('❌ Erro ao exportar dados do Firebase!');
            return;
        }
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `financeskids-firebase-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert(`✅ Dados exportados do Firebase!\n\n📁 Arquivo: ${link.download}\n👥 ${exportData.children.length} crianças\n� Backup do Firebase\n\nVocê pode restaurar estes dados em qualquer lugar!`);
    }

    let selectedAvatar = '🦁';

    app.addEventListener('click', async function(e) {
        if (e.target.closest('.existing-child')) {
            const childData = JSON.parse(e.target.closest('.existing-child').dataset.child);
            await selectExistingChild(childData);
            return;
        }

        if (e.target.classList.contains('avatar-btn')) {
            selectedAvatar = e.target.dataset.avatar;
            
            app.querySelectorAll('.avatar-btn').forEach(btn => {
                btn.classList.remove('bg-green-200', 'ring-2', 'ring-green-400');
            });
            e.target.classList.add('bg-green-200', 'ring-2', 'ring-green-400');
            return;
        }

        if (e.target.id === 'startBtn') {
            const name = app.querySelector('#childName').value.trim();
            if (!name) {
                alert('Digite o nome da criança!');
                return;
            }
            
            await createNewChild(name, selectedAvatar);
            return;
        }

        if (e.target.closest('.edit-transaction')) {
            const index = parseInt(e.target.closest('.edit-transaction').dataset.index);
            await editTransaction(index);
            return;
        }

        if (e.target.closest('.delete-transaction')) {
            const index = parseInt(e.target.closest('.delete-transaction').dataset.index);
            await deleteTransaction(index);
            return;
        }

        if (e.target.id === 'exportFirebase' || e.target.closest('#exportFirebase')) {
            exportFirebaseData();
            return;
        }

        if (e.target.id === 'switchChild' || e.target.closest('#switchChild')) {
            await saveChildStateToFirebase();
            switchChild();
            return;
        }

        if (e.target.id === 'addIncome' || e.target.closest('#addIncome')) {
            showTransactionModal('in');
            return;
        }

        if (e.target.id === 'addExpense' || e.target.closest('#addExpense')) {
            showTransactionModal('out');
            return;
        }

        if (e.target.id === 'manualSync' || e.target.closest('#manualSync')) {
            await performManualSync();
            return;
        }

        if (e.target.id === 'forceRefresh' || e.target.closest('#forceRefresh')) {
            await performForceRefresh();
            return;
        }

        if (e.target.id === 'clearCache' || e.target.closest('#clearCache')) {
            await performClearCache();
            return;
        }

    });

    async function editTransaction(index) {
        const transaction = state.transactions[index];
        if (!transaction) return;
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
                <div class="text-center mb-6">
                    <div class="text-4xl mb-2">✏️</div>
                    <h2 class="text-xl font-bold text-gray-800">Editar Transação</h2>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <select id="editTransType" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="in" ${transaction.type === 'in' ? 'selected' : ''}>💰 Entrada</option>
                            <option value="out" ${transaction.type === 'out' ? 'selected' : ''}>💸 Saída</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                        <input id="editTransValue" type="number" step="0.01" value="${transaction.value}" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-center" placeholder="0,00" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <input id="editTransDesc" value="${transaction.desc}" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ex: Mesada, brinquedo..." maxlength="30" />
                    </div>
                </div>
                <div class="flex gap-3 mt-6">
                    <button id="saveEditTransaction" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-bold text-lg shadow-md transition-colors">
                        ✅ Salvar
                    </button>
                    <button id="cancelEditTransaction" class="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-bold transition-colors">
                        ❌ Cancelar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const valueInput = modal.querySelector('#editTransValue');
        valueInput.focus();
        valueInput.select();

        modal.addEventListener('click', async function(e) {
            if (e.target.id === 'saveEditTransaction') {
                const newType = modal.querySelector('#editTransType').value;
                const newValue = parseFloat(modal.querySelector('#editTransValue').value);
                const newDesc = modal.querySelector('#editTransDesc').value.trim();

                if (!newValue || newValue <= 0) {
                    alert('❌ Digite um valor válido!');
                    return;
                }
                if (!newDesc) {
                    alert('❌ Digite uma descrição!');
                    return;
                }

                const oldValue = transaction.type === 'in' ? transaction.value : -transaction.value;
                state.balance -= oldValue;

                const newValueEffect = newType === 'in' ? newValue : -newValue;
                state.balance += newValueEffect;

                state.transactions[index] = {
                    type: newType,
                    value: newValue,
                    desc: newDesc,
                    date: transaction.date // Manter data original
                };

                await saveChildStateToFirebase();
                render();
                modal.remove();
            }
            
            if (e.target.id === 'cancelEditTransaction' || e.target === modal) {
                modal.remove();
            }
        });

        modal.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                modal.querySelector('#saveEditTransaction').click();
            }
            if (e.key === 'Escape') {
                modal.remove();
            }
        });
    }

    async function deleteTransaction(index) {
        const transaction = state.transactions[index];
        if (!transaction) return;
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
                <div class="text-center mb-6">
                    <div class="text-4xl mb-2">🗑️</div>
                    <h2 class="text-xl font-bold text-red-600 mb-2">Deletar Transação</h2>
                    <p class="text-gray-600 text-sm">Esta ação não pode ser desfeita!</p>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg mb-6">
                    <div class="flex justify-between items-center">
                        <div>
                            <div class="font-medium">${transaction.desc}</div>
                            <div class="text-sm text-gray-500">${new Date(transaction.date).toLocaleDateString('pt-BR')}</div>
                        </div>
                        <span class="${transaction.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} px-2 py-1 rounded font-bold text-sm">
                            ${transaction.type === 'in' ? '+' : '-'}${formatMoney(transaction.value)}
                        </span>
                    </div>
                </div>
                <div class="flex gap-3">
                    <button id="cancelDeleteTransaction" class="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-bold transition-colors">
                        ❌ Cancelar
                    </button>
                    <button id="confirmDeleteTransaction" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-bold transition-colors">
                        🗑️ Deletar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', async function(e) {
            if (e.target.id === 'confirmDeleteTransaction') {
                const valueEffect = transaction.type === 'in' ? transaction.value : -transaction.value;
                state.balance -= valueEffect;

                state.transactions.splice(index, 1);

                await saveChildStateToFirebase();
                render();
                modal.remove();
            }
            
            if (e.target.id === 'cancelDeleteTransaction' || e.target === modal) {
                modal.remove();
            }
        });

        modal.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                modal.remove();
            }
        });
    }

    function showTransactionModal(type) {
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
                <div class="text-center mb-6">
                    <div class="text-4xl mb-2">${type === 'in' ? '💰' : '💸'}</div>
                    <h2 class="text-xl font-bold text-gray-800">
                        ${type === 'in' ? 'Adicionar Entrada' : 'Registrar Saída'}
                    </h2>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                        <input id="transValue" type="number" step="0.01" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-center" placeholder="0,00" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <input id="transDesc" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ex: Mesada, brinquedo..." maxlength="30" />
                    </div>
                </div>
                <div class="flex gap-3 mt-6">
                    <button id="saveTransaction" class="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-bold text-lg shadow-md transition-colors">
                        ✅ Salvar
                    </button>
                    <button id="cancelTransaction" class="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-bold transition-colors">
                        ❌ Cancelar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const valueInput = modal.querySelector('#transValue');
        valueInput.focus();
        valueInput.select();

        modal.addEventListener('click', async function(e) {
            if (e.target.id === 'saveTransaction') {
                const value = parseFloat(modal.querySelector('#transValue').value);
                const desc = modal.querySelector('#transDesc').value.trim();

                if (!value || value <= 0) {
                    alert('❌ Digite um valor válido!');
                    return;
                }
                if (!desc) {
                    alert('❌ Digite uma descrição!');
                    return;
                }

                state.transactions.unshift({
                    type,
                    value,
                    desc,
                    date: Date.now()
                });

                state.balance += type === 'in' ? value : -value;
                await saveChildStateToFirebase();
                render();
                modal.remove();
            }
            
            if (e.target.id === 'cancelTransaction' || e.target === modal) {
                modal.remove();
            }
        });

        modal.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                modal.querySelector('#saveTransaction').click();
            }
            if (e.key === 'Escape') {
                modal.remove();
            }
        });
    }

    async function performManualSync() {
        const syncBtn = document.getElementById('manualSync');
        const originalIcon = syncBtn.innerHTML;
        
        try {
            syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            syncBtn.disabled = true;
            
            const syncedCount = await FirebaseDB.manualSync();
            
            await loadAndDisplayChild();
            
            syncBtn.innerHTML = '<i class="fas fa-check text-green-600"></i>';
            
            setTimeout(() => {
                syncBtn.innerHTML = originalIcon;
                syncBtn.disabled = false;
            }, 2000);
            
        } catch (error) {
            
            syncBtn.innerHTML = '<i class="fas fa-exclamation-triangle text-red-600"></i>';
            
            setTimeout(() => {
                syncBtn.innerHTML = originalIcon;
                syncBtn.disabled = false;
            }, 3000);
        }
    }

    async function performForceRefresh() {
        const refreshBtn = document.getElementById('forceRefresh');
        const originalIcon = refreshBtn.innerHTML;
        
        try {
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            refreshBtn.disabled = true;
            
            await FirebaseDB.forceRefreshFromFirebase();
            
            await loadAndDisplayChild();
            
            refreshBtn.innerHTML = '<i class="fas fa-check text-green-600"></i>';
            
            setTimeout(() => {
                refreshBtn.innerHTML = originalIcon;
                refreshBtn.disabled = false;
            }, 2000);
            
        } catch (error) {
            
            refreshBtn.innerHTML = '<i class="fas fa-exclamation-triangle text-red-600"></i>';
            
            setTimeout(() => {
                refreshBtn.innerHTML = originalIcon;
                refreshBtn.disabled = false;
            }, 3000);
        }
    }

    async function performClearCache() {
        const clearBtn = document.getElementById('clearCache');
        const originalIcon = clearBtn.innerHTML;
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
                <div class="text-center mb-6">
                    <div class="text-4xl mb-2">🗑️</div>
                    <h2 class="text-xl font-bold text-gray-800 mb-2">Limpar Cache Completo</h2>
                    <p class="text-gray-600 text-sm">Esta ação vai:</p>
                </div>
                <div class="space-y-2 mb-6 text-sm">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-check text-green-500"></i>
                        <span>Limpar cache do Service Worker</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i class="fas fa-check text-green-500"></i>
                        <span>Limpar dados locais</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i class="fas fa-check text-green-500"></i>
                        <span>Forçar recarregamento da página</span>
                    </div>
                    <div class="bg-yellow-50 p-3 rounded-lg mt-4">
                        <div class="flex items-center gap-2 text-yellow-700">
                            <i class="fas fa-exclamation-triangle"></i>
                            <span class="text-xs font-medium">Dados não sincronizados serão perdidos!</span>
                        </div>
                    </div>
                </div>
                <div class="flex gap-3">
                    <button id="cancelClear" class="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-bold transition-colors">
                        ❌ Cancelar
                    </button>
                    <button id="confirmClear" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-bold transition-colors">
                        🗑️ Limpar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const cancelBtn = modal.querySelector('#cancelClear');
        const confirmBtn = modal.querySelector('#confirmClear');
        
        return new Promise((resolve) => {
            cancelBtn.addEventListener('click', () => {
                modal.remove();
                resolve(false);
            });
            
            confirmBtn.addEventListener('click', async () => {
                modal.remove();
                resolve(true);
                
                try {
                    clearBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    clearBtn.disabled = true;
                    
                    
                    if ('caches' in window) {
                        const cacheNames = await caches.keys();
                        await Promise.all(
                            cacheNames.map(cacheName => {
                                return caches.delete(cacheName);
                            })
                        );
                    }
                    
                    const removedKeys = FirebaseDB.clearAllLocalData();
                    
                    if ('serviceWorker' in navigator) {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        for (let registration of registrations) {
                            await registration.unregister();
                        }
                    }
                    
                    clearBtn.innerHTML = '<i class="fas fa-check text-green-600"></i>';
                    
                    setTimeout(() => {
                        const successModal = document.createElement('div');
                        successModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
                        successModal.innerHTML = `
                            <div class="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl text-center">
                                <div class="text-4xl mb-2">✅</div>
                                <h2 class="text-xl font-bold text-green-600 mb-2">Cache Limpo!</h2>
                                <p class="text-gray-600 mb-4">A página será recarregada agora</p>
                                <div class="text-2xl">
                                    <i class="fas fa-spinner fa-spin text-blue-500"></i>
                                </div>
                            </div>
                        `;
                        document.body.appendChild(successModal);
                        
                        setTimeout(() => {
                            window.location.reload(true); // Hard reload
                        }, 1500);
                    }, 1000);
                    
                } catch (error) {
                    
                    clearBtn.innerHTML = '<i class="fas fa-exclamation-triangle text-red-600"></i>';
                    
                    const errorModal = document.createElement('div');
                    errorModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
                    errorModal.innerHTML = `
                        <div class="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl text-center">
                            <div class="text-4xl mb-2">❌</div>
                            <h2 class="text-xl font-bold text-red-600 mb-2">Erro!</h2>
                            <p class="text-gray-600 mb-4">${error.message}</p>
                            <button class="bg-gray-500 text-white px-4 py-2 rounded" onclick="this.parentElement.parentElement.remove()">
                                OK
                            </button>
                        </div>
                    `;
                    document.body.appendChild(errorModal);
                    
                    setTimeout(() => {
                        clearBtn.innerHTML = originalIcon;
                        clearBtn.disabled = false;
                    }, 3000);
                }
            });
        });
    }

    function detectPlatform() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        const isAndroid = /Android/.test(navigator.userAgent);
        
        return { isIOS, isAndroid, isInStandaloneMode };
    }

    function showIOSInstallPrompt() {
        const { isIOS, isInStandaloneMode } = detectPlatform();
        
        if (!isIOS || isInStandaloneMode) return;
        
        const lastShown = localStorage.getItem('ios-install-prompt-shown');
        const today = new Date().toDateString();
        if (lastShown === today) return;
        
        setTimeout(() => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
            modal.innerHTML = `
                <div class="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
                    <div class="text-center mb-4">
                        <div class="text-4xl mb-2">📱</div>
                        <h2 class="text-xl font-bold text-gray-800 mb-2">Instalar FinancesKids</h2>
                        <p class="text-gray-600 text-sm">Para uma melhor experiência, instale o app na sua tela inicial!</p>
                    </div>
                    <div class="space-y-3 mb-6 text-sm">
                        <div class="flex items-start gap-3">
                            <div class="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
                            <div>Toque no botão <strong>Compartilhar</strong> 
                                <i class="fas fa-share ml-1 text-blue-500"></i>
                            </div>
                        </div>
                        <div class="flex items-start gap-3">
                            <div class="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
                            <div>Selecione <strong>"Adicionar à Tela de Início"</strong></div>
                        </div>
                        <div class="flex items-start gap-3">
                            <div class="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</div>
                            <div>Confirme tocando em <strong>"Adicionar"</strong></div>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <button id="skipIOSInstall" class="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-bold transition-colors">
                            Pular
                        </button>
                        <button id="okIOSInstall" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-bold transition-colors">
                            Entendi!
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            modal.querySelector('#skipIOSInstall').addEventListener('click', () => {
                localStorage.setItem('ios-install-prompt-shown', today);
                modal.remove();
            });
            
            modal.querySelector('#okIOSInstall').addEventListener('click', () => {
                localStorage.setItem('ios-install-prompt-shown', today);
                modal.remove();
            });
            
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    localStorage.setItem('ios-install-prompt-shown', today);
                    modal.remove();
                }
            }, 15000);
            
        }, 3000); // Mostrar após 3 segundos
    }

    window.onSyncComplete = function(syncedCount, failedCount) {
        if (syncedCount > 0) {
            
            const notification = document.createElement('div');
            notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
            notification.innerHTML = `✅ ${syncedCount} item(s) sincronizado(s)`;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
    };

    await loadAllChildren();
    render();
    
    showIOSInstallPrompt();
    
});
