/* =====================================================
   SelloYa — interacciones de la aplicación (JavaScript sin librerías)
   1. Ajustes de accesibilidad guardados en el navegador
   2. Mensajes de confirmación (toasts) con ?aviso=...
   3. Diálogos de confirmación (<dialog>)
   4. Mostrar u ocultar la contraseña
   5. Filtros (chips)
   6. Registrar sello: validación del código (CLI-03 / CLI-03E)
   7. Contador de sellos en «Sellos y recompensas»
   8. Notificaciones: marcar todas como leídas
   9. Copiar el código del negocio y botones que se alternan
   ===================================================== */

/* ---------- 1. Ajustes de accesibilidad (CLI-10) ---------- */
const AJUSTES = ["texto-grande", "alto-contraste", "sin-animaciones"];

function leerAjustes() {
  try {
    return JSON.parse(localStorage.getItem("selloya-ajustes")) || {};
  } catch (error) {
    return {};
  }
}

function aplicarAjustes() {
  const ajustes = leerAjustes();
  AJUSTES.forEach((nombre) => {
    document.documentElement.classList.toggle(nombre, Boolean(ajustes[nombre]));
  });
}
aplicarAjustes();

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-ajuste]").forEach((interruptor) => {
    const nombre = interruptor.dataset.ajuste;
    interruptor.checked = Boolean(leerAjustes()[nombre]);
    interruptor.addEventListener("change", () => {
      const ajustes = leerAjustes();
      ajustes[nombre] = interruptor.checked;
      try {
        localStorage.setItem("selloya-ajustes", JSON.stringify(ajustes));
      } catch (error) {
        /* Si el navegador no permite guardar, el ajuste solo dura en esta página */
      }
      document.documentElement.classList.toggle(nombre, interruptor.checked);
    });
  });

  mostrarAviso();
  prepararDialogos();
  prepararClaves();
  prepararFiltros();
  prepararRegistroDeSello();
  prepararContador();
  prepararNotificaciones();
  prepararUtilidades();
});

/* ---------- 2. Mensajes de confirmación (toasts) ---------- */
const AVISOS = {
  entrega: { texto: "Entrega confirmada. La tarjeta de Marta R. volvió a 0 sellos.", deshacer: "canjes.html" },
  reglas: { texto: "Reglas guardadas. Tus clientes ya ven la nueva meta.", deshacer: "reglas.html" },
  promocion: { texto: "Promoción publicada. 38 clientes recibieron la notificación.", deshacer: "nueva-promocion.html" },
  plan: { texto: "Solicitud enviada. Te contactaremos en 24 horas para activar el plan Negocio." },
  aprobado: { texto: "Panadería El Trigal fue aprobada y ya puede usar SelloYa.", deshacer: "solicitud.html" },
  rechazado: { texto: "Enviamos el motivo del rechazo a Panadería El Trigal." },
  resuelta: { texto: "La incidencia #1042 quedó marcada como resuelta.", deshacer: "incidencia.html" },
  respuesta: { texto: "Respuesta enviada a Restaurante Doña Rosa." },
  guardado: { texto: "Cambios guardados." },
  "canje-cancelado": { texto: "Cancelaste la solicitud de canje. Tu recompensa sigue disponible." },
};

function mostrarAviso() {
  const clave = new URLSearchParams(window.location.search).get("aviso");
  const aviso = AVISOS[clave];
  if (!aviso) return;

  // Muestra u oculta elementos que dependen del aviso (por ejemplo, «Entregado»)
  document.querySelectorAll(`[data-mostrar-con="${clave}"]`).forEach((el) => (el.hidden = false));
  document.querySelectorAll(`[data-ocultar-con="${clave}"]`).forEach((el) => (el.hidden = true));

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.innerHTML =
    '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>' +
    `<p>${aviso.texto}</p>` +
    (aviso.deshacer ? `<a href="${aviso.deshacer}">Deshacer</a>` : "") +
    '<button type="button" aria-label="Cerrar mensaje">×</button>';
  document.body.appendChild(toast);
  toast.querySelector("button").addEventListener("click", () => toast.remove());
  setTimeout(() => toast.remove(), 9000);
}

/* ---------- 3. Diálogos de confirmación ---------- */
function prepararDialogos() {
  document.querySelectorAll("[data-abrir]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const dialogo = document.getElementById(boton.dataset.abrir);
      if (dialogo && dialogo.showModal) dialogo.showModal();
    });
  });
  document.querySelectorAll("dialog").forEach((dialogo) => {
    dialogo.querySelectorAll("[data-cerrar]").forEach((b) => b.addEventListener("click", () => dialogo.close()));
    // Tocar fuera del diálogo también lo cierra (control y libertad)
    dialogo.addEventListener("click", (evento) => {
      if (evento.target === dialogo) dialogo.close();
    });
  });
  // «Volver» del Centro de ayuda regresa a la página anterior si existe
  document.querySelectorAll("[data-volver]").forEach((enlace) => {
    enlace.addEventListener("click", (evento) => {
      if (document.referrer && history.length > 1) {
        evento.preventDefault();
        history.back();
      }
    });
  });
}

/* ---------- 4. Mostrar u ocultar la contraseña ---------- */
function prepararClaves() {
  document.querySelectorAll("[data-ver-clave]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const campo = document.getElementById(boton.dataset.verClave);
      const visible = campo.type === "text";
      campo.type = visible ? "password" : "text";
      boton.textContent = visible ? "Mostrar" : "Ocultar";
      boton.setAttribute("aria-pressed", String(!visible));
    });
  });
}

/* ---------- 5. Filtros (chips) ---------- */
function prepararFiltros() {
  document.querySelectorAll(".chips").forEach((grupo) => {
    const destino = grupo.dataset.filtra ? document.getElementById(grupo.dataset.filtra) : null;
    grupo.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        grupo.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", "false"));
        chip.setAttribute("aria-pressed", "true");
        if (!destino) return;
        const filtro = chip.dataset.filtro;
        destino.querySelectorAll("[data-categoria]").forEach((tarjeta) => {
          tarjeta.hidden = filtro !== "todas" && tarjeta.dataset.categoria !== filtro;
        });
      });
    });
  });
}

/* ---------- 6. Registrar sello: validación del código ---------- */
const CODIGOS = { "CAFE-4821": "Café La Esquina", "PANT-1180": "Panadería El Trigal", "PELU-0602": "Peluquería Estilo" };

function prepararRegistroDeSello() {
  const formulario = document.getElementById("form-sello");
  if (!formulario) return;
  const campo = document.getElementById("codigo");
  const contenedor = campo.closest(".campo");
  const ayuda = document.getElementById("codigo-ayuda");
  const sugerencia = document.getElementById("sugerencia");
  const error = document.getElementById("error-sello");

  formulario.addEventListener("submit", (evento) => {
    const codigo = campo.value.trim().toUpperCase();
    campo.value = codigo;
    if (CODIGOS[codigo]) return; // código válido: continúa a «Sello registrado»

    evento.preventDefault();
    contenedor.classList.add("campo-error");
    campo.setAttribute("aria-invalid", "true");
    ayuda.textContent = `No encontramos ${codigo || "ese código"}. Los códigos tienen 4 letras y 4 números; revisa el aviso en caja.`;
    error.hidden = false;
    sugerencia.hidden = false;
    campo.focus();
  });

  sugerencia.addEventListener("click", () => {
    campo.value = "CAFE-4821";
    contenedor.classList.remove("campo-error");
    campo.removeAttribute("aria-invalid");
    ayuda.textContent = "Código de Café La Esquina.";
    error.hidden = true;
    sugerencia.hidden = true;
    formulario.requestSubmit();
  });
}

/* ---------- 7. Contador de sellos necesarios ---------- */
function prepararContador() {
  const formulario = document.querySelector("[data-reglas]");
  if (!formulario) return;
  const meta = document.getElementById("meta");
  const texto = document.querySelector("[data-meta-texto]");
  const actualizar = () => {
    const valor = Math.min(20, Math.max(3, Number(meta.value) || 3));
    meta.value = valor;
    texto.textContent = `Te faltan ${valor - 3} sellos para un café americano gratis.`;
  };
  formulario.querySelectorAll("[data-paso]").forEach((boton) => {
    boton.addEventListener("click", () => {
      meta.value = Number(meta.value) + Number(boton.dataset.paso);
      actualizar();
    });
  });
  meta.addEventListener("change", actualizar);
}

/* ---------- 8. Notificaciones ---------- */
function prepararNotificaciones() {
  document.querySelectorAll("[data-marcar-leidas]").forEach((boton) => {
    boton.addEventListener("click", () => {
      document.querySelectorAll("#lista-notificaciones .insignia").forEach((insignia) => insignia.remove());
      boton.disabled = true;
      boton.querySelector("span").textContent = "Todo está leído";
    });
  });
}

/* ---------- 9. Utilidades ---------- */
function prepararUtilidades() {
  document.querySelectorAll("[data-copiar]").forEach((boton) => {
    boton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(boton.dataset.copiar);
        boton.setAttribute("aria-label", "Código copiado");
      } catch (error) {
        /* El navegador no permitió copiar */
      }
    });
  });
  document.querySelectorAll("[data-alternar]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const activo = boton.getAttribute("aria-pressed") === "true";
      boton.setAttribute("aria-pressed", String(!activo));
      boton.classList.toggle("btn-primario", !activo);
      boton.classList.toggle("btn-secundario", activo);
    });
  });
}
