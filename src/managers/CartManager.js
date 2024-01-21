import { Cart } from "../dao/models/cart.model.js";
import { Product } from "../dao/models/product.model.js";
import ProductManager from "./ProductManager.js";
import Swal from "sweetalert2";
import mongoose from "mongoose";
const { Types: { ObjectId } } = mongoose;
const Pmanager = new ProductManager();


//Clase CartManager para la manipulacion del carrito

class CartManager {

    async getProductsInCart() {
        try {
            // Buscar el carrito existente
            const cart = await Cart.findOne({});

            if (!cart) {
                console.log('No se encontró un carrito.');
                return [];
            }

            // Devolver la lista de productos en el carrito
            return cart.products;
            console.log(cart.products);
        } catch (error) {
            console.error('Error al obtener productos del carrito:', error);
            return null;
        }
    }
    //borrar producto
    async removeProductFromCart(_id) {
        try {
            // Encontrar el carrito existente
            const cart = await Cart.findOne({});

            if (!cart) {
                return { success: false, message: 'No se encontró un carrito' };
            }

            // Verificar si el producto está en el carrito
            const productIndex = cart.products.findIndex(product => String(product._id) === String(_id));

            if (productIndex === -1) {
                return { success: false, message: 'El producto no está en el carrito' };
            }

            // Eliminar el producto del carrito
            cart.products.splice(productIndex, 1);
            await cart.save();

            console.log(`Producto ${_id} eliminado del carrito exitosamente.`);
            return { success: true, message: `Producto ${_id} eliminado del carrito` };
        } catch (error) {
            console.error('Error al eliminar producto del carrito:', error);
            return { success: false, message: 'Error interno del servidor' };
        }
    }

    //Borrar todos los productos del carrito

    async removeAllProductsFromCart() {
        try {
            // Encontrar el carrito existente
            const cart = await Cart.findOne({});

            if (!cart) {
                return { success: false, message: 'No se encontró un carrito' };
            }

            // Limpiar todos los productos del carrito
            cart.products = [];
            await cart.save();

            console.log('Todos los productos eliminados del carrito exitosamente.');
            return { success: true, message: 'Todos los productos eliminados del carrito' };
        } catch (error) {
            console.error('Error al eliminar todos los productos del carrito:', error);
            return { success: false, message: 'Error interno del servidor' };
        }
    }
    //Actualizar la cantidad de un producto
    async updateProductQuantity(_id, quantity) {
        try {
            const cart = await Cart.findOne({});

            if (!cart) {
                return { success: false, message: 'No se encontró un carrito' };
            }

            const productToUpdate = cart.products.find(product => String(product._id) === String(_id));

            if (!productToUpdate) {
                return { success: false, message: 'El producto no está en el carrito' };
            }

            productToUpdate.quantity = quantity;
            await cart.save();

            console.log(`Cantidad del producto ${_id} actualizada en el carrito exitosamente.`);
            return { success: true };
        } catch (error) {
            console.error('Error al actualizar cantidad del producto en el carrito:', error);
            return { success: false, message: 'Error interno del servidor' };
        }
    }
    //Update cart
    async updateCart(cartId, newProducts) {
        try {
            const cart = await Cart.findById(cartId);

            if (!cart) {
                return null;
            }

            const updatedProducts = newProducts.map(product => ({
                productId: new mongoose.Types.ObjectId(product.id), // Usa mongoose.Types.ObjectId
                quantity: product.quantity
            }));

            cart.products = updatedProducts;

            await cart.save();

            console.log(`Carrito ${cartId} actualizado exitosamente.`);
            return cart;
        } catch (error) {
            console.error('Error al actualizar el carrito:', error);
            return null;
        }
    }


    
    //Cart Polulate
    async getProductsInCartWithDetails(cartId, page, limit) {
        try {
            const options = {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                populate: {
                    path: 'products.productId', // Path para hacer populate con los productos
                    model: 'Product',
                }
            };

            const result = await Cart.paginate({ _id: cartId }, options);

            if (!result) {
                return {
                    status: 'error',
                    payload: [],
                    totalPages: 0,
                    prevPage: null,
                    nextPage: null,
                    page: 0,
                    hasPrevPage: false,
                    hasNextPage: false,
                    prevLink: null,
                    nextLink: null
                };
            }

            // Modificar el resultado para eliminar el campo productId
            const modifiedDocs = result.docs.map(doc => ({
                ...doc.toObject(),
                products: doc.products.map(product => ({
                    _id: product._id,
                    quantity: product.quantity
                }))
            }));

            const { totalPages, prevPage, nextPage, page: _page, hasPrevPage, hasNextPage } = result;

            const prevLink = hasPrevPage ? `/cart/${cartId}?page=${prevPage}` : null;
            const nextLink = hasNextPage ? `/cart/${cartId}?page=${nextPage}` : null;

            return {
                status: 'success',
                payload: modifiedDocs,
                totalPages,
                prevPage,
                nextPage,
                page: _page,
                hasPrevPage,
                hasNextPage,
                prevLink,
                nextLink
            };
        } catch (error) {
            console.error('Error al obtener productos del carrito:', error);
            return {
                status: 'error',
                payload: [],
                totalPages: 0,
                prevPage: null,
                nextPage: null,
                page: 0,
                hasPrevPage: false,
                hasNextPage: false,
                prevLink: null,
                nextLink: null
            };
        }
    }

    //Agregar un producto al carrito
    async AddProductToCart(_id) {
        try {
            // Obtener el producto con la ID proporcionada
            const productToAdd = await Pmanager.getProductBy_id(_id);
            console.log(_id);
            if (!productToAdd) {
                return { success: false, message: `El producto ${_id} no existe` };
            }

            // Buscar un carrito existente
            let cart = await Cart.findOne({});

            if (!cart) {
                // Si no hay un carrito existente, crea uno nuevo con el producto
                const newCart = new Cart({
                    products: [{ productId: _id, quantity: 1 }],
                    totalPrice: productToAdd.price,
                });

                await newCart.save();
                console.log('Nuevo carrito creado exitosamente con un producto.');
                return newCart;
            }






            // Si existe un carrito, verifica si el producto ya está en el carrito
            const existingProduct = cart.products.find(item => String(item.productId) === String(_id));
            console.log("aca" + cart.products);

            if (existingProduct) {
                existingProduct.quantity += 1;
            } else {
                // Si el producto no está en el carrito, agrégalo
                cart.products.push({ productId: _id, quantity: 1 });
            }

            await cart.save();
            console.log(`Producto ${_id} agregado al carrito exitosamente.`);

            return cart;
        } catch (error) {
            console.error('Error al agregar producto al carrito:', error);
            return { success: false, message: 'Error interno del servidor' };
        }
    }
}

export default CartManager;
