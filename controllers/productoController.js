const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');


exports.crear = async(req,res) =>{
    try{
        let producto;

        //guardamos un usuario en la BD
        producto = new Producto(req.body);

        await producto.save();
        //res.json({mensaje: 'Usuario Creado correctamente'});
        res.send(producto);
    }catch(error){
        console.log(error);
        res.status(500).send('Error al guardar el producto');
    }
}

//Transaccion: Agregar producto 
exports.agregarProducto = async(req, res) => {
    
    const session = await mongoose.startSession();

    const transactionOptions = {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' }
    };

    try {
        
        const transactionResults = await session.withTransaction(
        async () => {

            const {descripcion,precio,categoria,unidadmedida} = req.body;
            const id_usuario = req.userId;

            const producto = new Producto();
            producto.descripcion = descripcion;
            producto.precio = precio;
            producto.categoria = categoria;
            producto.unidadMedida = unidadmedida;

            await producto.save({ session });

            let idproducto = await Producto.findOne({descripcion: descripcion},null,{session});

            let isusuario = await Usuario.findOne(
                { _id: id_usuario},
                null,
                {session}
            );

            if(!isusuario){
                res.status(404).json({mensaje: 'usuario no entontrado'});
                await session.abortTransaction();
                return;
            }

            isusuario = await Usuario.updateOne(
                {_id: id_usuario},
                { $addToSet: { produc: { _id: idproducto.id ,descripcion: idproducto.descripcion} }
                },
                { session }
            );

        },transactionOptions);
    
        if (transactionResults) {
            console.log("successfully created.");
            //res.json({mensaje: 'producto agregado correctamente'});
            res.json({mensaje: "agregado"});
        } else {
            console.log("transaccion abortada.");
            res.status(500).json({mensaje: err});
        }
    } catch (err) {
        res.status(500).json({mensaje: err});
        console.log("transacción abortada"+err);
    }
    finally {
        await session.endSession();
    }
}