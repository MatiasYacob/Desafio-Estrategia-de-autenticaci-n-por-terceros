import { Router } from "express";
import userModel from "../dao/models/user.model.js";
import { createHash, isValidPassword } from "../dirname.js";
import passport from "passport";


const router = Router();
//Passport GitHub
router.get('/github',passport.authenticate("github",{scope:['user:email']}),
async (req, res)=>{
    {}
})

router.get("/githubcallback", passport.authenticate('github',{failureRedirect:'/github/error'}),
    async(req, res)=>{
        const user = req.user;
        req.session.user={
            name: `${user.first_name} ${user.last_name}`,
            email: user.email,
            age: user.age
        };
        res.redirect("/users")
    }
)




//Passport local

//Register

router.post('/register', passport.authenticate('register', {
    failureRedirect: "api/session/fail-register"
}), async (req, res) => {
    console.log("Registrando usuario:");
    res.status(201).send({ status: "success", message: "Usuario creado con existo con ID"});
    res.redirect("/users")
})




//LogIn
router.post('/login', passport.authenticate('login', {
    failureRedirect: "api/session/fail-login"
}),
    async (req, res) => {

    const user = req.user;


    req.session.user = {
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        age: user.age,
        role: user.role,
    }
    res.send({ status: "success", payload: req.session.user, message: "!primer logueo realizado! :)" });

})


//Logout
router.post('/logout', (req, res) => {
    // Elimina la sesión del usuario
    req.session.destroy((err) => {
        if (err) {
            console.error("Error al desloguear:", err);
            return res.status(500).send({ status: "error", message: "Error al desloguear" });
        }
        res.send({ status: "success", message: "Sesión cerrada exitosamente" });
    });
});

//error 
 router.get("/fail-register", (req, res)=>{
    res.status(401).send({error:"fallo el registro"});
 });
 router.get("/fail-login", (req, res)=>{
    res.status(401).send({error:"fallo el logueo"});
 });



export default router;