import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { modelerLanding } from 'src/app/models/interface';
import swal from "sweetalert2/dist/sweetalert2.js"
import { BackendService } from 'src/app/services/backend.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-modaler-products',
  templateUrl: './modaler-products.component.html',
  styleUrls: ['./modaler-products.component.css']
})
export class ModalerProductsComponent implements OnInit,OnDestroy{
  @ViewChild('fileInput') fileInput: any;
constructor(private route:ActivatedRoute,private backEndService :BackendService,private toaster:ToastrService,private router:Router,private notificatinService:NotificationService){

}

productId:string = "";
products:Array<any> = [];
uploadedFile!:File;
clientId : string = "";
version:number = 0;
index!:number;
totalRecords!:number;
bonus:Array<any> = [];
serachForModel:string = "";
page:number = 1;
tableData:Boolean = true;
deadLineOne!:string|null
deadLineTwo!:string|null;
isLoading:Boolean = false;
contentLoading:Boolean = false;
totalCorrectionModels:number = 0;
totalApprovedModels:number = 0;
subscription!:Subscription;
subscription1!:Subscription;
subscription2!:Subscription;
requirement:any
 


ngOnInit() {
  this.productId = this.route.snapshot.params['id'];
  this.subscription = this.backEndService.getModalerPro(this.productId,localStorage.getItem('rollNo')).subscribe((data:any)=>{ 
  if(data.proData){
    this.clientId = data.proData[0].clientId
    this.bonus = data.deadLineBonus.bonus;
    this.requirement = data.requirement;
    this.deadLineOne = data.deadLineBonus?.deadLineOne;
    this.deadLineTwo = data.deadLineBonus?.deadLineTwo;
    this.products = [...data.proData[0].assignedPro]; 
    this.products.forEach((pro)=>{
      if(pro.productStatus == 'Approved'){
        this.totalApprovedModels ++;
      }
      if(pro.productStatus == 'Correction'){
        this.totalCorrectionModels ++;
      }
    })
    this.products = this.products.filter(obj => obj.modRollno == localStorage.getItem("rollNo")&&obj.invoice == false&&obj.productStatus != 'Approved');
    
    this.totalRecords = this.products.length
  }else{
    this.tableData = false;
  } 
  })
  this.subscription1 = this.notificatinService.getNotificationData(localStorage.getItem("rollNo"),"seeLess").subscribe((data)=>{
    this.notificatinService.setNotificationDAta(data);
  })

}

aditionalInfoDilog(info:string){
  swal.fire({
    title: '',
    icon: 'info',
    html:`${info}`,
    showCloseButton: false,
    showCancelButton: false,
    focusConfirm: false,
  })
}

isValidZipFile(file: any):boolean{
  if(file.name.endsWith(".zip")||file.name.endsWith(".glb")){
    return true
  }else{
    return false
  }

}

getIndex(index:number){
  index = (this.page - 1) * 50 + index;
  this.index = index
}

acceptFile(event :any){ 
  if(this.isValidZipFile(event.target.files[0])){
     this.uploadedFile = event.target.files[0]
     this.products[this.index].modalFile = true
  }else{
    this.toaster.error('Error', 'Please select a .glb file')
  }
}

resetFile(index:number){
  index = (this.page - 1) * 50 + index;
  this.products[index].modalFile = false
  this.fileInput.nativeElement.value = '';
}

onUpload(id:string,index:number){
  this.isLoading = true;
  index = (this.page - 1) * 50 + index;
  let list = this.products[index].list;
  
  const formData = new FormData();
  formData.append('file',this.uploadedFile,this.uploadedFile.name);
  formData.append('id',id);
  formData.append('clientId',this.clientId)
  formData.append('modRollNo',localStorage.getItem('rollNo')||"");
  formData.append('list',list)
  this.subscription2 = this.backEndService.uploadModal(formData).subscribe((res)=>{
    if(res.status){
      this.version = res.version;
      this.toaster.success('success','model successfully uploaded');
      this.products[index].modalFile = false;
      this.products[index].productStatus = 'Uploaded';
      this.router.navigate(['/modeler', 'reviews',id,this.clientId,res.version])
    }else{
      this.isLoading = false;
      this.toaster.error('Error','Sorry model is under QA.');
    }
  })
}

proNameLoad(proName:string){
this.backEndService.getProName(proName)
}

loadModelReviewPage(articleId:string,clientId:string,version:number){
  this.router.navigate(['modeler/reviews',articleId,clientId,version])
}

ngOnDestroy(): void {
  if(this.subscription)this.subscription.unsubscribe();
  if(this.subscription1)this.subscription1.unsubscribe()
  if(this.subscription2)this.subscription2.unsubscribe()
    
}

}
