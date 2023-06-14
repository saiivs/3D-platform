const jwtDecode=require('jwt-decode');
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
    }
}