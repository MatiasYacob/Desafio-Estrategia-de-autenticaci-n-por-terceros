
//Imports
import { Router } from "express";
import ProductManager from '../managers/ProductManager.js';



//Constantes Globales
const manager = new ProductManager();
const router = Router();


//Muestra todo los Productos en de la BD de mongo
router.get('/', async (req, res) => {
    try {
        const { limit = 10, page = 1, sort, query } = req.query;
        let productsToSend = await manager.getProducts(); // Obtener todos los productos

        // Aplicar el filtro según el parámetro 'query' (nombre del producto)
        if (query) {
            productsToSend = productsToSend.filter(product =>
                product.title.toLowerCase().includes(query.toLowerCase())
            );
        }

        // Aplicar ordenamiento ascendente o descendente según el parámetro 'sort'
        if (sort && (sort === 'asc' || sort === 'desc')) {
            productsToSend.sort((a, b) => {
                if (sort === 'asc') {
                    return a.price - b.price;
                } else {
                    return b.price - a.price;
                }
            });
        }

        // Calcular el total de páginas
        const totalPages = Math.ceil(productsToSend.length / limit);

        // Calcular el índice de inicio y final para la paginación
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        // Obtener los productos para la página específica después del filtrado y ordenamiento
        const paginatedProducts = productsToSend.slice(startIndex, endIndex);

        // Crear el objeto de respuesta con información de paginación
        const responseObject = {
            status: 'success',
            payload: paginatedProducts,
            totalPages: totalPages,
            prevPage: page > 1 ? page - 1 : null,
            nextPage: page < totalPages ? page + 1 : null,
            page: page,
            hasPrevPage: page > 1,
            hasNextPage: page < totalPages,
            prevLink: page > 1 ? `/api/product?limit=${limit}&page=${page - 1}` : null,
            nextLink: page < totalPages ? `/api/product?limit=${limit}&page=${page + 1}` : null,
        };

        res.json(responseObject);
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({ status: 'error', error: 'Error al obtener los productos' });
    }
});

//Muestra un producto por _id GET
router.get('/:_id', async (req, res) => {
    try {
        const product_id = req.params._id; // Mantén la _id como string
        const product = await manager.getProductBy_id(product_id);

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener el producto por _id:', error);
        res.status(500).json({ error: 'Error al obtener el producto por _id' });
    }
});
//Crear un producto nuevo con Post
router.post('/', async (req, res) => {
    try {
        const { title, description, price, thumbnails, code, stock, status } = req.body;

        // Crea un nuevo objeto con la data del body
        const newProduct = {
            title,
            description,
            price: Number(price), 
            thumbnails: Array.isArray(thumbnails) ? thumbnails : [thumbnails],
            code,
            stock: Number(stock), 
            status: status || true // Si no se provee status, se establece como true por defecto
        };

        // Usa el método addProduct del ProductManager para agregar el producto
        const product = await manager.addProduct(newProduct);

        if (product) {
            res.status(201).json(product); // Producto agregado exitosamente
        } else {
            res.status(500).json({ error: 'Error al agregar el producto' }); // Hubo un error al agregar el producto
        }
    } catch (error) {
        console.error('Error al agregar el producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

//Actualizar un producto con PUT
router.put('/:id', async (req, res) => {
    const productId = req.params.id;
    const updatedFields = req.body; // Los campos actualizados estarán en req.body

    try {
        const updatedProduct = await manager.updateProduct(productId, updatedFields);
        if (!updatedProduct) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error('Error al actualizar el producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});






export default router;