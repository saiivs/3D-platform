import { Component, OnInit ,Inject, OnDestroy} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BackendService } from 'src/app/services/backend.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-bank-form',
  templateUrl: './bank-form.component.html',
  styleUrls: ['./bank-form.component.css']
})
export class BankFormComponent implements OnInit,OnDestroy{

  constructor(private backEnd:BackendService,@Inject(MAT_DIALOG_DATA) public data: any,private router:Router){

  }

  reactiveForm!:FormGroup;
  error:string = "";
  subscription!:Subscription
  
  ngOnInit(){   
    this.reactiveForm = new FormGroup({
      accountHolderName: new FormControl(null,Validators.required),
      bankName: new FormControl(null , Validators.required),
      accountNumber: new FormControl(null, Validators.required),
      swiftCode: new FormControl(null,Validators.required),
    })
  }

  formSubmit(){
    console.log("submitttedddddddd");
    
    this.subscription = this.backEnd.getBankDetails(this.reactiveForm.value,this.data).subscribe((res)=>{
      if(res) {
        this.router.navigate(['modeler/Invoice',localStorage.getItem('rollNo')]);
      } 
    })
  }

  ngOnDestroy(): void {
    if(this.subscription)this.subscription.unsubscribe();
  }
}
