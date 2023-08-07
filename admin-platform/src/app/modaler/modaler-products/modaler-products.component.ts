import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { modelerLanding } from 'src/app/models/interface';
import { BackendService } from 'src/app/services/backend.service';

@Component({
  selector: 'app-modaler-products',
  templateUrl: './modaler-products.component.html',
  styleUrls: ['./modaler-products.component.css']
})
export class ModalerProductsComponent implements OnInit,OnDestroy{
  @ViewChild('fileInput') fileInput: any;
constructor(private route:ActivatedRoute,private backEndService :BackendService,private toaster:ToastrService,private router:Router){

}

productId:string = "";
products:Array<any> = [];
uploadedFile!:File;
clientId : string = "";
version:number = 0;
index!:number;
totalRecords!:number;
bonus:Array<any> = [];
page:number = 1;
deadLineOne!:string|null
deadLineTwo!:string|null
subscription!:Subscription;



ngOnInit() {
  this.productId = this.route.snapshot.params['id'];
  this.subscription = this.backEndService.getModalerPro(this.productId,localStorage.getItem('rollNo')).subscribe((data:any)=>{ 
    console.log(data);
    
    this.clientId = data[0].clientId
    this.bonus = data[1].bonus;
    this.deadLineOne = data[1]?.deadLineOne;
    this.deadLineTwo = data[1]?.deadLineTwo;
    this.products = [...data[0].assignedPro]; 
    this.products = this.products.filter(obj => obj.modRollno == localStorage.getItem("rollNo")&&obj.invoice == false);
    this.totalRecords = this.products.length
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
  index = (this.page - 1) * 50 + index;
  const formData = new FormData();
  formData.append('file',this.uploadedFile,this.uploadedFile.name);
  formData.append('id',id);
  formData.append('clientId',this.clientId)
  formData.append('modRollNo',localStorage.getItem('rollNo')||"");
  this.backEndService.uploadModal(formData).subscribe((res)=>{
    if(res.status){
      this.version = res.version;
      this.toaster.success('success','model successfully uploaded');
      this.products[index].modalFile = false;
      this.products[index].productStatus = 'Uploaded';
      this.router.navigate(['/modeler', 'reviews',id,this.clientId,res.version])
    }else{
      this.toaster.error('Error','Sorry model is under QA.');
    }
  })
}

proNameLoad(proName:string){
this.backEndService.getProName(proName)
}

ngOnDestroy(): void {
  this.subscription.unsubscribe();
}

}
