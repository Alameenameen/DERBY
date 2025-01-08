const Product = require("../../model/productSchema");
const Category = require("../../model/categorySchema");
const User = require("../../model/userSchema");
const Cart = require("../../model/cartSchema")




const calculateCartTotal = (cart) => {
    if (!cart || !cart.items || cart.items.length === 0) {
        return {
            subtotal: 0,
            shipping: 0,
            total: 0
        };
    }

    const subtotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);
    const shipping = subtotal > 0 ? 10 : 0; // Add shipping only if cart has items
    const total = subtotal + shipping;
    
    return { subtotal, shipping, total };
};

// Get Cart
const getCart = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user._id) {
            return res.redirect('/login');
        }

        const cart = await Cart.findOne({ userId: req.session.user._id })
        .populate({
            path: 'items.productId',
            select: 'productName productImage salePrice'
        });

        console.log("Cart details:", JSON.stringify(cart, null, 2));

            
        const totals = calculateCartTotal(cart);

        res.render('cart', { 
            cart, 
            totals,
            user: req.session.user 
        });
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).send("Error loading cart");
    }
};



const addToCart = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user._id) {
            return res.status(401).json({ error: "Please login to add items to cart" });
        }

        const userId = req.session.user._id;
        const { productId, quantity = 1 } = req.body;
        const quantityNum = parseInt(quantity);

        // Validate product existence
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        // console.log("Product fetched:", product);
        // Get the appropriate price
        const productPrice = product.salePrice || product.regularPrice;
        
        // Find or create cart
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({
                userId: userId,
                items: []
            });
        }

        // Find if product exists in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.productId && item.productId.toString() === productId.toString()
        );

        if (existingItemIndex > -1) {
            // Update existing item
            cart.items[existingItemIndex].quantity += quantityNum;
            cart.items[existingItemIndex].price = productPrice;
            cart.items[existingItemIndex].totalPrice = productPrice * cart.items[existingItemIndex].quantity;
        } else {
            // Add new item
            const newItem = {
                productId: productId,  // Make sure this is being set
                quantity: quantityNum,
                price: productPrice,
                totalPrice: productPrice * quantityNum
            };
            cart.items.push(newItem);
        }

        // Save the cart
        const savedCart = await cart.save();
        console.log("Saved cart:", savedCart); // Add this for debugging

        res.redirect('/cart');

    } catch (error) {
        console.error("Error adding to cart:", error);
        if (error.name === 'ValidationError') {
            console.error("Validation error details:", error.errors);
        }
        res.status(500).json({ error: "Internal Server Error" });
    }
};
// Update Cart
const updateCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.session.user._id;

        const cart = await Cart.findOne({ userId });
        const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId);

        if (itemIndex > -1) {
            // Fetch the product to get the price
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ error: "Product not found" });
            }

            // Get the appropriate price (salePrice or regularPrice)
            const productPrice = product.salePrice || product.regularPrice;
            
            cart.items[itemIndex].quantity = quantity;
            cart.items[itemIndex].totalPrice = productPrice * cart.items[itemIndex].quantity;
            await cart.save();
            // res.status(200).json({ message: "Cart updated" });
        } else {
            res.status(404).json({ error: "Item not found in cart" });
        }
        res.redirect('/cart');
    } catch (error) {
        console.error("Error updating cart:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Remove from Cart
const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user._id;

        const cart = await Cart.findOneAndUpdate(
            { userId },
            { $pull: { items: { productId } } },
            { new: true }
        );

        // res.status(200).json({ message: "Item removed from cart" });
        res.redirect('/cart');
    } catch (error) {
        console.error("Error removing from cart:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Clear Cart
const clearCart = async (req, res) => {
    try {
        const userId = req.session.user._id;

        await Cart.findOneAndUpdate({ userId }, { items: [] });
        res.status(200).json({ message: "Cart cleared" });
    } catch (error) {
        console.error("Error clearing cart:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCart,
    removeFromCart,
    clearCart,
};
