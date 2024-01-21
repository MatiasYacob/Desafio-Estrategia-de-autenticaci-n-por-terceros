import passport from "passport";
import passportLocal from "passport-local";
import userModel from "../dao/models/user.model.js";
import { createHash, isValidPassword } from "../dirname.js";
import GitHubStrategy from 'passport-github2';
import handlebars from "handlebars";

//Estrategia

const localStrategy = passportLocal.Strategy;


const initializePassport = () => {

    //Estrategia login con git hub
    passport.use('github', new GitHubStrategy(
        {
           clientID:"Iv1.935bc7f37149d5ab",
           clientSecret:"b31f586dd8add253eefff6f8daf990200ee0248e",
           ccallbackURL: "http://localhost:8080/api/sessions/githubcallback",


        },
        async(accessToken, refreshToken, profile, done)=>{
            console.log("profile del Usuario de GitHub");
            console.log(profile);
            try{
                const user = await userModel.findOne({email: profile._json.email})
                console.log("usuario econtrado para login:");
                console.log(user);
                if(!user){
                    console.warn("User does not exist whit username:" + profile._json.email);
                    let newUser ={
                        first_name: profile._json.name,
                        last_name:'',
                        age: 28,
                        email: profile._json.email,
                        password: '',
                        loggedBy: "GitHub",
                        role:'usuario',
                    }
                    const result = await userModel.create(newUser);
                    return done(null, result)
                }else{
                    //si entramos por aca significa que el user ya existe
                    return done(null, user)

                }


            }catch(error){
                return done(error)
            }

        }

    ))





    //Register normal
    passport.use('register', new localStrategy(
        {
            passReqToCallback: true,
            usernameField: 'email'
        },
        async(req, username, password, done) => {

            const {first_name, last_name, email, age} = req.body;

            try{
                const exist = await userModel.findOne({ email });
                if(exist){
                    console.log("El usuario ya existe");
                    done(null,false);
                    }

                    const user = {
                        first_name, 
                        last_name, 
                        email, 
                        age, 
                        //se encripta despues
                        password: createHash(password)
                    }
                    const result = await userModel.create(user);
                    //todo ok
                    return done(null, result)
            }catch(error){
                return done("error registrando usuario"+error)
            }

        }

    ))

    //Estrategia login
    passport.use('login', new localStrategy(
        {
            passReqToCallback: true,
            usernameField: 'email'
        },
        async(req, username, password, done) =>{

            try{
                const user = await userModel.findOne({ email: username });
                if(!user){
                    console.warn("No exite el usuario: "+ username);
                    return done(null,false);
                }
                //validar Credenciales
                if(!isValidPassword(user, password)){
                    console.warn("Credenciales Invalidas");
                    return done(null,false);
                }
                return done(null, user)

            }catch(error){
                return done("Error de login "+error)

            }


        }

    ))

    
        //Funciones de Serializacion y Desserializacion

        passport.serializeUser((user,done)=>{
            done(null,user._id)
        });

        passport.deserializeUser(async (id,done)=>{

            try{
                let user = await userModel.findById(id)

                done(null,user)

            }catch(error){
                console.error("Error Deserializando el usuario"+error);
            };

            
        })


}


export default initializePassport;