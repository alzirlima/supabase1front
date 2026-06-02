// URL base do back-end API.
// IMPORTANTE: Altere este valor para o IP público da sua VM (AWS/Oracle) quando fizer o deploy em produção.
// Exemplo: 'http://3.94.158.204:3000' ou o IP que sua VM receber.
const API_BASE_URL = 'https://98.84.175.104/';

// Elementos do DOM
const productList = document.querySelector('#products');
const productCount = document.querySelector('#product-count');
const addProductForm = document.querySelector('#add-product-form');

// Elementos do Modal de Edição
const updateModal = document.querySelector('#update-modal');
const updateProductForm = document.querySelector('#update-product-form');
const updateProductId = document.querySelector('#update-id');
const updateProductName = document.querySelector('#update-name');
const updateProductPrice = document.querySelector('#update-price');
const updateProductDescription = document.querySelector('#update-description');
const modalCloseBtn = document.querySelector('#modal-close-btn');
const modalCancelBtn = document.querySelector('#modal-cancel-btn');

// Elementos de Busca
const searchIdInput = document.querySelector('#search-id');
const searchBtn = document.querySelector('#search-btn');
const searchResultContainer = document.querySelector('#search-result-container');

// Elementos de Status
const loadingSpinner = document.querySelector('#loading-spinner');
const emptyState = document.querySelector('#empty-state');
const toastContainer = document.querySelector('#toast-container');

/**
 * Exibe um toast de notificação temporário
 * @param {string} message - Mensagem a ser exibida
 * @param {'success' | 'error' | 'info' | 'warning'} type - Tipo da notificação
 */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Icone de acordo com o tipo
  let icon = '';
  if (type === 'success') icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
  else if (type === 'error') icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
  else if (type === 'warning') icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
  else icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';

  toast.innerHTML = `${icon}<span>${message}</span>`;
  toastContainer.appendChild(toast);
  
  // Forçar reflow para ativar transição
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remover após 4 segundos
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Trata respostas de requisições de forma segura, aceitando JSON ou texto puro
 */
async function handleResponse(response) {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || 'Erro na requisição');
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    return text; // Retorna texto se não for JSON válido
  }
}

/**
 * Formata um número como moeda brasileira (Real)
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// ==========================================
// FUNÇÕES DE OPERAÇÃO COM PRODUTOS (CRUD & BUSCA)
// ==========================================

/**
 * Busca todos os produtos do servidor
 */
async function fetchProducts() {
  try {
    loadingSpinner.classList.remove('hidden');
    productList.innerHTML = '';
    
    const response = await fetch(`${API_BASE_URL}/products`);
    const products = await handleResponse(response);
    
    // Atualizar contador de produtos
    const count = Array.isArray(products) ? products.length : 0;
    productCount.textContent = `${count} ${count === 1 ? 'produto' : 'produtos'}`;
    
    if (count === 0) {
      emptyState.classList.remove('hidden');
      loadingSpinner.classList.add('hidden');
      return;
    }
    
    emptyState.classList.add('hidden');
    
    // Renderizar cada produto como card
    products.forEach(product => {
      const li = document.createElement('li');
      li.className = 'product-card';
      
      const descriptionText = product.description ? product.description : 'Sem descrição disponível.';
      
      li.innerHTML = `
        <div class="product-info">
          <div class="product-header-row">
            <h3 class="product-name">${product.name}</h3>
            <span class="product-price">${formatCurrency(product.price)}</span>
          </div>
          <p class="product-desc">${descriptionText}</p>
          <div class="product-id-badge" title="Clique para copiar o ID" onclick="navigator.clipboard.writeText('${product.id}'); showToast('ID copiado!', 'info');">
            ID: <span>${product.id}</span>
          </div>
        </div>
        <div class="product-actions">
          <button class="btn btn-edit" data-id="${product.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>
            Editar
          </button>
          <button class="btn btn-delete" data-id="${product.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            Excluir
          </button>
        </div>
      `;
      
      // Evento de Editar
      li.querySelector('.btn-edit').addEventListener('click', () => {
        openEditModal(product);
      });
      
      // Evento de Deletar
      li.querySelector('.btn-delete').addEventListener('click', async () => {
        if (confirm(`Tem certeza que deseja excluir o produto "${product.name}"?`)) {
          await deleteProduct(product.id);
        }
      });
      
      productList.appendChild(li);
    });
    
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    showToast('Falha ao conectar ao servidor. O back-end está ativo?', 'error');
  } finally {
    loadingSpinner.classList.add('hidden');
  }
}

/**
 * Adiciona um novo produto no servidor
 */
async function addProduct(name, price, description) {
  try {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, price, description })
    });
    
    await handleResponse(response);
    showToast('Produto cadastrado com sucesso!', 'success');
    return true;
  } catch (error) {
    console.error('Erro ao cadastrar produto:', error);
    showToast('Erro ao cadastrar produto.', 'error');
    return false;
  }
}

/**
 * Deleta um produto por ID
 */
async function deleteProduct(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    await handleResponse(response);
    showToast('Produto excluído com sucesso!', 'success');
    await fetchProducts();
    
    // Se o produto deletado estava na busca por ID, limpar busca
    const searchResultCard = document.querySelector('#search-result-card');
    if (searchResultCard && searchResultCard.dataset.id === id) {
      clearSearchResult();
    }
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    showToast('Erro ao deletar produto.', 'error');
  }
}

/**
 * Atualiza um produto existente
 */
async function updateProduct(id, name, price, description) {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, price, description })
    });
    
    await handleResponse(response);
    showToast('Produto atualizado com sucesso!', 'success');
    closeEditModal();
    await fetchProducts();
    
    // Se o produto editado estava na busca por ID, atualizar busca
    const searchResultCard = document.querySelector('#search-result-card');
    if (searchResultCard && searchResultCard.dataset.id === id) {
      searchProductById(id);
    }
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    showToast('Erro ao atualizar produto.', 'error');
  }
}

/**
 * Consulta um produto por ID
 */
async function searchProductById(id) {
  if (!id.trim()) {
    showToast('Por favor, informe o ID para buscar.', 'warning');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    const data = await handleResponse(response);
    
    // O back-end retorna um array de objetos [ { id, name, ... } ]
    if (Array.isArray(data) && data.length > 0) {
      const product = data[0];
      renderSearchResult(product);
      showToast('Produto localizado!', 'success');
    } else {
      renderSearchNotFound();
      showToast('Produto não encontrado.', 'warning');
    }
  } catch (error) {
    console.error('Erro ao buscar produto por ID:', error);
    showToast('Erro ao buscar produto. Verifique se o ID é válido.', 'error');
  }
}

// ==========================================
// RENDERIZAÇÃO DA BUSCA POR ID
// ==========================================

function renderSearchResult(product) {
  const descriptionText = product.description ? product.description : 'Sem descrição disponível.';
  
  searchResultContainer.innerHTML = `
    <div class="search-result-header">
      <span>Resultado da Busca</span>
      <button class="btn-clear-search" id="clear-search-btn">&times;</button>
    </div>
    <div class="product-card search-card-highlighted" id="search-result-card" data-id="${product.id}">
      <div class="product-info">
        <div class="product-header-row">
          <h3 class="product-name">${product.name}</h3>
          <span class="product-price">${formatCurrency(product.price)}</span>
        </div>
        <p class="product-desc">${descriptionText}</p>
        <div class="product-id-badge" title="Clique para copiar" onclick="navigator.clipboard.writeText('${product.id}'); showToast('ID copiado!', 'info');">
          ID: <span>${product.id}</span>
        </div>
      </div>
      <div class="product-actions">
        <button class="btn btn-edit" id="search-edit-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>
          Editar
        </button>
        <button class="btn btn-delete" id="search-delete-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          Excluir
        </button>
      </div>
    </div>
  `;
  
  // Associar eventos aos botões gerados
  document.querySelector('#clear-search-btn').addEventListener('click', clearSearchResult);
  document.querySelector('#search-edit-btn').addEventListener('click', () => openEditModal(product));
  document.querySelector('#search-delete-btn').addEventListener('click', async () => {
    if (confirm(`Tem certeza que deseja excluir o produto "${product.name}"?`)) {
      await deleteProduct(product.id);
    }
  });
  
  searchResultContainer.classList.remove('hidden');
}

function renderSearchNotFound() {
  searchResultContainer.innerHTML = `
    <div class="search-result-header">
      <span>Resultado da Busca</span>
      <button class="btn-clear-search" id="clear-search-btn">&times;</button>
    </div>
    <div class="search-not-found-card">
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      <p>Nenhum produto foi encontrado com o ID especificado.</p>
    </div>
  `;
  document.querySelector('#clear-search-btn').addEventListener('click', clearSearchResult);
  searchResultContainer.classList.remove('hidden');
}

function clearSearchResult() {
  searchResultContainer.innerHTML = '';
  searchResultContainer.classList.add('hidden');
  searchIdInput.value = '';
}

// ==========================================
// OPERAÇÕES DO MODAL DE EDIÇÃO
// ==========================================

function openEditModal(product) {
  updateProductId.value = product.id;
  updateProductName.value = product.name;
  updateProductPrice.value = product.price;
  updateProductDescription.value = product.description || '';
  
  updateModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // impede rolagem da página atrás do modal
}

function closeEditModal() {
  updateModal.classList.add('hidden');
  document.body.style.overflow = ''; // restaura rolagem
  updateProductForm.reset();
}

// ==========================================
// EVENT LISTENERS
// ==========================================

// Cadastrar Produto
addProductForm.addEventListener('submit', async event => {
  event.preventDefault();
  const name = addProductForm.elements['name'].value;
  const price = parseFloat(addProductForm.elements['price'].value);
  const description = addProductForm.elements['description'].value;
  
  const success = await addProduct(name, price, description);
  if (success) {
    addProductForm.reset();
    await fetchProducts();
  }
});

// Atualizar Produto (Modal)
updateProductForm.addEventListener('submit', async event => {
  event.preventDefault();
  const id = updateProductId.value;
  const name = updateProductName.value;
  const price = parseFloat(updateProductPrice.value);
  const description = updateProductDescription.value;
  
  await updateProduct(id, name, price, description);
});

// Fechar modal
modalCloseBtn.addEventListener('click', closeEditModal);
modalCancelBtn.addEventListener('click', closeEditModal);

// Fechar modal clicando no background escuro
updateModal.addEventListener('click', (event) => {
  if (event.target === updateModal) {
    closeEditModal();
  }
});

// Busca por ID
searchBtn.addEventListener('click', () => {
  const id = searchIdInput.value;
  searchProductById(id);
});

searchIdInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    const id = searchIdInput.value;
    searchProductById(id);
  }
});
