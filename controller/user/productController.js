 const Product = require("../../model/productSchema");
 const Category = require("../../model/categorySchema");
 const Brand = require("../../model/brandSchema");
 const User = require("../../model/userSchema");

 const productDetails = async (req, res) => {
    try {
        const userId = req.session.user;
         const userData = await User.findById(userId);
        const productId = req.query.id;

        // Fetch the current product and its category
        const product = await Product.findById(productId)
        .populate('category')
        .populate('brand');
        const findCategory = product.category;

      
        // Fetch related products based on the same category, excluding the current product
        const relatedProducts = await Product.find({
            category: findCategory._id,
            _id: { $ne: productId }, // Exclude the current product
        }).limit(4); 
        // console.log("related items:",relatedProducts)


        const allCategories = await Category.find({ isBlocked: false });
        const allBrands = await Brand.find({ isBlocked: false });

        res.render("productDetails", {
            user: userData,
            product: product,
            relatedProducts: relatedProducts, //  related products to the view
            quantity: product.quantity,
            category: findCategory,
            productId,
            allCategories,
            allBrands,
            sizes: product.sizes
        });

        
    } catch (error) {
        console.error("Error fetching product details", error);
        res.redirect("/pageNotFound");
    }
};



module.exports ={
    productDetails
}