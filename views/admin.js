function mostrarAlerta(mensaje, tipo = "success") {
  const alerta = document.getElementById("alerta");
  alerta.innerText = mensaje;
  alerta.style.display = "block";
  alerta.style.backgroundColor = tipo === "success" ? "#d4edda" : "#f8d7da";
  alerta.style.color = tipo === "success" ? "#155724" : "#721c24";
  alerta.style.border =
    tipo === "success" ? "1px solid #c3e6cb" : "1px solid #f5c6cb";
  setTimeout(() => (alerta.style.display = "none"), 3000);
}

// === COMPONENTES ===
async function cargarComponentes() {
  const res = await fetch("/componentes");
  const componentes = await res.json();
  const tbody = document.querySelector("#tabla-componentes tbody");
  tbody.innerHTML = "";

  componentes.forEach((c) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
        <td>${c.nombre}</td>
        <td>${c.puntaje}</td>
        <td>
          <button onclick="editarComponente('${c._id}', '${c.nombre}', ${c.puntaje})">Editar</button>
          <button onclick="eliminarComponente('${c._id}')">Eliminar</button>
        </td>
      `;
    tbody.appendChild(fila);
  });
}

function editarComponente(id, nombre, puntaje) {
  const nuevoNombre = prompt("Nuevo nombre:", nombre);
  const nuevoPuntaje = prompt("Nuevo puntaje:", puntaje);
  const puntajeFloat = parseFloat(nuevoPuntaje);
  if (!isNaN(puntajeFloat) && nuevoNombre) {
    fetch(`/componentes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nuevoNombre, puntaje: puntajeFloat }),
    }).then(() => {
      mostrarAlerta("✅ Componente actualizado");
      cargarComponentes();
      cargarStockCentral();
    });
  } else {
    mostrarAlerta("❌ Datos inválidos", "error");
  }
}

async function eliminarComponente(id) {
  if (confirm("¿Eliminar este componente?")) {
    await fetch(`/componentes/${id}`, { method: "DELETE" });
    mostrarAlerta("🗑️ Componente eliminado");
    cargarComponentes();
    cargarStockCentral();
  }
}

// === STOCK CENTRAL ===
async function cargarStockCentral() {
  const res = await fetch("/componentes");
  const componentes = await res.json();
  const tbody = document.querySelector("#tabla-stock-central tbody");
  tbody.innerHTML = "";

  componentes.forEach((c) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
        <td>${c.nombre}</td>
        <td><input type="number" min="0" id="stock-${c._id}" value="${
      c.stock || 0
    }" style="width:80px;"></td>
        <td><button onclick="guardarStockCentral('${c._id}')">💾</button></td>
      `;
    tbody.appendChild(fila);
  });
}

async function guardarStockCentral(id) {
  const input = document.getElementById(`stock-${id}`);
  const nuevoStock = parseInt(input.value);
  if (isNaN(nuevoStock) || nuevoStock < 0) {
    mostrarAlerta("❌ Stock inválido", "error");
    return;
  }
  const res = await fetch(`/actualizar-stock-central/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stock: nuevoStock }),
  });
  if (res.ok) {
    mostrarAlerta("✅ Stock central actualizado");
    cargarTecnicosYComponentes();
    cargarBodegasUsuarios();
  } else {
    const msg = await res.text();
    mostrarAlerta("⚠️ " + msg, "error");
  }
}

// === TRANSFERENCIA ===
async function cargarTecnicosYComponentes() {
  const [tecnicosRes, componentesRes] = await Promise.all([
    fetch("/usuarios-tecnicos"),
    fetch("/componentes"),
  ]);
  const tecnicos = await tecnicosRes.json();
  const componentes = await componentesRes.json();

  const tecnicoSelect = document.getElementById("tecnico");
  const componenteSelect = document.getElementById("componente");

  tecnicoSelect.innerHTML = "";
  componenteSelect.innerHTML = "";

  tecnicos
    .filter((t) => t.username !== "admin")
    .forEach((t) => {
      const option = document.createElement("option");
      option.value = t._id;
      option.textContent = t.username;
      tecnicoSelect.appendChild(option);
    });

  componentes.forEach((c) => {
    const option = document.createElement("option");
    option.value = c._id;
    option.textContent = `${c.nombre} (Stock: ${c.stock || 0})`;
    componenteSelect.appendChild(option);
  });
}

async function cargarBodegasUsuarios() {
  const res = await fetch("/bodegas-usuarios");
  const bodegas = await res.json();
  const contenedor = document.getElementById("bodegas-tecnicos");
  contenedor.innerHTML = "";

  bodegas.forEach((b) => {
    const div = document.createElement("div");
    div.style.marginBottom = "1rem";
    div.style.background = "#fff";
    div.style.padding = "1rem";
    div.style.borderRadius = "10px";
    div.style.boxShadow = "0 2px 6px rgba(0,0,0,0.05)";
    let html = `<strong>${b.usuario.username}</strong><ul>`;
    b.componentes.forEach((c) => {
      html += `<li>${c.componente.nombre}: ${c.cantidad}</li>`;
    });
    html += "</ul>";
    div.innerHTML = html;
    contenedor.appendChild(div);
  });
}

// === EVENTOS ===
document
  .getElementById("form-componente")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const nombre = this.nombre.value.trim();
    const puntaje = parseFloat(this.puntaje.value);
    if (!nombre || isNaN(puntaje))
      return mostrarAlerta("❌ Datos inválidos", "error");

    const res = await fetch("/componentes", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ nombre, puntaje }),
    });
    if (res.ok) {
      mostrarAlerta("✅ Componente creado");
      this.reset();
      cargarComponentes();
      cargarStockCentral();
      cargarTecnicosYComponentes();
    } else {
      const msg = await res.text();
      mostrarAlerta("⚠️ " + msg, "error");
    }
  });

document
  .getElementById("form-transferencia")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const userId = this.tecnico.value;
    const componenteId = this.componente.value;
    const cantidad = parseInt(this.cantidad.value);

    if (!userId || !componenteId || isNaN(cantidad) || cantidad <= 0)
      return mostrarAlerta("❌ Datos inválidos", "error");

    const res = await fetch("/transferir-stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, componenteId, cantidad }),
    });
    if (res.ok) {
      mostrarAlerta("📦 Stock transferido");
      cargarStockCentral();
      cargarBodegasUsuarios();
      this.reset();
    } else {
      const msg = await res.text();
      mostrarAlerta("⚠️ " + msg, "error");
    }
  });

// === INICIO ===
window.onload = () => {
  cargarComponentes();
  cargarStockCentral();
  cargarTecnicosYComponentes();
  cargarBodegasUsuarios();
};
