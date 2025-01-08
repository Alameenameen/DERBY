
const User = require("../model/userSchema");
 

const userAuth =(req,res,next)=>{
    if(req.session.user){
        User.findById(req.session.user)
        .then(data=>{
            if(data && !data.isBlocked){
                next();
            }else{
                res.redirect("/login");
            }
        })
        .catch(error=>{
            console.log("error in user auth middleware",error);
            res.status(500).send("Internal Server eroor")
            
        })
    }else{
        res.redirect("/login")
    }
}


// const adminAuth = (req,res,next)=>{
//     User.findOne({isAdmin:true})
//     .then(data=>{
//         if(data){
//             next();
//         }else{
//             res.redirect("/admin/login");
//         }
//         if (req.session.admin){
//             next(); // Session exists, proceed to the next middleware or route
//         } else {
//             res.redirect("/admin/login"); // No session, redirect to the login page
//         }
//     })
//     .catch(error=>{
//         console.log("Error in Admin auth middleware",error);
//         res.status(500).send("Internal Server error")
        
//     })
// }
const adminAuth = (req, res, next) => {
    if (req.session.admin) {
        next(); // Session exists, proceed to the next middleware or route
    } else {
        res.redirect("/admin/login"); // No session, redirect to the login page
    }
};




const checkSession = (req,res,next)=>{
    if(req.session.User){
        next()
    }else{
        res.redirect("login")
    }
}

const isLogin = (req,res,next)=>{
    if(req.session.user){
        res.redirect("/")
    }else{
        next()
    }
}



const noCache = (req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    next();
};

const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/login");
    }
};




module.exports = {
    userAuth,
    adminAuth,
    checkSession,
    isLogin,
    isAuthenticated,
    noCache
}