// admin.js actualizado

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

  // Obtener stock central desde backend
  const stockRes = await fetch("/bodega-central");
  const stockCentral = await stockRes.json();

  // Ordenar componentes por modelo
  componentes.sort((a, b) => {
    if (a.modelo < b.modelo) return -1;
    if (a.modelo > b.modelo) return 1;
    return 0;
  });

  componentes.forEach((c) => {
    const enStock = stockCentral.find(
      (s) => s?.componente?._id?.toString() === c._id.toString()
    );
    const cantidad = enStock ? enStock.cantidad : 0;

    if (cantidad >= 1) {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${c.modelo}</td>
        <td>${c.nombre}</td>
        <td>${cantidad}</td>
        <td>
          <button onclick="editarComponente('${c._id}','${c.modelo}', '${c.nombre}', ${c.puntosInstalacion}, ${c.puntosConexion})">✏️</button>
          <button onclick="eliminarComponente('${c._id}')">🗑️</button>
        </td>
      `;
      tbody.appendChild(fila);
    }
  });
}

async function eliminarComponente(id) {
  if (confirm("¿Eliminar este componente?")) {
    await fetch(`/componentes/${id}`, { method: "DELETE" });
    mostrarAlerta("🗑️ Componente eliminado");
    cargarComponentes();
  }
}

function editarComponente(
  id,
  modelo,
  nombre,
  puntosInstalacion,
  puntosConexion
) {
  const nuevoModelo = prompt("Nuevo modelo:", modelo);
  const nuevoNombre = prompt("Nuevo nombre:", nombre);
  const nuevoPI = prompt("Nuevo puntaje instalación:", puntosInstalacion);
  const nuevoPC = prompt("Nuevo puntaje conexión:", puntosConexion);
  const piFloat = parseFloat(nuevoPI);
  const pcFloat = parseFloat(nuevoPC);

  if (!isNaN(piFloat) && !isNaN(pcFloat) && nuevoNombre) {
    fetch(`/componentes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: nuevoNombre,
        puntosInstalacion: piFloat,
        puntosConexion: pcFloat,
      }),
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
    div.classList.add("tarjeta-tecnico");

    let html = `<h4>👷 ${b.usuario.username}</h4>`;

    if (b.componentes.length === 0) {
      html += "<p style='color:#999;'>Sin componentes</p>";
    } else {
      html += `<div class="fila-componentes">`;
      b.componentes.forEach((c) => {
        html += `
          <div class="componente">
            <strong>${c.componente.modelo}</strong><br>
            ${c.componente.nombre}: <span>${c.cantidad}</span>
          </div>`;
      });
      html += `</div>`;
    }

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

/* async function agregarLineaComponente() {
  if (todosLosComponentes.length === 0) {
    const res = await fetch("/componentes");
    todosLosComponentes = await res.json();
  }
  const div = document.createElement("div");
  div.innerHTML = `
      <select class="select-componente" required>
        ${todosLosComponentes
          .map((c) => `<option value="${c._id}">${c.nombre}</option>`)
          .join("")}
      </select>
      <input type="number" min="1" class="cantidad-componente" placeholder="Cantidad" required>
      <button type="button" onclick="this.parentNode.remove()">❌</button>
    `;
  document.getElementById("componentes-transferencia").appendChild(div);
}
  
 */
// Detecta la URL actual
const links = document.querySelectorAll(".nav-buttons a");
const currentPath = window.location.pathname;

links.forEach((link) => {
  if (link.getAttribute("href") === currentPath) {
    link.classList.add("activo");
  }
});

async function agregarLineaComponente() {
  const origenSeleccionado = document.getElementById("origen").value;

  if (todosLosComponentes.length === 0) {
    let componentes = [];
    let stock = [];

    if (origenSeleccionado === "bodega_central") {
      // Traemos stock central
      const [resComp, resStock] = await Promise.all([
        fetch("/componentes"),
        fetch("/bodega-central"),
      ]);
      componentes = await resComp.json();
      stock = await resStock.json();
    } else {
      // Traemos stock del técnico seleccionado
      const [resComp, resBodegas] = await Promise.all([
        fetch("/componentes"),
        fetch(`/bodegas-usuarios`),
      ]);
      componentes = await resComp.json();
      const bodegas = await resBodegas.json();
      const bodegaOrigen = bodegas.find(
        (b) => b.usuario._id === origenSeleccionado
      );

      if (!bodegaOrigen) {
        return mostrarAlerta(
          "⚠️ No se encontró la bodega del técnico seleccionado",
          "error"
        );
      }
      stock = bodegaOrigen.componentes.map((c) => ({
        componente: { _id: c.componente._id.toString() },
        cantidad: c.cantidad,
      }));
    }

    // Filtrar componentes que realmente tienen stock
    todosLosComponentes = componentes
      .map((c) => {
        const enStock = stock.find(
          (s) => s?.componente?._id?.toString() === c._id.toString()
        );
        if (enStock && enStock.cantidad >= 1) {
          return {
            _id: c._id,
            nombre: c.nombre,
            modelo: c.modelo,
            stock: enStock.cantidad,
          };
        }
      })
      .filter(Boolean);
    // 🔥 Ordenarlos por modelo (A-Z)
    todosLosComponentes.sort((a, b) => {
      if (a.modelo < b.modelo) return -1;
      if (a.modelo > b.modelo) return 1;
      return 0;
    });
  }

  if (todosLosComponentes.length === 0) {
    return mostrarAlerta(
      "⚠️ No hay componentes con stock disponible en esta bodega",
      "error"
    );
  }

  const div = document.createElement("div");
  div.classList.add("fade-in");
  div.innerHTML = `
    <select class="select-componente" required>
      <option value="">Seleccionar Componente</option>
      ${todosLosComponentes
        .map(
          (c) =>
            `<option value="${c._id}">${c.modelo} - ${c.nombre} (Stock: ${c.stock})</option>`
        )
        .join("")}
    </select>
    <input type="number" min="1" class="cantidad-componente" placeholder="Cantidad" required>
    <button type="button" onclick="this.parentNode.remove()">❌</button>
  `;
  document.getElementById("componentes-transferencia").appendChild(div);
}

document.getElementById("origen").addEventListener("change", () => {
  todosLosComponentes = []; // 🔥 Vaciamos para que al agregar se vuelva a cargar según el origen
});

// Crear nuevo componente
/* const formComp = document.getElementById("form-componente");
formComp.addEventListener("submit", async (e) => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(formComp));
  const body = {
    nombre: datos.nombre,
    articuloComercial: datos.articuloComercial,
    modelo: datos.modelo,
    puntosInstalacion: parseFloat(datos.puntosInstalacion),
    puntosConexion: parseFloat(datos.puntosConexion),
  };
  const res = await fetch("/componentes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.ok) {
    mostrarAlerta("✅ Componente creado correctamente");
    formComp.reset();
    cargarComponentes();
  } else {
    mostrarAlerta("❌ Error al crear componente", "error");
  }
}); */

// Envío de transferencia
const formTrans = document.getElementById("form-transferencia-multiple");
formTrans.addEventListener("submit", async (e) => {
  e.preventDefault();
  const origenId = document.getElementById("origen").value;
  const destinoId = document.getElementById("destino").value;
  const comentario = document.getElementById("comentario").value;

  if (origenId === destinoId) {
    return mostrarAlerta("❌ Origen y destino no pueden ser iguales", "error");
  }

  const selects = document.querySelectorAll(".select-componente");
  const cantidades = document.querySelectorAll(".cantidad-componente");
  const componentes = {};
  for (let i = 0; i < selects.length; i++) {
    const compId = selects[i].value;
    const cantidad = parseInt(cantidades[i].value);
    if (!compId || isNaN(cantidad) || cantidad <= 0) {
      return mostrarAlerta("❌ Componentes inválidos", "error");
    }
    componentes[compId] = cantidad;
  }

  const url = "/transferir";

  const origen = {
    tipo: origenId === "bodega_central" ? "bodega" : "usuario",
    id: origenId === "bodega_central" ? null : origenId,
  };

  const destino = {
    tipo: destinoId === "bodega_central" ? "bodega" : "usuario",
    id: destinoId === "bodega_central" ? null : destinoId,
  };

  const componentesArray = Object.entries(componentes).map(
    ([componenteId, cantidad]) => ({
      componenteId,
      cantidad,
    })
  );

  const body = {
    origen,
    destino,
    componentes: componentesArray,
    comentario,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    mostrarAlerta("✅ Transferencia realizada correctamente");
    formTrans.reset();
    document.getElementById("componentes-transferencia").innerHTML = "";
    cargarComponentes();
    cargarBodegasUsuarios();
  } else {
    const msg = await res.text();
    mostrarAlerta("⚠️ " + msg, "error");
  }

  if (res.ok) {
    mostrarAlerta("✅ Transferencia realizada correctamente");
    formTrans.reset();
    document.getElementById("componentes-transferencia").innerHTML = "";
    cargarComponentes();
    cargarBodegasUsuarios();
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
