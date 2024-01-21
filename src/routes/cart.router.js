import { Router } from "express";
import CartManager from "../managers/CartManager.js";

const router = Router();
const manager = new CartManager();


//Endpoint POST para crear un carrito con una lista de productos
router.post('/', async (req, res) => {
    try {
        const { products } = req.body;

        if (!Array.isArray(products)) {
            return res.status(400).json({ error: 'La lista de productos es inválida' });
        }

        const createdCart = await manager.createCart(products);

        if (!createdCart) {
            return res.status(500).json({ error: 'Error al crear el carrito' });
        }

        return res.status(201).json(createdCart);
    } catch (error) {
        console.error('Error en la creación del carrito:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

//Endpoint DELETE para eliminar todos los productos del carrito
router.delete('/', async (req, res) => {
    try {
        const result = await manager.removeAllProductsFromCart();

        if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
        }

        res.json({ success: true, message: 'Todos los productos eliminados del carrito' });
    } catch (error) {
        console.error('Error al eliminar todos los productos del carrito:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

//Endpoint DELETE para eliminar un producto en particular del carrito por su ID
router.delete('/:_id', async (req, res) => {
    try {
        const productId = req.params._id;
        const result = await manager.removeProductFromCart(productId);

        if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
        }

        res.json({ success: true, message: `Producto ${productId} eliminado del carrito` });
    } catch (error) {
        console.error('Error al eliminar producto del carrito:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

//Endpoint PUT para actualizar la cantidad de un producto en el carrito por su ID
router.put('/:_id', async (req, res) => {
    try {
        const productId = req.params._id;
        const { quantity } = req.body;

        if (!quantity || isNaN(quantity)) {
            return res.status(400).json({ success: false, message: 'La cantidad debe ser un número válido' });
        }

        const result = await manager.updateProductQuantity(productId, Number(quantity));

        if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
        }

        res.json({ success: true, message: `Cantidad del producto ${productId} actualizada en el carrito` });
    } catch (error) {
        console.error('Error al actualizar cantidad del producto en el carrito:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

//Endpoint para actualizar el carrito con un arreglo de productos
router.put('/cart/:_id', async (req, res) => {
    try {
        const cartId = req.params._id;
        const { products } = req.body;

        // Verificar si el arreglo de productos es válido
        if (!Array.isArray(products)) {
            return res.status(400).json({ error: 'El formato del arreglo de productos es inválido' });
        }

        // Llamar al método para actualizar el carrito con el nuevo arreglo de productos
        const updatedCart = await manager.updateCart(cartId, products);

        if (!updatedCart) {
            return res.status(500).json({ error: 'Error al actualizar el carrito' });
        }

        return res.status(200).json(updatedCart);
    } catch (error) {
        console.error('Error al actualizar el carrito:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

//Endpoint GET para obtener los productos paginados de un carrito por su ID
router.get('/cart/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        let { page, limit } = req.query;

        // Establecer valores predeterminados si los parámetros no se proporcionan
        page = page || 1;
        limit = limit || 10;

        // Llamar al método en CartManager para obtener los productos paginados del carrito
        const result = await manager.getProductsInCartWithDetails(cid, page, limit);

        return res.json(result);
    } catch (error) {
        console.error('Error al obtener productos del carrito:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});


//Export
export default router;