const passport = require('passport');
const Usuarios = require('../models/Usuarios');
const Sequelize = require('sequelize');
const Op = Sequelize.Op
const crypto = require('crypto');
const bcrypt = require('bcrypt-nodejs');
const enviarEmail = require('../handlers/email');

//autentificar el usuario
exports.autenticarUsuario = passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/iniciar-sesion',
    failureFlash: true,
    badRequestMessage: 'Ambos campos son Obligatorios'
});

//funcion para revisar si el usuario esta logueado o no
exports.usuarioAutenticado = (req, res, next) => {

    //si el usuario esta autentificado, adelante
    if (req.isAuthenticated()) {
        return next();
    }
    //sino esta autentificado, redirigir al formulario
    return res.redirect('/iniciar-sesion');
}

//cierra la session
exports.cerrarSesion = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/iniciar-sesion');
    })
}

//crear token si el usuario es valido
exports.enviarToken = async (req, res) => {
     // verificar que el usuario existe
     const {email} = req.body
     const usuario = await Usuarios.findOne({where: { email }});
 
     // Si no existe el usuario
     if(!usuario) {
         req.flash('error', 'No existe esa cuenta');
         res.redirect('/reestablecer');
     }
 
     // usuario existe
     usuario.token = crypto.randomBytes(20).toString('hex');
     usuario.expiration = Date.now() + 3600000;
 
     // guardarlos en la base de datos
     await usuario.save();
 
     // url de reset
     const resetUrl = `http://${req.headers.host}/restablecer/${usuario.token}`;
 
     // Enviar el Correo con el Token
 
     await enviarEmail.enviar({
         usuario,
         subject: 'Password Reset', 
         resetUrl, 
         archivo : 'restablecer-password'
     });
 
     // terminar
     req.flash('correcto', 'Se envió un mensaje a tu correo');
     res.redirect('/iniciar-sesion');

}

exports.validarToken = async (req, res) => {
    const usuario = await Usuarios.findOne({
        where: {
            token: req.params.token
        }
    });

    // sino encuentra el usuario
    if(!usuario) {
        req.flash('error', 'No Válido');
        res.redirect('/restablecer');
    }

    // Formulario para generar el password
    res.render('resetPassword', {
        nombrePagina : 'Restablecer Contraseña'
    })
}

// cambia el password por uno nuevo
exports.actualizarPassword = async (req, res) => {

    // Verifica el token valido pero también la fecha de expiración
    const usuario = await Usuarios.findOne({
        where: {
            token: req.params.token,
            expiration: {
                [Op.gte] : Date.now()
            }
        }
    });

    // verificamos si el usuario existe
    if(!usuario) {
        req.flash('error', 'No Válido');
        res.redirect('/restablecer');
    }

    // hashear el nuevo password

    
    usuario.token = null;
    usuario.expiration = null;
    usuario.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10) );
    
    // guardamos el nuevo password
    await usuario.save();

    req.flash('correcto', 'Tu password se ha modificado correctamente');
    res.redirect('/iniciar-sesion');

}