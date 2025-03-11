// script.js - Lista de Compras Inteligente

/* ========== IMPORTAÇÕES E CONFIGURAÇÕES INICIAIS ========== */
// Importação da biblioteca jsPDF (garantir que está carregada no HTML)
const { jsPDF } = window.jspdf;

/* ========== VARIÁVEIS GLOBAIS ========== */
let items = [];          // Armazena os itens da lista
let budget = 0;          // Armazena o orçamento definido
let editingId = null;    // Controla o ID do item em edição

/* ========== INICIALIZAÇÃO DA APLICAÇÃO ========== */
// Carrega quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initializeApp);

// Função principal de inicialização
function initializeApp() {
    loadFromLocalStorage();  // Carrega dados salvos
    setupEventListeners();   // Configura ouvintes de evento
    updateUI();              // Atualiza a interface
}

/* ========== GERENCIAMENTO DE DADOS ========== */
// Carrega dados do localStorage
function loadFromLocalStorage() {
    try {
        // Recupera dados do localStorage
        const savedItems = localStorage.getItem('shoppingList');
        const savedBudget = localStorage.getItem('budget');
        
        // Parse dos dados com validação
        items = savedItems ? JSON.parse(savedItems) : [];
        budget = savedBudget ? parseFloat(savedBudget) : 0;
        
        // Filtra itens inválidos/corrompidos
        items = items.filter(item => 
            item.id && 
            item.product && 
            typeof item.price === 'number' && 
            typeof item.quantity === 'number'
        );
        
    } catch (error) {
        handleDataError('Erro ao carregar dados:', error);
    }
}

// Salva dados no localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem('shoppingList', JSON.stringify(items));
        localStorage.setItem('budget', budget.toString());
    } catch (error) {
        handleDataError('Erro ao salvar dados:', error);
    }
}

/* ========== CONFIGURAÇÃO DE INTERFACE ========== */
// Configura ouvintes de evento
function setupEventListeners() {
    // Atualiza orçamento ao mudar o campo
    document.getElementById('budget').addEventListener('change', setBudget);
    
    // Adiciona item ao pressionar Enter
    document.getElementById('quantity').addEventListener('keypress', e => {
        if (e.key === 'Enter') addItem();
    });
}

// Atualiza toda a interface
function updateUI() {
    updateTable();
    updateBudgetDisplay();
    document.getElementById('budget').value = budget || '';
}

/* ========== FUNÇÕES PRINCIPAIS ========== */
// Adiciona/Edita item na lista
function addItem() {
    // Obtém valores dos campos
    const product = document.getElementById('product').value.trim();
    const price = parseFloat(document.getElementById('price').value);
    const quantity = parseInt(document.getElementById('quantity').value);

    // Validação dos campos
    if (!validateInputs(product, price, quantity)) return;

    if (editingId !== null) {
        editExistingItem(product, price, quantity);
    } else {
        addNewItem(product, price, quantity);
    }

    updateUI();
    clearInputs();
    saveToLocalStorage();
}

// Define o orçamento
function setBudget() {
    const newBudget = parseFloat(document.getElementById('budget').value) || 0;
    budget = newBudget;
    saveToLocalStorage();
    showToast('Orçamento atualizado!', '#3498db');
    updateBudgetDisplay();
}

// Remove item da lista
function deleteItem(id) {
    items = items.filter(item => item.id !== id);
    updateUI();
    saveToLocalStorage();
    showToast('Item removido!', '#3498db');
}

/* ========== FUNÇÕES DE APOIO ========== */
// Valida campos do formulário
function validateInputs(product, price, quantity) {
    if (!product || price <= 0 || quantity <= 0) {
        showToast('Preencha todos os campos corretamente!', '#e74c3c');
        return false;
    }
    return true;
}

// Edita item existente
function editExistingItem(product, price, quantity) {
    const index = items.findIndex(item => item.id === editingId);
    items[index] = { ...items[index], product, price, quantity };
    showToast('Item atualizado!', '#2ecc71');
    editingId = null;
}

// Adiciona novo item
function addNewItem(product, price, quantity) {
    items.push({
        id: Date.now(), // ID único baseado no timestamp
        product,
        price,
        quantity
    });
    showToast('Item adicionado!', '#2ecc71');
}

// Atualiza a tabela de itens
function updateTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        tbody.innerHTML += `
            <tr>
                <td>${item.product}</td>
                <td>R$ ${item.price.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>R$ ${itemTotal.toFixed(2)}</td>
                <td class="actions">
                    <button onclick="editItem(${item.id})">✏️ Editar</button>
                    <button onclick="deleteItem(${item.id})">🗑️ Excluir</button>
                </td>
            </tr>
        `;
    });
    
    document.getElementById('totalAmount').textContent = 
        `R$ ${calculateTotal().toFixed(2)}`;
}

// Atualiza exibição do orçamento
function updateBudgetDisplay() {
    document.getElementById('budgetAmount').textContent = 
        budget > 0 ? `R$ ${budget.toFixed(2)}` : '-';
    
    const total = calculateTotal();
    const balance = budget - total;
    
    document.getElementById('balanceAmount').innerHTML = budget > 0 
        ? `<span class="${balance >= 0 ? 'positive' : 'negative'}">R$ ${balance.toFixed(2)}</span>`
        : '-';
}

/* ========== FUNÇÕES UTILITÁRIAS ========== */
// Calcula total geral
function calculateTotal() {
    return items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
}

// Limpa campos do formulário
function clearInputs() {
    document.getElementById('product').value = '';
    document.getElementById('price').value = '';
    document.getElementById('quantity').value = '';
    document.querySelector('button[onclick="addItem()"]').textContent = '➕ Adicionar';
}

// Preenche formulário para edição
function editItem(id) {
    const item = items.find(item => item.id === id);
    if (item) {
        document.getElementById('product').value = item.product;
        document.getElementById('price').value = item.price;
        document.getElementById('quantity').value = item.quantity;
        editingId = id;
        document.querySelector('button[onclick="addItem()"]').textContent = '🔄 Atualizar';
    }
}

// Exibe notificações
function showToast(message, color = '#2ecc71') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.backgroundColor = color;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}

// Manipula erros de dados
function handleDataError(message, error) {
    console.error(message, error);
    showToast('Erro no armazenamento local!', '#e74c3c');
    // Reseta dados corrompidos
    items = [];
    budget = 0;
    saveToLocalStorage();
}

/* ========== EXPORTAÇÃO PARA PDF ========== */
function exportPDF() {
    try {
        const doc = new jsPDF();
        
        // Cabeçalho
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("Lista de Compras - Relatório", 14, 20);
        
        // Dados da tabela
        const headers = [["Produto", "Preço", "Qtd", "Total"]];
        const data = items.map(item => [
            item.product,
            `R$ ${item.price.toFixed(2)}`,
            item.quantity.toString(),
            `R$ ${(item.price * item.quantity).toFixed(2)}`
        ]);

        // Gera tabela
        doc.autoTable({
            startY: 30,
            head: headers,
            body: data,
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: { 
                fillColor: [52, 152, 219],
                textColor: 255,
                fontStyle: 'bold'
            }
        });

        // Informações finais
        const totalY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(12);
        doc.text(`Total Geral: R$ ${calculateTotal().toFixed(2)}`, 14, totalY);
        
        if (budget > 0) {
            const difference = budget - calculateTotal();
            doc.text(`Orçamento: R$ ${budget.toFixed(2)} | Saldo: R$ ${difference.toFixed(2)}`, 
                    14, totalY + 10);
        }

        // Salva arquivo
        doc.save('lista_compras.pdf');
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        showToast('Erro na exportação!', '#e74c3c');
    }
}