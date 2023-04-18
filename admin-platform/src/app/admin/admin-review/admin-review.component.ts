import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BackendService } from 'src/app/services/backend.service';
import swal from "sweetalert2/dist/sweetalert2.js"
import "@google/model-viewer"
import { messageInfo } from 'src/app/models/interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-review',
  templateUrl: './admin-review.component.html',
  styleUrls: ['./admin-review.component.css']
})
export class AdminReviewComponent implements OnInit,OnDestroy{


  @ViewChild('comntRef') comntRef:any;
  constructor(private backEnd : BackendService,private route:ActivatedRoute){

  }

  QaCommentArr:Array<any>= []
  QaComment:string = ""
  clientId:string = "";
  articleId:string = "";
  newCmnt : any= {};
  newData :any = {}
  checkDate : string = new Date().toISOString().slice(0,10);
  userEmail = localStorage.getItem('userEmail');
  productName:string = "";
  proStatus:string = "";
  modelerName :string = "";
  groupedMessages: { [date: string]: any[] } = {};
  currentDate: any ="";
  clientName:string = "";
  polygonCount!:number;
  srcFile:string = ""
  subscription!:Subscription;

  ngOnInit() {
    
    this.clientId = this.route.snapshot.params['clientId'];
    this.articleId = this.route.snapshot.params['articleId'];
    this.subscription = this.backEnd.getAdminComment(this.clientId,this.articleId).subscribe((data)=>{
      this.currentDate = new Date().toLocaleDateString('en-GB');
      if(data){
        this.polygonCount = data.polygonCount
        this.QaCommentArr = [...data.Arr]
        this.srcFile = `http://localhost:3000/modals/${this.QaCommentArr[0]?.articleId}&&${this.QaCommentArr[0]?.clientId}.glb`
        console.log(this.QaCommentArr);
        
        this.QaCommentArr[0]?.comments.forEach((message: any) => {
          const conDate = new Date(message.date)
          const date = new Date(conDate).toLocaleDateString('en-GB');
          if (!this.groupedMessages[date]) {
            this.groupedMessages[date] = [];
          }
          this.groupedMessages[date].push(message);
        });
        console.log(this.groupedMessages);
        
        
      }
    })
    this.backEnd.adminCurrProName.subscribe((proName)=>{
      this.backEnd.adminCurrModeler.subscribe((modelerName)=>{
        this.modelerName = modelerName
      })
      this.productName = proName
      this.backEnd.currentData.subscribe((clientName)=>{
        this.clientName = clientName
      })
    })
  }

  getComment(event:any){
    this.QaComment = event.target.value
  }

  pushComnts(){
    let time = new Date().toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', hour12: true, hourCycle: 'h12' })
    let pushObj = {
      date:this.currentDate,
      time:time,
      user:localStorage.getItem('userEmail'),
      cmnt:this.QaComment
    }
    if(this.QaCommentArr[0].comments.length != 0){
    if (!this.groupedMessages[this.currentDate]) {
      this.groupedMessages[this.currentDate] = [];
    }
    this.groupedMessages[this.currentDate].push(pushObj);
    console.log(this.groupedMessages);    
    this.comntRef.nativeElement.value = ""
   
    this.backEnd.pushComment(this.QaComment,this.clientId,this.articleId,localStorage.getItem('userEmail')).subscribe((res)=>{
        console.log(res);

    })

    }else{
      this.QaCommentArr[0].comments.push(pushObj);
      this.QaCommentArr[0]?.comments.forEach((message: any) => {
        const conDate = new Date(message.date)
        const date = new Date(conDate).toLocaleDateString('en-GB');
        if (!this.groupedMessages[this.currentDate]) {
          this.groupedMessages[this.currentDate] = [];
        }
        this.groupedMessages[this.currentDate].push(message);
      });
      this.comntRef.nativeElement.value = ""
      this.backEnd.pushAdminComment(this.QaComment,this.clientId,this.articleId,localStorage.getItem('userEmail')).subscribe((res)=>{
        console.log(res);

    })
    }

  }

  getGroupedMessageKeys() {
    return Object.keys(this.groupedMessages);
  }

  
  updateModalStatus(articleId:string,status:string){
    swal.fire({
      position: 'center',
      title: 'Confirm',
      text:  `Are your sure to ${status} this modal?`,
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'cancel'
    }).then((result)=>{
      if(result.value){
        if(status == "Approved"){
          this.backEnd.AdminApproveModal(this.clientId,articleId).subscribe((res)=>{
            console.log({res});
            
            this.QaCommentArr[0].modalStatus = status
            this.QaCommentArr[0].adminStatus = status
          })
        }else{
          this.backEnd.rejectModal(this.clientId,articleId).subscribe((res)=>{
            this.QaCommentArr[0].modalStatus = "Need Updates"
            this.QaCommentArr[0].adminStatus = status
          })
        }
          
      }else{
        if(result.dismiss === swal.DismissReason.cancel){

        }
      }
    })
  }

  downloadFile(articleId:string){
    let link = document.createElement('a');
    link.download = `file.zip`
    link.href = `http://localhost:3000/modals/${articleId}&&${this.clientId}.glb`;
    link.target = '_blank';
    link.click()
  }

  ngOnDestroy(){
    this.subscription.unsubscribe()
  }
}
