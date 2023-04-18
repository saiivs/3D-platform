import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BackendService } from 'src/app/services/backend.service';
import '@google/model-viewer'
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.css']
})
export class ReviewsComponent implements OnInit,OnDestroy{

  loader = new GLTFLoader();

  @ViewChild('comntRef') comntRef:any;
  constructor(private backEnd : BackendService,private route:ActivatedRoute){
  }

  clientID:string = "";
  articleID:string = "";
  QaCommentArr:Array<any> = []
  QaComment:string = ""
  clientId:string = "";
  articleId:string = "";
  newCmnt : any= {};
  newData :any = {}
  checkDate : string = new Date().toISOString().slice(0,10);
  userEmail:string|null= localStorage.getItem('userEmail');
  productName:string = "";
  proStatus:string = "";
  QaName :string = "";
  groupedMessages: { [date: string]: any[] } = {};
  currentDate: any ="";
  clientName:string="";
  polygonCount!:number;
  srcFile:string = "";
  subscription!:Subscription;

  ngOnInit() {
    this.backEnd.currProName.subscribe((proName)=>{
      this.backEnd.currQa.subscribe((QaName)=>{
        this.QaName = QaName
      })
      this.productName = proName
      this.backEnd.currentData.subscribe((clientName)=>{
        this.clientName = clientName
      })
    })
      this.clientId = this.route.snapshot.params['clientId'];
      this.articleId = this.route.snapshot.params['articleId'];
      this.subscription = this.backEnd.getQaComments(this.clientId,this.articleId).subscribe((data)=>{
        this.currentDate = new Date().toLocaleDateString('en-GB');
        if(data){
          this.polygonCount = data.polygonCount
          this.QaCommentArr = [...data.Arr]
          this.srcFile = `http://localhost:3000/modals/${this.QaCommentArr[0]?.articleId}&&${this.QaCommentArr[0]?.clientId}.glb`
          this.QaCommentArr[0]?.comments.forEach((message: any) => {
            const conDate = new Date(message.date)
            const date = new Date(conDate).toLocaleDateString('en-GB');
            if (!this.groupedMessages[date]) {
              this.groupedMessages[date] = [];
            }
            this.groupedMessages[date].push(message);
          });
        }
      })
  }

  getComment(event:any){
    this.QaComment = event.target.value
  }

  getGroupedMessageKeys() {
    return Object.keys(this.groupedMessages);
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
    this.comntRef.nativeElement.value = ""
   
    this.backEnd.pushComment(this.QaComment,this.clientId,this.articleId,localStorage.getItem('userEmail')).subscribe((res)=>{
        console.log(res);

    })  
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe()
  }

}
