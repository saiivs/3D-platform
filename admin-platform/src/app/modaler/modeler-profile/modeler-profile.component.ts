import { Component, OnDestroy, OnInit } from '@angular/core';
import { Form, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { userInfo } from 'src/app/models/interface';
import { BackendService } from 'src/app/services/backend.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-modeler-profile',
  templateUrl: './modeler-profile.component.html',
  styleUrls: ['./modeler-profile.component.css']
})
export class ModelerProfileComponent implements OnInit,OnDestroy{

  constructor(private backEndService:BackendService,private notificatinService:NotificationService){}

  userData:userInfo|null = null;
  bankInfo:any = {};
  noUserFound:boolean = false;
  reactiveForm!:FormGroup;
  modalClose:boolean = false;
  subscription1!:Subscription;
  subscription2!:Subscription;
  subscription3!:Subscription;

  ngOnInit(): void {
    const userEmail = localStorage.getItem("userEmail");
    this.reactiveForm = new FormGroup({
      bankName: new FormControl(this.bankInfo.bankName||"",Validators.required),
      accountNumber: new FormControl(this.bankInfo.accountNumber||"",Validators.required),
      accountHolderName: new FormControl(this.bankInfo.accountHolderName,Validators.required),
      swiftCode:new FormControl(this.bankInfo.swiftCode||"",Validators.required),
    })
    
    this.subscription1 = this.backEndService.getUserDetailsForProfile(userEmail).subscribe((res)=>{
      if(res){
        this.userData = res.userData;
        this.bankInfo = res.data ? res.data : false;
        
          this.reactiveForm = new FormGroup({
          bankName: new FormControl(this.bankInfo.bankName,Validators.required),
          accountNumber: new FormControl(this.bankInfo.accountNumber,Validators.required),
          accountHolderName: new FormControl(this.bankInfo.accountHolderName,Validators.required),
          swiftCode:new FormControl(this.bankInfo.swiftCode,Validators.required),
        })
        
      }else{
        this.noUserFound = true;
      }  
    })
    this.subscription2 = this.notificatinService.getNotificationData(localStorage.getItem("rollNo"),"seeLess").subscribe((data)=>{
      this.notificatinService.setNotificationDAta(data);
    })
  }

  updateBankDetails(){
    this.subscription3 = this.backEndService.updateBankDetails(this.reactiveForm.value,localStorage.getItem('rollNo')).subscribe(()=>{
      this.bankInfo = this.reactiveForm.value;
    })
  }

  ngOnDestroy(): void {
    if(this.subscription1)this.subscription1.unsubscribe()
    if(this.subscription2)this.subscription2.unsubscribe()
    if(this.subscription3)this.subscription3.unsubscribe() 
  }

}
