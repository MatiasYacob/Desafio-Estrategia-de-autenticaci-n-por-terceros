

// Conexión al servidor de Socket.IO
const socket = io();

// Manejo del evento cuando el DOM está completamente cargado
document.addEventListener("DOMContentLoaded", () => {
  // Captura del formulario y escucha del evento de envío
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      // Obtención de datos del formulario
      const formData = new FormData(form);

      // Creación de un objeto con los datos del producto
      const post = {
        title: formData.get("title"),
        description: formData.get("description"),
        price: formData.get("price"),
        thumbnails: formData.get("thumbnails"),
        code: formData.get("code"),
        stock: formData.get("stock"),
      }

      // Emitir el evento al servidor con los datos del producto a enviar
      socket.emit("post_send", post);
    });
  }
});

// Manejo de la recepción de datos de productos desde el servidor y actualización de la interfaz
socket.on("productos", (data) => {
  const products = document.querySelector("#products");
  products.innerHTML = "";

  // Iterando sobre los productos recibidos para mostrarlos en la interfaz
  data.forEach((producto) => {
      const productElement = document.createElement("div");
      productElement.classList.add("card", "m-2", "col-md-4", "bg-light", "border", "border-primary");
      productElement.innerHTML = `
          <div class="card-body">
              <h5 class="card-title">${producto.title}</h5>
              <p class="card-text">Descripción: ${producto.description}</p>
              <p class="card-text">Precio: $${producto.price}</p>
              <p class="card-text">Código: ${producto.code}</p>
              <p class="card-text">Stock: ${producto.stock}</p>
              <p class="card-text">Fotos: ${producto.thumbnails}</p>
              <p class="card-text">Status: ${producto.status}</p>
              <p class="card-text">ID: ${producto._id}</p>
              <button class="btn btn-danger" onclick="deleteProduct('${producto._id}')">Eliminar</button>
          </div>
      `;
      products.appendChild(productElement);
  });


 
});




// Iterando sobre los productos recibidos para mostrarlos en la interfaz del carrito

socket.on("cart_productos", (data) => {

  const products = document.querySelector("#products_carrito");
  products.innerHTML = "";
  data.forEach((producto) => {
    const productElement = document.createElement("div");
    productElement.classList.add("card", "m-2", "col-md-4", "bg-light", "border", "border-primary"); // Clases de Bootstrap para el estilo
    productElement.innerHTML = `
      <div class="card-body">
        <p class="card-text">Cantidad: ${producto.quantity}</p>
        <p class="card-text">ID: ${producto._id}</p>
        <button class="btn btn-danger" onclick="removeProductFromCart('${producto._id}')">Eliminar</button>
      </div>
    `;
    products.appendChild(productElement);
  });


})



// Función para eliminar un producto y recargar la página después de la eliminación
function deleteAndReload(productId) {
  deleteProduct(productId); // Función para eliminar el producto, puede ser tu función deleteProduct existente

  // Después de eliminar el producto, recargar la página
  reloadPage();
}

// Función para recargar la página
function reloadPage() {
  location.reload();
}





// Función para eliminar un producto
function deleteProduct(_id) {
  socket.emit("delete_product", _id);
}





// Función para agregar un producto al carrito
function AddProductToCart(_id) {
  socket.emit("AddProduct_toCart", _id)
  Swal.fire({
    position: 'top-end',
    icon: 'success',
    title: '¡Producto Agregado!',
    showConfirmButton: false,
    timer: 1500,
    toast: true,
  });
}

//Funcion para borrar productos del carrito
function removeProductFromCart(_id) {
  socket.emit("Borrar_delCarrito", _id)
  reloadPage()


}




// Manejo de errores en la conexión con el servidor
socket.on("connect_error", (error) => {
  console.error("Error de conexión con el servidor:", error);
});


// Lógica del Chat

let user; // Variable para almacenar el nombre del usuario
let askingForName = true; // Controla si se está solicitando el nombre del usuario

// Función para desplazarse hacia abajo en la ventana del chat
function scrollToBottom() {
  const chatMessages = document.getElementById("chat-messages");
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Función para solicitar el nombre del usuario y enviar mensajes
function askForNameAndSendMessage(message) {
  // Ventana emergente para solicitar el nombre del usuario
  Swal.fire({
    title: "Hola",
    text: "Ingresa tu nombre para continuar",
    input: "text",
    inputValidator: (value) => {
      return !value && "¡Ingresa tu nombre!";
    },
    allowOutsideClick: false,
  }).then((value) => {
    user = value.value; // Almacena el nombre del usuario
    socket.emit("newUser", user); // Emite el evento con el nuevo usuario al servidor
    askingForName = false; // Cambia el estado para no solicitar más el nombre

    // Si hay un mensaje y el usuario ya está identificado, envía el mensaje al servidor
    if (message.trim() !== "") {
      socket.emit("message", {
        user,
        message,
      });
    }
  });
}

; // Llama al inicio para solicitar el nombre del usuario

// Captura del cuadro de chat y escucha del evento de tecla "Enter"
const chatbox = document.getElementById("chatbox");
chatbox.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    const message = e.target.value;
    // Si el usuario no está identificado y no se está solicitando el nombre, lo solicita
    if (user === undefined && !askingForName) {
      askForNameAndSendMessage(message);
      chatbox.value = "";
    } else {
      // Si hay un mensaje y el usuario está identificado, lo envía al servidor
      if (message.trim() !== "") {
        socket.emit("message", {
          user,
          message,
        });
        chatbox.value = "";
      }
    }
  }
});



// Notificación de nuevo usuario conectado
socket.on("userConnected", (username) => {
  if (user !== undefined && !askingForName) {
    // Muestra una notificación cuando un nuevo usuario se conecta al chat
    Swal.fire({
      position: "top-right",
      toast: true,
      title: "Nuevo usuario",
      text: `${username} se ha conectado al chat`,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", () => {
          Swal.stopTimer();
        });
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });
  }
});

// Actualización de mensajes en la ventana del chat
socket.on("messages", (data) => {
  const log = document.querySelector("#messages");
  let messages = "";

  // Construye los mensajes con su formato y los muestra en la ventana del chat
  data.forEach((message) => {
    messages += `<strong>${message.user}</strong>: ${message.message} <br/>`;
  });

  log.innerHTML = messages; // Actualiza la ventana del chat con los nuevos mensajes
  scrollToBottom(); // Desplaza hacia abajo para mostrar los últimos mensajes
});
