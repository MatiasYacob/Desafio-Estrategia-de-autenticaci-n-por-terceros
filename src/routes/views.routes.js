//Imports de paquetes y modelos
import { Router } from "express";
import { Product } from "../dao/models/product.model.js";
import { Cart } from "../dao/models/cart.model.js";

// Creación de un enrutador
const router = Router();

// Ruta para renderizar la página de inicio
router.get("/", (req, res) => {
    res.render("home.hbs");
});

// Ruta para renderizar la página de productos en tiempo real
router.get("/realtimeproducts", (req, res) => {
    res.render("product.hbs");
});

// Ruta para renderizar la página de chat
router.get("/chat", (req, res) => {
    res.render("chat.hbs");
});

// Ruta para obtener y renderizar los productos en el carrito
router.get("/cart", async (req, res) => {
    const { page, limit } = req.query;

    try {
        const cartResult = await Cart.paginate({}, {
            page: page || 1,
            limit: limit || 10,
        });

        const cart_productos = cartResult.docs; // Obtener solo los documentos

        console.log("Productos del carrito:", cart_productos);
        res.render("cart", {
            cart_productos
        });
    } catch (error) {
        console.error("Error al obtener productos del carrito:", error);
        res.status(500).send("Error al obtener productos del carrito");
    }
});

// Ruta para obtener y renderizar la lista de productos paginados
router.get("/products", async (req, res) => {
    const { page, limit } = req.query;
    
    const productos = await Product.paginate({}, {
        page: page || 1,
        limit: limit || 10,
    });

    res.render("productos", {
        productos,
        user: req.session.user
    });
});

//**********Rutas De Session***********//

router.get('/session',(req, res)=> {
    if(req.session.counter){
        req.session.counter++
        res.send(`se ha visitado este sitio: ${req.session.counter} veces.`)
    }else{
            req.session.counter = 1
            res.send('Bienvenido!!')
    }
});

//log out

router.get('/logout',(req, res)=>{
    req.session.destroy(error=>{
        if(error){
            res.json({error:"error logout", msg:"Error al cerrar la session"})
        }
        res.send('Session cerrada correctamente!')
    })
})



export default router;
