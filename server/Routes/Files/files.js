const express=require('express')

const fileController=require('../../Controller/Files/files')

const router=express.Router();

router.get('/CustomFiles/:category/:fileName',fileController.getFile)





module.exports=router;