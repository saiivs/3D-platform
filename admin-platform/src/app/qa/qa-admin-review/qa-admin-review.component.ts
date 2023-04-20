import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BackendService } from 'src/app/services/backend.service';
import swal from "sweetalert2/dist/sweetalert2.js"
import '@google/model-viewer'
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-qa-admin-review',
  templateUrl: './qa-admin-review.component.html',
  styleUrls: ['./qa-admin-review.component.css']
})
export class QaAdminReviewComponent implements OnInit,OnDestroy{

  @ViewChild('comntRef') comntRef:any;
  constructor(private backEnd : BackendService,private route:ActivatedRoute){

  }

  QaCommentArr:Array<any> = []
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
  srcFile:string = "";
  subscription!:Subscription;

  ngOnInit() {
    
    this.backEnd.currProName.subscribe((proName)=>{
      this.backEnd.currModeler.subscribe((modelerName)=>{
        this.modelerName = modelerName
      })
      this.productName = proName;
      this.backEnd.currentData.subscribe((clientName)=>{
        this.clientName = clientName
      })
    })
    this.clientId = this.route.snapshot.params['clientId'];
    this.articleId = this.route.snapshot.params['articleId'];
    this.subscription = this.backEnd.getAdminComment(this.clientId,this.articleId).subscribe((data)=>{
      this.currentDate = new Date().toLocaleDateString();
      if(data){
        console.log({data});
        
        this.polygonCount = data.polygonCount
        this.QaCommentArr = [...data.Arr]
        this.srcFile = `https://localhost:3001/models/${this.QaCommentArr[0]?.articleId}&&${this.QaCommentArr[0]?.clientId}.glb`
        this.QaCommentArr[0]?.comments.forEach((message: any) => {
          const conDate = new Date(message.date)
          const date = new Date(conDate).toLocaleDateString();
          if (!this.groupedMessages[date]) {
            this.groupedMessages[date] = [];
          }
          this.groupedMessages[date].push(message);
        });
        console.log(this.groupedMessages); 
      }
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
    if (!this.groupedMessages[this.currentDate]) {
      this.groupedMessages[this.currentDate] = [];
    }
    this.groupedMessages[this.currentDate].push(pushObj);
    console.log(this.groupedMessages);    
    this.comntRef.nativeElement.value = ""
   
    this.backEnd.pushAdminComment(this.QaComment,this.clientId,this.articleId,localStorage.getItem('userEmail')).subscribe((res)=>{
        console.log(res);

    })

  }

  getGroupedMessageKeys() {
    return Object.keys(this.groupedMessages);
  }

  updateModalStatus(articleId:string,status:string){
    swal.fire({
      position: 'center',
      title: 'Confirm',
      text:  `Are your sure to approve this model?`,
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'cancel'
    }).then((result)=>{
      if(result.value){
          this.backEnd.approveModal(this.clientId,articleId,status).subscribe((res)=>{
            this.QaCommentArr[0].modalStatus = 'Approved'
          })
      }else{
        if(result.dismiss === swal.DismissReason.cancel){

        }
      }
    })
  }

  downloadFile(articleId:string){
    let link = document.createElement('a');
    link.download = `file.zip`
    link.href = `https://localhost:3001/models/${articleId}&&${this.clientId}.glb`;
    link.target = '_blank';
    link.click()
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
