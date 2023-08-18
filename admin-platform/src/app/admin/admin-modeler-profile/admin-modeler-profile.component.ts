import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { userInfo } from 'src/app/models/interface';
import { BackendService } from 'src/app/services/backend.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-admin-modeler-profile',
  templateUrl: './admin-modeler-profile.component.html',
  styleUrls: ['./admin-modeler-profile.component.css']
})
export class AdminModelerProfileComponent implements OnInit,OnDestroy{

  constructor(private backEndService: BackendService, private route: ActivatedRoute,private notificationService:NotificationService) { };

  userData: userInfo = { email: '', name: '', password: '', role: '', phone: '', address: '', about: "", aboutStatus: false };
  bankInfo: any = {};
  aboutTxt: string = "";
  modeler: any = {};
  modelerEmail: string = ""
  subscription1!:Subscription;
  subscription2!:Subscription;

  ngOnInit(): void {
    this.modelerEmail = this.route.snapshot.params["email"]
    this.subscription1 = this.backEndService.getUserDetailsForProfile(this.modelerEmail).subscribe((res) => {
      if (res) {
        this.userData = res.userData;
        this.modeler = res.modeler;
        if (!this.modeler?.about) {
          this.userData.aboutStatus = false
        } else {
          this.userData.about = this.modeler.about;
        }
        this.bankInfo = res.data ? res.data : false;
      } else {

      }
    })
    this.subscription2 = this.notificationService.getNotificationForAdmin("seeLess").subscribe((data)=>{
      this.notificationService.setNotificationForAdmin(data);
    })
  }

  getAboutTxt() {
    if (this.aboutTxt != "") {
      this.userData.about = this.aboutTxt;
      this.userData.aboutStatus = false;
      this.backEndService.createAboutforModeler(this.modelerEmail, this.aboutTxt).subscribe(() => { })
    }
  }

 ngOnDestroy(): void {
  if(this.subscription1)this.subscription1.unsubscribe()
  if(this.subscription2)this.subscription2.unsubscribe()
 }
}
