const jwtDecode=require('jwt-decode');
const multer = require('multer');
const jwt= require('jsonwebtoken');

module.exports = {
    authentication:(req,res,next)=>{
        try {
            let accToken = req.headers['authorise'];
        if(accToken == null){
            console.log("Invalid user token");
            return res.status(401).json({invalidToken:true});
        }else{
            jwt.verify(accToken,process.env.ACC_TOKEN_SECRET,(err,data)=>{
                if(err){
                    console.log("Invalid user token");
                    return res.status(403).json({invalidToken:true});
                }else{
                    let userData = jwtDecode(accToken);
                    let userEmail = userData.email;
                    req.userEmail = userEmail;
                    next()
                }
            })
            
        }
        } catch (error) {
            console.log(error);
        }
        
    },

    savePdfFile:(req,res,next)=>{
        try {
            console.log("asdfasdf");
            console.log(req);
            const storage = multer.diskStorage({
                destination: function (req, file, cb) {
                  cb(null, 'uploads'); // Specify the destination directory
                },
                filename: function (req, file, cb) {
                  cb(null, file.originalname); // Keep the original filename
                }
              });
              const upload = multer({ storage: storage , limits: {
                fileSize: 10 * 1024 * 1024 // 10 MB in bytes
              }});
              upload.single('pdfFile'),
        next()
        } catch (error) {
            console.log(error);
        }
        
    }
}