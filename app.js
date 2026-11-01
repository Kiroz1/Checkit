// ============================================================
//  Check list
//  Idea central: todo sale del arreglo `items`.
//  Cada vez que cambia -> guardar() + render()
// ============================================================

const CLAVE_ITEMS = "mi-lista:items";
const CLAVE_FILTRO = "mi-lista:filtro";

const NOMBRES_TIPO = {
  pendiente: "Pendiente",
  despensa: "Despensa",
  casa: "Casa",
  trabajo: "Trabajo",
};

// ---------- Elementos del HTML ----------
const form = document.getElementById("form");
const inputTexto = document.getElementById("texto");
const selectTipo = document.getElementById("tipo");
const filtros = document.getElementById("filtros");
const lista = document.getElementById("lista");
const vacio = document.getElementById("vacio");
const resumen = document.getElementById("resumen");
const btnLimpiar = document.getElementById("limpiar");

// ---------- Estado ----------
let items = cargar();
let filtro = cargarFiltro();

// ---------- Guardar y cargar (localStorage) ----------
function cargar() {
  try {
    const guardado = localStorage.getItem(CLAVE_ITEMS);
    // La primera vez no hay nada guardado (null): se empieza con []
    const datos = guardado ? JSON.parse(guardado) : [];
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    console.error("No se pudo leer lo guardado:", error);
    return [];
  }
}

function guardar() {
  try {
    localStorage.setItem(CLAVE_ITEMS, JSON.stringify(items));
  } catch (error) {
    console.error("No se pudo guardar:", error);
  }
}

function cargarFiltro() {
  try {
    const f = localStorage.getItem(CLAVE_FILTRO);
    return f === "todos" || NOMBRES_TIPO[f] ? f : "todos";
  } catch {
    return "todos";
  }
}

function guardarFiltro() {
  try {
    localStorage.setItem(CLAVE_FILTRO, filtro);
  } catch (error) {
    console.error(error);
  }
}

// ---------- Acciones que cambian los datos ----------
function agregar(texto, tipo) {
  items.push({
    id: Date.now(),      // id simple y suficiente para uso personal
    texto: texto,
    tipo: tipo,
    hecho: false,
  });
  guardar();
  render();
}

function alternarHecho(id) {
  items = items.map((item) =>
    item.id === id ? { ...item, hecho: !item.hecho } : item
  );
  guardar();
  render();
}

function borrar(id) {
  items = items.filter((item) => item.id !== id);
  guardar();
  render();
}

function borrarCompletados() {
  // Solo borra los completados que se están viendo con el filtro actual
  items = items.filter(
    (item) => !(item.hecho && (filtro === "todos" || item.tipo === filtro))
  );
  guardar();
  render();
}

// ---------- Dibujar en pantalla ----------
function render() {
  // 1) Qué elementos se ven según el filtro
  const visibles = items.filter(
    (item) => filtro === "todos" || item.tipo === filtro
  );

  // 2) Los pendientes arriba y los hechos al final (sort es estable)
  visibles.sort((a, b) => Number(a.hecho) - Number(b.hecho));

  // 3) Limpiar y volver a construir la lista
  lista.replaceChildren();
  for (const item of visibles) {
    lista.appendChild(crearFila(item));
  }

  // 4) Textos de apoyo
  vacio.hidden = visibles.length > 0;
  btnLimpiar.hidden = !visibles.some((item) => item.hecho);

  const porHacer = items.filter((item) => !item.hecho).length;
  const hechos = items.length - porHacer;
  resumen.textContent =
    items.length === 0
      ? "Sin elementos todavía"
      : `${porHacer} por hacer · ${hechos} hechos`;

  // 5) Marcar el filtro activo
  for (const boton of filtros.querySelectorAll("button")) {
    boton.setAttribute("aria-pressed", boton.dataset.filtro === filtro);
  }
}

// Crea el <li> de un elemento.
// Usamos textContent (no innerHTML) para que lo que escribas
// nunca se interprete como código HTML.
function crearFila(item) {
  const li = document.createElement("li");
  li.className = "item" + (item.hecho ? " hecho" : "");
  li.dataset.tipo = item.tipo;
  li.dataset.id = item.id;

  const check = document.createElement("button");
  check.type = "button";
  check.className = "check";
  check.dataset.accion = "alternar";
  check.setAttribute("aria-label", item.hecho ? "Marcar como pendiente" : "Marcar como hecho");
  check.appendChild(document.createElement("span"));

  const contenido = document.createElement("div");
  contenido.className = "contenido";

  const texto = document.createElement("p");
  texto.className = "texto";
  texto.textContent = item.texto;

  const etiqueta = document.createElement("p");
  etiqueta.className = "etiqueta";
  etiqueta.textContent = NOMBRES_TIPO[item.tipo] || item.tipo;

  contenido.append(texto, etiqueta);

  const eliminar = document.createElement("button");
  eliminar.type = "button";
  eliminar.className = "borrar";
  eliminar.dataset.accion = "borrar";
  eliminar.setAttribute("aria-label", "Borrar " + item.texto);
  eliminar.textContent = "×";

  li.append(check, contenido, eliminar);
  return li;
}

// ---------- Eventos ----------
form.addEventListener("submit", (evento) => {
  evento.preventDefault(); // evita que la página se recargue
  const texto = inputTexto.value.trim();
  if (!texto) return;
  agregar(texto, selectTipo.value);
  inputTexto.value = "";
  inputTexto.focus();
});

// Un solo "oyente" para toda la lista (delegación de eventos):
// funciona también con los elementos que se crean después.
lista.addEventListener("click", (evento) => {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;
  const id = Number(boton.closest(".item").dataset.id);
  if (boton.dataset.accion === "alternar") alternarHecho(id);
  if (boton.dataset.accion === "borrar") borrar(id);
});

filtros.addEventListener("click", (evento) => {
  const boton = evento.target.closest("button[data-filtro]");
  if (!boton) return;
  filtro = boton.dataset.filtro;
  guardarFiltro();
  render();
});

btnLimpiar.addEventListener("click", borrarCompletados);

// ---------- Primer dibujo ----------
render();

// ---------- Service worker (para que funcione sin conexión) ----------
// Solo se activa con HTTPS o en localhost, no abriendo el archivo directo.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .catch((error) => console.error("Service worker falló:", error));
  });
}
