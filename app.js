// Data State Aplikasi
let produkList = JSON.parse(localStorage.getItem('pos_produk')) || [
    { id: 1, nama: 'Roti Bakar Cokelat', harga: 8000, stok: 10 },
    { id: 2, nama: 'Teh Manis Dingin', harga: 3000, stok: 4 },
    { id: 3, nama: 'Keripik Pedas', harga: 5000, stok: 0 }
];

let keranjang = [];
let rekapTransaksi = JSON.parse(localStorage.getItem('pos_transaksi')) || { omzet: 0, totalTx: 0 };

// Elemen DOM
const formProduk = document.getElementById('form-produk');
const containerProduk = document.getElementById('daftar-produk');
const tabelKeranjang = document.getElementById('tabel-keranjang');
const totalTagihanEl = document.getElementById('total-tagihan');
const uangDiterimaEl = document.getElementById('uang-diterima');
const uangKembalianEl = document.getElementById('uang-kembalian');
const btnBayar = document.getElementById('btn-bayar');
const pesanError = document.getElementById('pesan-error');

// Inisialisasi Tampilan
document.addEventListener('DOMContentLoaded', () => {
    renderProduk();
    renderKeranjang();
    updateMetrics();
});

// Fungsi Menyimpan ke LocalStorage
function simpanKeStorage() {
    localStorage.setItem('pos_produk', JSON.stringify(produkList));
    localStorage.setItem('pos_transaksi', JSON.stringify(rekapTransaksi));
}

// Tambah Produk Baru
formProduk.addEventListener('submit', (e) => {
    e.preventDefault();
    const nama = document.getElementById('nama-produk').value;
    const harga = parseInt(document.getElementById('harga-produk').value);
    const stok = parseInt(document.getElementById('stok-produk').value);

    const produkBaru = { id: Date.now(), nama, harga, stok };
    produkList.push(produkBaru);
    
    simpanKeStorage();
    renderProduk();
    updateMetrics();
    formProduk.reset();
});

// Render Katalog Produk dengan Dynamic Badge Alert & Validasi Stok
function renderProduk() {
    containerProduk.innerHTML = '';
    produkList.forEach(item => {
        // Logika Badge Stok
        let badgeClass = 'bg-success';
        let badgeText = 'Stok Aman';
        let isDisabled = '';

        if (item.stok === 0) {
            badgeClass = 'bg-danger';
            badgeText = 'Stok Habis';
            isDisabled = 'disabled';
        } else if (item.stok < 5) {
            badgeClass = 'bg-warning text-dark';
            badgeText = `Sisa <5 (${item.stok})`;
        } else {
            badgeText = `Stok: ${item.stok}`;
        }

        const col = document.createElement('div');
        col.className = 'col-md-4 col-6';
        col.innerHTML = `
            <div class="card h-100 border-0 shadow-sm text-center">
                <div class="card-body d-flex flex-column justify-content-between p-3">
                    <div>
                        <span class="badge ${badgeClass} mb-2">${badgeText}</span>
                        <h6 class="fw-bold mb-1">${item.nama}</h6>
                        <p class="text-primary fw-semibold mb-3">Rp ${item.harga.toLocaleString('id-ID')}</p>
                    </div>
                    <button class="btn btn-outline-primary btn-sm w-100" 
                            onclick="tambahKeKeranjang(${item.id})" ${isDisabled}>
                        <i class="fas fa-cart-plus me-1"></i> Beli
                    </button>
                </div>
            </div>
        `;
        containerProduk.appendChild(col);
    });
}

// Update Metric Cards
function updateMetrics() {
    const totalStok = produkList.reduce((acc, item) => acc + item.stok, 0);
    document.getElementById('total-omzet').innerText = `Rp ${rekapTransaksi.omzet.toLocaleString('id-ID')}`;
    document.getElementById('total-stok').innerText = `${totalStok} Item`;
    document.getElementById('total-transaksi').innerText = rekapTransaksi.totalTx;
}
// Tambah Barang ke Keranjang
function tambahKeKeranjang(idProduk) {
    const produk = produkList.find(p => p.id === idProduk);
    if (!produk || produk.stok <= 0) return;

    const itemKeranjang = keranjang.find(k => k.id === idProduk);
    if (itemKeranjang) {
        if (itemKeranjang.qty < produk.stok) {
            itemKeranjang.qty++;
        } else {
            alert('Jumlah melebihi stok yang tersedia!');
        }
    } else {
        keranjang.push({ ...produk, qty: 1 });
    }
    renderKeranjang();
}

// Render Tabel Keranjang & Hitung Total
function renderKeranjang() {
    tabelKeranjang.innerHTML = '';
    let total = 0;

    keranjang.forEach(item => {
        const subtotal = item.harga * item.qty;
        total += subtotal;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="small fw-semibold">${item.nama}</td>
            <td class="small">Rp ${item.harga.toLocaleString('id-ID')}</td>
            <td>
                <input type="number" class="form-control form-control-sm" value="${item.qty}" 
                       min="1" max="${item.stok}" onchange="ubahQty(${item.id}, this.value)">
            </td>
            <td class="small fw-bold">Rp ${subtotal.toLocaleString('id-ID')}</td>
            <td>
                <button class="btn btn-sm btn-link text-danger p-0" onclick="hapusKeranjang(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tabelKeranjang.appendChild(tr);
    });

    totalTagihanEl.innerText = `Rp ${total.toLocaleString('id-ID')}`;
    totalTagihanEl.dataset.total = total;
    hitungkembalian();
}

// Ubah Kuantitas di Keranjang
function ubahQty(id, val) {
    const qty = parseInt(val);
    const item = keranjang.find(k => k.id === id);
    const produk = produkList.find(p => p.id === id);

    if (item && qty > 0 && qty <= produk.stok) {
        item.qty = qty;
    } else {
        alert('Kuantitas tidak valid atau melebihi stok!');
    }
    renderKeranjang();
}

// Hapus Item Keranjang
function hapusKeranjang(id) {
    keranjang = keranjang.filter(k => k.id !== id);
    renderKeranjang();
}

// Logika Kalkulator Kembalian & Validasi Pembayaran
uangDiterimaEl.addEventListener('input', hitungkembalian);

function hitungkembalian() {
    const total = parseInt(totalTagihanEl.dataset.total) || 0;
    const bayar = parseInt(uangDiterimaEl.value) || 0;
    const kembalian = bayar - total;

    if (total > 0 && bayar >= total) {
        uangKembalianEl.innerText = `Rp ${kembalian.toLocaleString('id-ID')}`;
        pesanError.classList.add('d-none');
        btnBayar.disabled = false;
    } else {
        uangKembalianEl.innerText = 'Rp 0';
        btnBayar.disabled = true;
        if (bayar > 0 && bayar < total) {
            pesanError.classList.remove('d-none');
        } else {
            pesanError.classList.add('d-none');
        }
    }
}

// Proses Transaksi & Cetak Nota Digital
btnBayar.addEventListener('click', () => {
    const total = parseInt(totalTagihanEl.dataset.total) || 0;
    const bayar = parseInt(uangDiterimaEl.value) || 0;
    const kembalian = bayar - total;

    // 1. Kurangi Stok Produk
    keranjang.forEach(itemK => {
        const p = produkList.find(p => p.id === itemK.id);
        if (p) p.stok -= itemK.qty;
    });

    // 2. Perbarui Rekap Transaksi
    rekapTransaksi.omzet += total;
    rekapTransaksi.totalTx += 1;

    simpanKeStorage();

    // 3. Persiapan Cetak Struk
    const receiptItems = document.getElementById('receipt-items');
    receiptItems.innerHTML = keranjang.map(i => `
        <div class="d-flex justify-content-between small">
            <span>${i.nama} x${i.qty}</span>
            <span>Rp ${(i.harga * i.qty).toLocaleString('id-ID')}</span>
        </div>
    `).join('');

    document.getElementById('receipt-total').innerText = `Rp ${total.toLocaleString('id-ID')}`;
    document.getElementById('receipt-bayar').innerText = `Rp ${bayar.toLocaleString('id-ID')}`;
    document.getElementById('receipt-kembali').innerText = `Rp ${kembalian.toLocaleString('id-ID')}`;

    // 4. Panggil Fitur Cetak Native Browser
    document.getElementById('receipt-print').classList.remove('d-none');
    window.print();
    document.getElementById('receipt-print').classList.add('d-none');

    // 5. Reset Keranjang & Tampilan
    keranjang = [];
    uangDiterimaEl.value = '';
    renderProduk();
    renderKeranjang();
    updateMetrics();
});
