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
    this.backEndService.userLogin(this.reactiveForm.value).subscribe((response)=>{
      console.log(response);

        if(response.token){
          console.log("enter");

         this.resData = response;
         localStorage.setItem("userToken",this.resData.token)
         localStorage.setItem("userEmail",this.resData.userEmail)
         localStorage.setItem("userRole",this.resData.userRole)
         localStorage.setItem("rollNo",this.resData.rollNo)

         if(localStorage.getItem("userRole")=="admin"){
          this.router.navigate(['admin'])
         }else if(localStorage.getItem("userRole")=="3D"){
          this.router.navigate(['modeler'])
         }else if(localStorage.getItem("userRole")=="QA"){
            this.router.navigate(['QA'])
         }

        }else if(response.password){
          console.log("wrong pass");

          this.wrongPass = "Incorrect Password"
        }else {
          console.log("user dont exist");

          this.wrongPass = "User Dont Exist"
        }
    },(err)=>{
      this.router.navigate(['pageNotFound'])
    })
  }

}
