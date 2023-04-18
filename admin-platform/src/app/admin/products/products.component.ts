import { Component, OnDestroy, OnInit, Type } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { BackendService } from 'src/app/services/backend.service';
import { ToastrService } from 'ngx-toastr';
import swal from "sweetalert2/dist/sweetalert2.js"
import { Types } from 'mongoose';
import { productList, team } from 'src/app/models/interface';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit,OnDestroy{

constructor(private titleService :Title,private route:ActivatedRoute,private backEndService:BackendService,private toaster:ToastrService){

}

productId:string = "";
products: productList[] = [];
reactiveForm !: FormGroup;
masterCheckBox :Boolean = false;
selectionText:string = "Select All";
modalersArr: Array<any> = [];
QATeamArr:Array<any> = [];
checkedItems:productList[] = [];
modalerRollNo:string =""
QARollNo:string = "";
ModelerName:string = "3D Modalers";
QAName:string = "QA Team"
clinetName:string = "";
clientId!:Types.ObjectId;
totalRecords!:number
page:number = 1;
subscription1!:Subscription;
subscription2!:Subscription;

ngOnInit(){
  this.titleService.setTitle("Products");
  this.backEndService.currentData.subscribe((name)=>{
    this.clinetName = name
  })
  this.productId = this.route.snapshot.params['id'];
  this.subscription1 = this.backEndService.getProlist(this.productId).subscribe((res)=>{
    this.clientId = res[0].clientId
    this.products = [...res[0].productList]; 
    this.totalRecords = this.products.length;
    for (let pro of this.products){
      pro.isSelected = false;
    }
   this.subscription2 = this.backEndService.getModalers().subscribe((modalers:team)=>{
      this.QATeamArr = [...modalers.QAarr]
      this.modalersArr = [...modalers.modalersAr]
      for (let modeler of this.modalersArr){
        modeler.isSelected = false;
      }
      for (let person of this.QATeamArr){
        person.isSelected = false;
      }
   })
  })
  this.reactiveForm = new FormGroup({
    modalerName:new FormControl(null)
  })
}

checkBoxChange(){
    for(let pro of this.products){
      if(!pro.assigned){
        pro.isSelected = this.masterCheckBox
      }
      if(this.masterCheckBox){
        this.selectionText = " Unselect All"
      }else{
        this.selectionText = " Select All"
      }
    }
}

MultiSelectionModeler(index:any,rollNo:string){
  let ArrIndex = index;
  this.modalerRollNo = rollNo
  this.ModelerName = `${this.modalersArr[ArrIndex].name}(3D)`
  for(let index in this.modalersArr){
    if(index != ArrIndex){
      this.modalersArr[index].isSelected = false;
    }else{
      this.modalersArr[index].isSelected = true;
    }
  }
}

MultiSelectionQA(index:any,rollNo:string){
  let ArrIndex = index;
  this.QARollNo = rollNo
  this.QAName = `${this.QATeamArr[ArrIndex].name}(QA)`
  for(let index in this.QATeamArr){
    if(index != ArrIndex){
      this.QATeamArr[index].isSelected = false;
    }else{
      this.QATeamArr[index].isSelected = true;
    }
  }
}

aasignProduct(){
  this.checkedItems = this.products.filter(pro => pro.isSelected == true);
  if(this.checkedItems.length != 0 && this.modalerRollNo != "" && this.QARollNo != ""){
    let modaler = this.modalersArr.find(obj=>obj.rollNo == this.modalerRollNo);
    let Qa = this.QATeamArr.find(obj => obj.rollNo == this.QARollNo);
swal.fire({
  position: 'center',
  title: 'Are you sure?',
  text:  `Assign ${this.checkedItems.length} products to ${modaler.name} & ${Qa.name} for QA`,
  showCancelButton: true,
  confirmButtonText: 'Yes, go ahead.',
  cancelButtonText: 'cancel'
}).then((result) => {
  if (result.value) {
    console.log(this.checkedItems);

   this.backEndService.assignedPro(this.checkedItems,this.modalerRollNo,this.clientId,this.QARollNo).subscribe((res)=>{

  if(res){
    this.products = this.products.filter((item)=>{
      if(item.isSelected == true){
        item.assigned = modaler.name
        item.QaTeam = Qa.name
        item.isSelected = false;
      }
      return [...this.products]
    })
    this.ModelerName = "3D Modelers";
    this.QAName = "QA Team"
    this.toaster.success('success','Products successfully assigned')
  }else{
    this.toaster.error('Error','Something went wrong. Please try again later')
  }
})
  } else if (result.dismiss === swal.DismissReason.cancel) {

  }
})

  }else{
    this.toaster.error('Error','Please check the selected details');
  }
}

downloadFile(articleId:string){
  let link = document.createElement('a');
  link.download = `${this.clinetName}.zip`
  link.href = `http://localhost:3000/modals/${articleId}&&${this.clientId}.zip`;
  link.target = '_blank';
  link.click()
}


nameLoad(modeler:string,pro:string){
this.backEndService.getAdminModeler(modeler);
this.backEndService.getAdminPro(pro)
}

ngOnDestroy(): void {
  this.subscription1.unsubscribe();
  this.subscription2.unsubscribe();
}

}
