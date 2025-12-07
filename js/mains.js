const API_URL = 'https://status.fadzdigital.store';
let allProducts = [];
let filteredProducts = [];
let currentStatusFilter = 'all';
let currentPage = 1;
const PAGE_SIZE = 50;

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const mainContent = document.getElementById('mainContent');
    
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        mainContent.classList.add('visible');
    }, 1500);
}

function isOpenStatus(status) {
    const s = String(status || '').toLowerCase();
    return s === 'open';
}

function isGangguanStatus(status) {
    const s = String(status || '').toLowerCase();
    return s === 'closed' || s === 'gangguan' || s === 'down';
}

function formatRupiah(angka) {
    if (angka == null) return 'Rp 0';

    const cleaned = String(angka).replace(/[^0-9]/g, '');
    const number = cleaned === '' ? 0 : parseInt(cleaned, 10);

    return 'Rp ' + number.toLocaleString('id-ID');
}

function renderPagination() {
    const pagination = document.getElementById('pagination');

    if (!filteredProducts.length) {
        pagination.innerHTML = '';
        return;
    }

    const totalItems = filteredProducts.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage * PAGE_SIZE, totalItems);

    pagination.innerHTML = `
        <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
            <span>Sebelumnya</span>
        </button>
        <span class="page-info">
            Halaman ${currentPage} dari ${totalPages} • ${start}–${end} dari ${totalItems} produk
        </span>
        <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            <span>Berikutnya</span>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
}

function changePage(page) {
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
    const target = Math.min(Math.max(page, 1), totalPages);
    if (target === currentPage) return;
    currentPage = target;
    renderTable();
    renderPagination();
}

async function loadAllProducts() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="loading-cell">
                <div class="data-loader">
                    <div class="text"><span>Loading</span></div>
                    <div class="text"><span>Loading</span></div>
                    <div class="text"><span>Loading</span></div>
                    <div class="text"><span>Loading</span></div>
                    <div class="text"><span>Loading</span></div>
                    <div class="text"><span>Loading</span></div>
                    <div class="text"><span>Loading</span></div>
                    <div class="text"><span>Loading</span></div>
                    <div class="text"><span>Loading</span></div>
                    <div class="line"></div>
                </div>
            </td>
        </tr>
    `;
    document.getElementById('pagination').innerHTML = '';

    try {
        const response = await fetch(API_URL);
        const result = await response.json();
        
        if (result.ok && result.data) {
            allProducts = result.data;
            filteredProducts = [...allProducts];
            currentPage = 1;
            renderTable();
            renderPagination();
            updateStats();
            hideLoadingScreen();
        } else {
            showError('Gagal memuat data produk.');
            hideLoadingScreen();
        }
    } catch (error) {
        showError('Error: ' + error.message);
        hideLoadingScreen();
    }
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    
    if (!filteredProducts.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty">
                    <i class="fas fa-search"></i>
                    <span>Tidak ada produk ditemukan</span>
                </td>
            </tr>
        `;
        return;
    }

    const totalItems = filteredProducts.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
    const pageItems = filteredProducts.slice(startIndex, endIndex);

    tbody.innerHTML = pageItems.map((product, index) => {
        const rawStatus = product.status;
        const isOpen = isOpenStatus(rawStatus);
        const displayStatus = isOpen ? 'Open' : 'Gangguan';
        const badgeClass = isOpen ? 'status-open' : 'status-gangguan';
        const iconClass = isOpen ? 'fa-circle-check' : 'fa-triangle-exclamation';

        return `
        <tr>
            <td>${startIndex + index + 1}</td>
            <td class="code-cell">${product.code}</td>
            <td>${product.keterangan}</td>
            <td class="price-cell">${formatRupiah(product.harga)}</td>
            <td>
                <span class="status-badge ${badgeClass}">
                    <i class="fas ${iconClass}"></i>
                    ${displayStatus}
                </span>
            </td>
        </tr>
        `;
    }).join('');
}

function updateStats() {
    const total = allProducts.length;
    const open = allProducts.filter(p => isOpenStatus(p.status)).length;
    const gangguan = allProducts.filter(p => isGangguanStatus(p.status)).length;

    document.getElementById('stats').innerHTML = `
        <div class="stat-card">
            <h3>${total}</h3>
            <p><i class="fas fa-boxes-stacked"></i> Total Produk</p>
        </div>
        <div class="stat-card">
            <h3>${open}</h3>
            <p><i class="fas fa-circle-check"></i> Produk Open</p>
        </div>
        <div class="stat-card">
            <h3>${gangguan}</h3>
            <p><i class="fas fa-triangle-exclamation"></i> Produk Gangguan</p>
        </div>
    `;
}

function showError(message) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="5">
                <div class="error">
                    <i class="fas fa-triangle-exclamation"></i>
                    <span>${message}</span>
                </div>
            </td>
        </tr>
    `;
    document.getElementById('pagination').innerHTML = '';
}

function searchProducts(query) {
    const lowerQuery = query.toLowerCase().trim();

    let products = [...allProducts];

    if (currentStatusFilter === 'Open') {
        products = products.filter(p => isOpenStatus(p.status));
    } else if (currentStatusFilter === 'Gangguan') {
        products = products.filter(p => isGangguanStatus(p.status));
    }

    if (lowerQuery !== '') {
        products = products.filter(p =>
            String(p.keterangan || '').toLowerCase().includes(lowerQuery)
        );
    }

    filteredProducts = products;
    currentPage = 1;
    renderTable();
    renderPagination();
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = '';
    currentStatusFilter = 'all';
    filteredProducts = [...allProducts];
    currentPage = 1;

    document.querySelectorAll('.chip').forEach(chip => {
        chip.classList.remove('active');
        if (chip.dataset.status === 'all') {
            chip.classList.add('active');
        }
    });
    
    renderTable();
    renderPagination();
}

const searchInput = document.getElementById('searchInput');
let searchTimeout;

searchInput.addEventListener('input', (e) => {
    const value = e.target.value;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchProducts(value);
    }, 250);
});

document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
});

document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        
        currentStatusFilter = e.target.dataset.status;
        searchProducts(searchInput.value);
    });
});

loadAllProducts();
