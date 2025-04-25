const stockCentral = window.stockCentral;

const select = document.getElementById("componenteSelect");
const detalle = document.getElementById("detalleComponente");

select.addEventListener("change", () => {
  const id = select.value;
  const componente = stockCentral.find((c) => c._id === id);

  if (componente) {
    detalle.innerHTML = `
      <p><strong>Nombre:</strong> ${componente.nombre}</p>
      <p><strong>Stock:</strong> ${componente.stock || 0}</p>
    `;
  } else {
    detalle.innerHTML = "";
  }
});

function agregarComponente() {
  const div = document.createElement("div");
  div.classList.add("componente");

  const options = componentesTecnico
    .map(
      (c) => `
      <option value="${c.componente._id}">
        ${c.componente.nombre} (x${c.cantidad})
      </option>`
    )
    .join("");

  div.innerHTML = `
      <select name="componente[]" required>
        <option value="">Seleccionar...</option>
        ${options}
      </select>
      <input type="number" name="cantidad[]" min="1" placeholder="Cantidad" required>
      <button type="button" onclick="this.parentNode.remove()">❌</button>
    `;

  document.getElementById("componentesUsados").appendChild(div);
}

function toggleKmInput(checkbox) {
  document.getElementById("kmInput").style.display = checkbox.checked
    ? "block"
    : "none";
}

document
  .getElementById("formActividad")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);

    const componentes = Array.from(
      form.querySelectorAll("select[name='componente[]']")
    ).map((sel, i) => ({
      componenteId: sel.value,
      cantidad: parseInt(
        form.querySelectorAll("input[name='cantidad[]']")[i].value
      ),
    }));

    const payload = {
      numero: data.get("numero"),
      fecha: data.get("fecha"),
      tipo: data.get("tipo"),
      estado: data.get("estado"),
      comunicarse: data.get("comunicarse") === "on",
      km: parseFloat(data.get("km")) || 0,
      comentario: data.get("comentario"),
      componentesUsados: componentes,
    };

    const res = await fetch("/actividades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("✅ Actividad registrada correctamente");
      form.reset();
      document.getElementById("componentesUsados").innerHTML = "";
      window.location.reload(); //
    } else {
      alert("❌ Error al registrar actividad");
    }
  });

async function cargarResumen(periodo) {
  const res = await fetch(`/actividades/resumen?periodo=${periodo}`);
  const actividades = await res.json();
  const tbody = document.getElementById("resumenCuerpo");

  if (!actividades.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Sin actividades registradas</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  let totalPuntos = 0;

  actividades.forEach((a) => {
    totalPuntos += a.puntajeTotal;
    tbody.innerHTML += `
        <tr>
          <td>${a.numero}</td>
          <td>${a.tipo}</td>
          <td>${a.puntajeTotal.toFixed(2)}</td>
          <td>
            Componentes: ${a.detalle.componentes.join(", ")}<br>
            Kilómetros: ${a.detalle.km} (${a.detalle.puntosKm.toFixed(2)} pts)
          </td>
        </tr>`;
  });

  document.getElementById(
    "totalPuntos"
  ).innerText = `🔢 Total puntos: ${totalPuntos.toFixed(2)}`;
}
window.onload = () => {
  cargarResumen("dia"); // Esto carga el resumen del día automáticamente
};
