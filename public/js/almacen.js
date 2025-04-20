const formComp = document.getElementById("form-componente");
const modeloContenedor = document.getElementById("form-almacen");
const inputFiltro = document.getElementById("filtro");

function mostrarAlerta(mensaje, tipo = "success") {
  const alerta = document.getElementById("alerta");
  alerta.textContent = mensaje;
  alerta.style.color = tipo === "success" ? "green" : "red";
  alerta.style.fontWeight = "bold";
  setTimeout(() => (alerta.textContent = ""), 3000);
}

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
    const nuevo = await res.json();
    mostrarAlerta("✅ Componente creado correctamente");
    formComp.reset();
    let box = document.querySelector(
      `[data-modelo="${nuevo.modelo.toLowerCase()}"]`
    );
    if (!box) {
      box = document.createElement("div");
      box.className = "modelo-box";
      box.setAttribute("data-modelo", nuevo.modelo.toLowerCase());
      box.innerHTML = `<div class="modelo-title">📦 ${nuevo.modelo}</div>`;
      modeloContenedor.insertBefore(
        box,
        modeloContenedor.querySelector("button")
      );
    }
    const fila = document.createElement("div");
    fila.className = "componente-row";
    fila.setAttribute("data-nombre", nuevo.nombre.toLowerCase());
    fila.innerHTML = `
      <div><strong>${nuevo.nombre}</strong><br>
        <button type="button" onclick="editarComponente('${nuevo._id}', '${nuevo.nombre}', ${nuevo.puntosInstalacion}, ${nuevo.puntosConexion})">✏️</button>
        <button type="button" onclick="eliminarComponente('${nuevo._id}', this)">🗑️</button>
      </div>
      <input type="number" name="${nuevo._id}" min="0" value="0" />`;
    box.appendChild(fila);
  } else {
    mostrarAlerta("❌ Error al crear componente", "error");
  }
});

function editarComponente(id, nombre, puntosInstalacion, puntosConexion) {
  const nuevoNombre = prompt("Nuevo nombre:", nombre);
  const nuevoPI = prompt("Nuevo puntaje instalación:", puntosInstalacion);
  const nuevoPC = prompt("Nuevo puntaje conexión:", puntosConexion);
  const pi = parseFloat(nuevoPI);
  const pc = parseFloat(nuevoPC);
  if (!nuevoNombre || isNaN(pi) || isNaN(pc))
    return mostrarAlerta("❌ Datos inválidos", "error");
  fetch(`/componentes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre: nuevoNombre,
      puntosInstalacion: pi,
      puntosConexion: pc,
    }),
  }).then((res) => {
    if (res.ok) {
      mostrarAlerta("✅ Componente editado correctamente");
      location.reload();
    } else {
      mostrarAlerta("❌ Error al editar", "error");
    }
  });
}

function eliminarComponente(id, btn) {
  if (!confirm("¿Eliminar este componente?")) return;
  fetch(`/componentes/${id}`, { method: "DELETE" }).then((res) => {
    if (res.ok) {
      mostrarAlerta("🗑️ Componente eliminado");
      const fila = btn.closest(".componente-row");
      fila.remove();
    } else {
      mostrarAlerta("❌ Error al eliminar", "error");
    }
  });
}

const modeloBoxes = document.querySelectorAll(".modelo-box");
inputFiltro.addEventListener("input", () => {
  const texto = inputFiltro.value.toLowerCase();
  const modeloBoxes = document.querySelectorAll(".modelo-box"); // ✅ moverlo aquí

  modeloBoxes.forEach((box) => {
    const modelo = box.getAttribute("data-modelo");
    const filas = box.querySelectorAll(".componente-row");
    let visible = false;
    filas.forEach((fila) => {
      const nombre = fila.getAttribute("data-nombre");
      const coincide = modelo.includes(texto) || nombre.includes(texto);
      fila.style.display = coincide ? "flex" : "none";
      if (coincide) visible = true;
    });
    box.style.display = visible ? "block" : "none";
  });
});
