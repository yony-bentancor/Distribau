function agregarComponente() {
  const div = document.createElement("div");
  div.classList.add("componente");

  const options = window.componentesTecnico
    .map(
      (c) => `
      <option value="${c.componente._id}">
        ${c.componente.modelo ? c.componente.modelo + " - " : ""}${
        c.componente.nombre
      } (x${c.cantidad})
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
      window.location.reload();
    } else {
      alert("❌ Error al registrar actividad");
    }
  });

const filtros = document.querySelectorAll(".resumen-filtros button");

filtros.forEach((boton) => {
  boton.addEventListener("click", () => {
    filtros.forEach((b) => b.classList.remove("active")); // quitar active a todos
    boton.classList.add("active"); // poner active solo al clickeado
  });
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

    const comps = Array.isArray(a.detalle?.componentes)
      ? a.detalle.componentes
      : [];
    const km = a.detalle?.km ?? 0;
    const ptsKm = a.detalle?.puntosKm ?? 0;

    tbody.innerHTML += `
    <tr>
      <td>${a.numero}</td>
      <td>${a.tipo}</td>
      <td>${a.puntajeTotal.toFixed(2)}</td>
</tr>
      <tr>
      <td>
        <span style="display:block;"><strong>Componentes</strong></span>
        <ul style="margin:.25rem 0 .5rem 1rem; padding:0;">
          ${
            comps.length
              ? comps.map((c) => `<li>${c}</li>`).join("")
              : "<li><em>Sin componentes</em></li>"
          }
        </ul>

        <span style="display:block; margin-top:.25rem;"><strong>Kilómetros</strong></span>
        <span style="display:block;">${km} <small>(${ptsKm.toFixed(
      2
    )} pts)</small></span>
      </td>
    </tr>`;
  });

  document.getElementById(
    "totalPuntos"
  ).innerText = `🔢 Total puntos: ${totalPuntos.toFixed(2)}`;
}

window.onload = () => {
  cargarResumen("dia");
};
