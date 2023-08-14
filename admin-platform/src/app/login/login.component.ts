import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup , Validators } from '@angular/forms';
import { BackendService } from '../services/backend.service';
import { userRes } from '../models/interface';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  title:string="Login-Page"
  reactiveForm!:FormGroup;
  resData!:userRes
  wrongPass:string =""
  isLoading:Boolean = false;

  constructor(private backEndService:BackendService,private router:Router,private titleService:Title){

  }

  ngOnInit(){
    this.titleService.setTitle(this.title)
    this.reactiveForm = new FormGroup({
      email:new FormControl(null, [Validators.required,Validators.email]),
      password:new FormControl(null, Validators.required)
    })
  }

  formSubmit(){
    this.isLoading = true;
    this.backEndService.userLogin(this.reactiveForm.value).subscribe((response)=>{
        if(response.token){
         this.resData = response;
         localStorage.setItem("userToken",this.resData.token)
         localStorage.setItem("userEmail",this.resData.userEmail)
         localStorage.setItem("userRole",this.resData.userRole)
         localStorage.setItem("rollNo",this.resData.rollNo);
         localStorage.setItem("userName",this.resData.userName)

         if(localStorage.getItem("userRole")=="admin"){
          this.router.navigate(['admin'])
         }else if(localStorage.getItem("userRole")=="3D"){
          this.router.navigate(['modeler'])
         }else if(localStorage.getItem("userRole")=="QA"){
            this.router.navigate(['QA'])
         }
        }else if(response.password){
          this.isLoading = false;
          console.log("wrong pass");
          this.wrongPass = "Incorrect Password"
        }else {
          this.isLoading = false;
          console.log("user dont exist");
          this.wrongPass = "User Dont Exist"
        }
    },(err)=>{
      console.log(err);
      this.router.navigate(['pageNotFound'])
    })
  }

}
