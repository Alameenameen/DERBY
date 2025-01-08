
const mongoose = require("mongoose")
const {Schema} = mongoose;



const sizeQuantitySchema = new Schema({
    size: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    }
});

const productSchema = new Schema({
    productName:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: true
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref :"Category",
        required:true
    },
    regularPrice:{
        type:Number,
        required:true
    },
    salePrice:{
        type:Number,
        required:true
    },
    productOffer:{
        type:Number,
        default:0
    },
    quantity:{
        type:Number,
        default:0
    },
    color:{
        type:String,
        required:true
    },
    sizes: [sizeQuantitySchema],
    
    productImage:{
        type:[String],
        required:true
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    status:{
        type:String,
        enum:["Available","out of stock","inStock","Discountinued"],
        required:true,
        default:"Available"
    },
    
},{timestamps:true});

module.exports = mongoose.model("Product",productSchema)


