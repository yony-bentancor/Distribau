// admin.js

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

async function cargarComponentes() {
  const res = await fetch("/componentes");
  const componentes = await res.json();
  const tbody = document.querySelector("#tabla-componentes tbody");
  tbody.innerHTML = "";

  componentes.forEach((c) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
        <td>${c.nombre}</td>
        <td>
          <input type="number" step="1" min="0" id="stock-${c._id}" value="${
      c.stock || 0
    }" style="width:80px;">
          <button onclick="guardarStockCentral('${c._id}')"></button>
        </td>
        <td>
          <button onclick="editarComponente('${c._id}', '${c.nombre}', ${
      c.puntaje
    })"></button>
          <button onclick="eliminarComponente('${c._id}')"></button>
        </td>
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
    cargarTecnicosParaTransferencia();
    cargarBodegasUsuarios();
  } else {
    const msg = await res.text();
    mostrarAlerta("⚠️ " + msg, "error");
  }
}

async function eliminarComponente(id) {
  if (confirm("¿Eliminar este componente?")) {
    await fetch(`/componentes/${id}`, { method: "DELETE" });
    mostrarAlerta("🗑️ Componente eliminado");
    cargarComponentes();
  }
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
      mostrarAlerta("✅ Componente actualizado correctamente");
      cargarComponentes();
    });
  } else {
    mostrarAlerta("❌ Datos inválidos", "error");
  }
}

async function cargarBodegasUsuarios() {
  const res = await fetch("/bodegas-usuarios");
  const bodegas = await res.json();
  const contenedor = document.getElementById("bodegas-tecnicos");
  contenedor.innerHTML = "";

  bodegas.forEach((b) => {
    const div = document.createElement("div");
    let html = `<h4>👷 ${b.usuario.username}</h4>`;
    html +=
      b.componentes.length === 0
        ? "<p style='color:#999;'>Sin componentes</p>"
        : "<ul>";
    b.componentes.forEach((c) => {
      html += `<li>${c.componente.nombre}: <strong>${c.cantidad}</strong></li>`;
    });
    html += b.componentes.length ? "</ul>" : "";
    div.innerHTML = html;
    contenedor.appendChild(div);
  });
}

let todosLosComponentes = [];

async function cargarTecnicosParaTransferencia() {
  const res = await fetch("/usuarios-tecnicos");
  const tecnicos = await res.json();
  const origen = document.getElementById("origen");
  const destino = document.getElementById("destino");
  origen.innerHTML = `<option value="bodega_central">Bodega Central</option>`;
  destino.innerHTML = `<option value="bodega_central">Bodega Central</option>`;
  tecnicos.forEach((t) => {
    const opt = new Option(t.username, t._id);
    origen.appendChild(opt.cloneNode(true));
    destino.appendChild(opt);
  });
}

async function agregarLineaComponente() {
  if (todosLosComponentes.length === 0) {
    const res = await fetch("/componentes");
    todosLosComponentes = await res.json();
  }
  const div = document.createElement("div");
  div.innerHTML = `
      <select class="select-componente" required>
        ${todosLosComponentes
          .map(
            (c) =>
              `<option value="${c._id}">${c.nombre} (Stock: ${
                c.stock ?? 0
              })</option>`
          )
          .join("")}
      </select>
      <input type="number" min="1" class="cantidad-componente" placeholder="Cantidad" required>
      <button type="button" onclick="this.parentNode.remove()">❌</button>
    `;
  document.getElementById("componentes-transferencia").appendChild(div);
}

document
  .getElementById("form-transferencia-multiple")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const origenValor = document.getElementById("origen").value;
    const destinoValor = document.getElementById("destino").value;
    const comentario = document.getElementById("comentario").value;
    if (origenValor === destinoValor) {
      return mostrarAlerta(
        "❌ Origen y destino no pueden ser iguales",
        "error"
      );
    }
    const origen =
      origenValor === "bodega_central"
        ? { tipo: "bodega", id: null }
        : { tipo: "usuario", id: origenValor };
    const destino =
      destinoValor === "bodega_central"
        ? { tipo: "bodega", id: null }
        : { tipo: "usuario", id: destinoValor };
    const selects = document.querySelectorAll(".select-componente");
    const cantidades = document.querySelectorAll(".cantidad-componente");
    const componentes = [];
    for (let i = 0; i < selects.length; i++) {
      const componenteId = selects[i].value;
      const cantidad = parseInt(cantidades[i].value);
      if (!componenteId || isNaN(cantidad) || cantidad <= 0) {
        return mostrarAlerta(
          "❌ Datos inválidos en la selección de componentes",
          "error"
        );
      }
      componentes.push({ componenteId, cantidad });
    }
    if (componentes.length === 0) {
      return mostrarAlerta("❌ Debes agregar al menos un componente", "error");
    }
    const res = await fetch("/transferir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origen, destino, componentes, comentario }),
    });
    if (res.ok) {
      mostrarAlerta("✅ Transferencia realizada con éxito");
      cargarComponentes();
      cargarTecnicosParaTransferencia();
      cargarBodegasUsuarios();
      this.reset();
      document.getElementById("componentes-transferencia").innerHTML = "";
    } else {
      const msg = await res.text();
      mostrarAlerta("⚠️ " + msg, "error");
    }
  });

window.onload = () => {
  cargarComponentes();
  cargarTecnicosParaTransferencia();
  cargarBodegasUsuarios();
};
