// Importación de módulos y archivos necesarios
import express from 'express';
import productRouter from './routes/product.router.js';
import cartRouter from './routes/cart.router.js';
import usersViewRouter from './routes/users.views.router.js';
import { Server } from 'socket.io';
import handlebars from 'express-handlebars';
import { __dirname } from './dirname.js';
import viewsRouter from './routes/views.routes.js';
import ProductManager from './managers/ProductManager.js';
import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';
import MessageManager from './managers/MessageManager.js';
import { initializeApp } from './appInitialization.js';
import Handlebars from "handlebars";
import { allowInsecurePrototypeAccess } from "@handlebars/allow-prototype-access";
import CartManager from './managers/CartManager.js';
import session from 'express-session';
import sessionRouter from './routes/sessions.router.js';
import passport from 'passport';
import initializePassport from '../src/config/passport.config.js';
import githubLoginViewRouter from './routes/githubLoginviewRouter.routes.js';


// Creación de la aplicación Express
const app = express();
const port = 8080;





// ****************************************************************************
// **************** Configuración de Express Session **************************
// ****************************************************************************

app.use(
  session({
    store: new MongoStore({
      mongoUrl: 'mongodb+srv://matiasyacob27m:1234567812@clusterdesafio15.qwijtbv.mongodb.net/ClusterDesafio15',
      mongoOptions: { useNewUrlParser: true, useUnifiedTopology: true },
      ttl: 10 * 60, // tiempo de vida de la sesión en segundos (10 minutos en este caso)
    }),
    secret: 'tu_secreto_aqui',
    resave: true,
    saveUninitialized: true,
  })
);

// ****************************************************************************
// **************** Fin de la Configuración de Express Session ****************
// ****************************************************************************

//Passport

initializePassport();
app.use(passport.initialize());
app.use(passport.session());




// Instancias de los managers
const cManager = new CartManager();
const pManager = new ProductManager(); // Instancia de ProductManager sin pasar un archivo JSON
const messageManager = new MessageManager();

// Configuración de Handlebars como motor de vistas
app.engine(
  "hbs",
  handlebars.engine({
    extname: "hbs",
    defaultLayout: "main",
    handlebars: allowInsecurePrototypeAccess(Handlebars),
  })
);
app.use(express.static(__dirname + '/public'))

// Creación del servidor HTTP y Socket.IO
const httpServer = app.listen(port, () =>
  console.log(`Servidor Express corriendo en el puerto ${port}`)
);
const io = new Server(httpServer); 



//IMPORTANTE!! IMPORTANTE!! IMPORTANTE!! IMPORTANTE!!
// Conexión a la base de datos MongoDB a través de Mongoose
mongoose.connect('mongodb+srv://matiasyacob27m:1234567812@clusterdesafio15.qwijtbv.mongodb.net/ClusterDesafio15')
  .then(() => console.log('DB connected'))
  .catch((err) => {
    console.log('Hubo un error');
    console.log(err);
  });





// Inicialización de la aplicación y configuraciones
initializeApp(app, __dirname);

// Definición de rutas para la API y las vistas
app.use('/api/product', productRouter);
app.use('/api/carts', cartRouter);
app.use('/', viewsRouter);
app.use('/api/sessions', sessionRouter);
app.use('/users',usersViewRouter);
app.use('/github', githubLoginViewRouter)

// Manejo de eventos de conexión y operaciones relacionadas con Socket.IO
io.on('connection', async (socket) => {
  console.log('Nuevo cliente conectado');

  try {
    // Emitir los productos al cliente cuando se conecta
    socket.emit('productos', await pManager.getProducts()); 
    socket.emit('cart_productos', await cManager.getProductsInCart());

    // Manejo de eventos de agregar producto al carrito y eliminar producto del carrito
    socket.on('AddProduct_toCart', async (_id) => {
      try {
        console.log("id del producto" + _id);
        const addProduct = await cManager.AddProductToCart(_id);
        if (addProduct) {
          console.log('Producto agregado al carrito:', addProduct);
        } else {
          console.log('El producto no pudo ser agregado al carrito.');
        }
      } catch (error) {
        console.error('Error al agregar el producto:', error);
      }
    });

    socket.on('Borrar_delCarrito', async (_id) => {
      try {
        console.log("id del producto" + _id);
        const productoBorrado = await cManager.removeProductFromCart(_id);

        if (productoBorrado) {
          console.log("Producto borrado:", productoBorrado);
        } else {
          console.log('El producto no pudo ser borrado del carrito');
        }
      } catch (error) {
        console.error('error al borrar', error)
      }
    });

    // Manejo de eventos de eliminación y creación de productos
    socket.on('delete_product', async (_id) => {
      try {
        const deletedProduct = await pManager.deleteProduct(_id);
        if (deletedProduct) {
          console.log('Producto eliminado:', deletedProduct);
          socket.emit('productos', await pManager.getProducts());
        } else {
          console.log('El producto no existe o no se pudo eliminar.');
        }
      } catch (error) {
        console.error('Error al eliminar el producto:', error);
      }
    });

    socket.on('post_send', async (data) => {
      try {
        const product = {
          price: Number(data.price),
          stock: Number(data.stock),
          title: data.title,
          description: data.description,
          code: data.code,
          thumbnails: data.thumbnails,
        };

        await pManager.addProduct(product);
        socket.emit('productos', await pManager.getProducts());
      } catch (error) {
        console.log(error);
      }
    });

    // Manejo de mensajes con Socket.IO
    const messages = [];
    socket.on('message', async (data) => {
      messages.push(data);
      io.emit('messages', messages);
      try {
        await messageManager.addMessage(data);
        console.log('Mensaje guardado en la base de datos.');
      } catch (error) {
        console.error('Error al guardar el mensaje:', error);
      }
    });

    socket.on('newUser', (username) => {
      socket.broadcast.emit('userConnected', username);
    });

    socket.emit('messages', messages);
  } catch (error) {
    console.error(error);
  }
});








// Exportar la aplicación Express
export default app;