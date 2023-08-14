import { Component, OnInit } from '@angular/core';
import { Form, FormControl, FormGroup, Validators } from '@angular/forms';
import { userInfo } from 'src/app/models/interface';
import { BackendService } from 'src/app/services/backend.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-modeler-profile',
  templateUrl: './modeler-profile.component.html',
  styleUrls: ['./modeler-profile.component.css']
})
export class ModelerProfileComponent implements OnInit{

  constructor(private backEndService:BackendService,private notificatinService:NotificationService){}

  userData:userInfo|null = null;
  bankInfo:any = {};
  noUserFound:boolean = false;
  reactiveForm!:FormGroup;
  modalClose:boolean = false;

  ngOnInit(): void {
    const userEmail = localStorage.getItem("userEmail");
    this.reactiveForm = new FormGroup({
      bankName: new FormControl(this.bankInfo.bankName||"",Validators.required),
      accountNumber: new FormControl(this.bankInfo.accountNumber||"",Validators.required),
      address:new FormControl(this.bankInfo.address||"",Validators.required),
      swiftCode:new FormControl(this.bankInfo.swiftCode||"",Validators.required),
      mob:new FormControl(this.bankInfo.mob||"",Validators.required),
      pincode:new FormControl(this.bankInfo.pincode||"",Validators.required),
    })
    
    this.backEndService.getUserDetailsForProfile(userEmail).subscribe((res)=>{
      if(res){
        this.userData = res.userData;
        this.bankInfo = res.data ? res.data : false;
        
          this.reactiveForm = new FormGroup({
          bankName: new FormControl(this.bankInfo.bankName,Validators.required),
          accountNumber: new FormControl(this.bankInfo.accountNumber,Validators.required),
          address:new FormControl(this.bankInfo.address,Validators.required),
          swiftCode:new FormControl(this.bankInfo.swiftCode,Validators.required),
          mob:new FormControl(this.bankInfo.mob,[Validators.required,Validators.pattern('[0-9]{10}')]),
          pincode:new FormControl(this.bankInfo.pincode,[Validators.required,Validators.pattern('[0-9]+')]),
        })
        
      }else{
        this.noUserFound = true;
      }  
    })
    this.notificatinService.getNotificationData(localStorage.getItem("rollNo"),"seeLess").subscribe((data)=>{
      this.notificatinService.setNotificationDAta(data);
    })
  }

  updateBankDetails(){
    this.backEndService.updateBankDetails(this.reactiveForm.value,localStorage.getItem('rollNo')).subscribe(()=>{
      this.bankInfo = this.reactiveForm.value;
    })
  }

}
