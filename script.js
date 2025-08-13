const Ekle = document.getElementById('Ekle');
const Kaydet = document.getElementById('Kaydet');
const konuInput = document.getElementById('konuInput');
const textarea = document.getElementById('textarea');
const codeList = document.getElementById('codeList');

window.onload = () => {
  const savedCodes = JSON.parse(localStorage.getItem("codes") || "[]");
  savedCodes.forEach(({ title, code }) => createCodeBox(title, code));
};

Ekle.addEventListener('click', () => {
  const isHidden = konuInput.style.display === 'none';
  konuInput.style.display = isHidden ? 'inline-block' : 'none';
  textarea.style.display = isHidden ? 'block' : 'none';
  Kaydet.style.display = isHidden ? 'inline-block' : 'none';
});

Kaydet.addEventListener('click', () => {
  const konu = konuInput.value.trim();
  const kod = textarea.value;

  if (!konu || !kod) {
    alert("Başlık ve kod alanları boş bırakılamaz!");
    return;
  }

  saveToLocal(konu, kod);
  createCodeBox(konu, kod);

  konuInput.value = "";
  textarea.value = "";
});

function saveToLocal(title, code) {
  const savedCodes = JSON.parse(localStorage.getItem("codes") || "[]");
  savedCodes.push({ title, code });
  localStorage.setItem("codes", JSON.stringify(savedCodes));
}

function deleteFromLocal(title) {
  let savedCodes = JSON.parse(localStorage.getItem("codes") || "[]");
  savedCodes = savedCodes.filter(item => item.title !== title);
  localStorage.setItem("codes", JSON.stringify(savedCodes));
}

function createCodeBox(title, code) {
  const box = document.createElement('div');
  box.classList.add('code-box');
  box.innerHTML = `
    <div class="btn-group">
      <button class="preview-btn">👁 Önizleme</button>
      <button class="del-btn">🗑</button>
    </div>
    <h3>${title}</h3>
    <div class="code-content"><pre>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></div>
  `;

  box.addEventListener('click', (e) => {
    if (!e.target.classList.contains("del-btn") && !e.target.classList.contains("preview-btn")) {
      box.classList.toggle('active');
    }
  });

  box.querySelector(".del-btn").addEventListener('click', (e) => {
    e.stopPropagation();
    box.remove();
    deleteFromLocal(title);
  });

  box.querySelector(".preview-btn").addEventListener('click', (e) => {
    e.stopPropagation();
    const newWindow = window.open();
    newWindow.document.open();
    newWindow.document.write(code);
    newWindow.document.close();
  });

  codeList.appendChild(box);
}
