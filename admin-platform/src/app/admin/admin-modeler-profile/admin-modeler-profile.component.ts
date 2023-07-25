import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { userInfo } from 'src/app/models/interface';
import { BackendService } from 'src/app/services/backend.service';

@Component({
  selector: 'app-admin-modeler-profile',
  templateUrl: './admin-modeler-profile.component.html',
  styleUrls: ['./admin-modeler-profile.component.css']
})
export class AdminModelerProfileComponent implements OnInit{

  constructor(private backEndService:BackendService,private route:ActivatedRoute){};

  userData: userInfo = { email: '', name: '', password: '', role: '', phone: '', address: '', about: "" , aboutStatus:false};
  bankInfo:any = {};
  aboutTxt:string = "";
  modeler:any = {};
  modelerEmail:string = ""


  ngOnInit(): void {
    this.modelerEmail = this.route.snapshot.params["email"]
    this.backEndService.getUserDetailsForProfile(this.modelerEmail).subscribe((res)=>{
      if(res){
        this.userData = res.userData;
        this.modeler = res.modeler;
        if(!this.modeler?.about){
          this.userData.aboutStatus = false
        }else{
          this.userData.about = this.modeler.about;
        }
        this.bankInfo = res.data ? res.data : false;
      }else{
        
      }  
    })
  }

  getAboutTxt(){
    if(this.aboutTxt != ""){
      this.userData.about = this.aboutTxt;
      this.userData.aboutStatus = false;
      this.backEndService.createAboutforModeler(this.modelerEmail,this.aboutTxt).subscribe(()=>{})
    }
  }
}
