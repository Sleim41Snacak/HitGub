const Ekle = document.getElementById('Ekle');
const Kaydet = document.getElementById('Kaydet');
const konuInput = document.getElementById('konuInput');
const textarea = document.getElementById('textarea');
const codeList = document.getElementById('codeList');
const usernameDisplay = document.getElementById('usernameDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const loginMessage = document.getElementById('loginMessage');
const mainContent = document.getElementById('mainContent');

let currentUser = null;

// Sayfa yüklendiğinde kullanıcı durumunu kontrol et
window.onload = async () => {
  await checkAuthStatus();
  if (currentUser) {
    await loadCodes();
  }
};

// Kullanıcı kimlik doğrulama durumunu kontrol et
async function checkAuthStatus() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  
  if (token && username) {
    try {
      // Token'ı doğrula
      const response = await fetch('/api/codes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        currentUser = username;
        showMainContent();
        usernameDisplay.textContent = `Hoş geldin, ${username}!`;
      } else {
        // Token geçersiz, localStorage'ı temizle
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        showLoginMessage();
      }
    } catch (error) {
      console.error('Kimlik doğrulama hatası:', error);
      showLoginMessage();
    }
  } else {
    showLoginMessage();
  }
}

// Ana içeriği göster
function showMainContent() {
  loginMessage.style.display = 'none';
  mainContent.style.display = 'block';
}

// Giriş mesajını göster
function showLoginMessage() {
  mainContent.style.display = 'none';
  loginMessage.style.display = 'block';
}

// Çıkış yap
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  currentUser = null;
  showLoginMessage();
  codeList.innerHTML = '';
});

// Kod ekleme butonuna tıklama
Ekle.addEventListener('click', () => {
  const isHidden = konuInput.style.display === 'none';
  konuInput.style.display = isHidden ? 'inline-block' : 'none';
  textarea.style.display = isHidden ? 'block' : 'none';
  Kaydet.style.display = isHidden ? 'inline-block' : 'none';
});

// Kod kaydetme
Kaydet.addEventListener('click', async () => {
  const konu = konuInput.value.trim();
  const kod = textarea.value;

  if (!konu || !kod) {
    alert("Başlık ve kod alanları boş bırakılamaz!");
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/codes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title: konu, code: kod })
    });

    if (response.ok) {
      const newCode = await response.json();
      // Yeni eklenen kod için isOwner = true (kullanıcının kendi kodu)
      createCodeBox(newCode.title, newCode.code, newCode.username, newCode._id, true);
      
      // Form alanlarını temizle
      konuInput.value = "";
      textarea.value = "";
      konuInput.style.display = 'none';
      textarea.style.display = 'none';
      Kaydet.style.display = 'none';
    } else {
      const error = await response.json();
      alert(`Hata: ${error.message}`);
    }
  } catch (error) {
    console.error('Kod kaydetme hatası:', error);
    alert('Kod kaydedilirken bir hata oluştu');
  }
});

// Veritabanından kodları yükle
async function loadCodes() {
  try {
    const response = await fetch('/api/codes');
    if (response.ok) {
      const codes = await response.json();
      codeList.innerHTML = ''; // Mevcut kodları temizle
      codes.forEach(code => {
        // Kullanıcının kendi kodları için isOwner = true
        const isOwner = code.username === currentUser;
        createCodeBox(code.title, code.code, code.username, code._id, isOwner);
      });
    }
  } catch (error) {
    console.error('Kod yükleme hatası:', error);
  }
}

// Kod kutusu oluştur
function createCodeBox(title, code, username, codeId, isOwner) {
  const box = document.createElement('div');
  box.classList.add('code-box');
  
  // Silme butonu sadece kod sahibi için görünür
  const deleteButton = isOwner ? `<button class="del-btn delete-btn">🗑</button>` : '';
  
  box.innerHTML = `
    <div class="btn-group">
      <button class="preview-btn">👁 Önizleme</button>
      ${deleteButton}
    </div>
    <h3>${title}</h3>
    <div class="username">@${username}</div>
    <div class="code-content"><pre>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></div>
  `;

  // Kod kutusuna tıklama (genişletme/daraltma)
  box.addEventListener('click', (e) => {
    if (!e.target.classList.contains("del-btn") && !e.target.classList.contains("preview-btn")) {
      box.classList.toggle('active');
    }
  });

  // Silme butonu (sadece kod sahibi için)
  const deleteBtn = box.querySelector(".del-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('Bu kodu silmek istediğinizden emin misiniz?')) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/codes/${codeId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            box.remove();
          } else {
            const error = await response.json();
            alert(`Silme hatası: ${error.message}`);
          }
        } catch (error) {
          console.error('Silme hatası:', error);
          alert('Kod silinirken bir hata oluştu');
        }
      }
    });
  }

  // Önizleme butonu
  box.querySelector(".preview-btn").addEventListener('click', (e) => {
    e.stopPropagation();
    const newWindow = window.open();
    newWindow.document.open();
    newWindow.document.write(code);
    newWindow.document.close();
  });

  codeList.appendChild(box);
}

// Enter tuşu ile kaydetme
textarea.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    Kaydet.click();
  }
});
