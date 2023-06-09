import { Component, ElementRef, Input, OnDestroy, OnInit, Type, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendService } from 'src/app/services/backend.service';
import { ToastrService } from 'ngx-toastr';
import swal from "sweetalert2/dist/sweetalert2.js"
import { Types } from 'mongoose';
import { productList, team } from 'src/app/models/interface';
import { Subscription } from 'rxjs';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit,OnDestroy{

constructor(private titleService :Title,private route:ActivatedRoute,private backEndService:BackendService,private toaster:ToastrService,private searchService:NotificationService,private router:Router){

}

productId:string = "";
products: productList[] = [];
reactiveForm !: FormGroup;
masterCheckBox :Boolean = false;
isChecked:Boolean = false;
selectionText:string = "Select All";
modalersArr: Array<any> = [];
QATeamArr:Array<any> = [];
checkedItems:productList[] = [];
modalerRollNo:string =""
QARollNo:string = "";
ModelerName:string = "3D Modelers";
QAName:string = "QA Team"
clinetName:string = "";
clientId!:Types.ObjectId;
totalRecords!:number;
totalCompletedModels:number = 0;
totalCorrectionModels:number = 0;
page:number = 1;
budget:number = 0;
tempPrice:number = 0;
checkUrl:string = "";
updatedBudget:number = 0;
totalUploadedModels:number = 0;
totalNotUploaded:number = 0;
tagName:string = "";
tagList:Array<any> = [];
addBtn:boolean = true;
tagDropDown:boolean = false;
tagNameDrpdown:string[] = [];
totalPrice:number = 0;
search:string = "";
budgetExceeded:string = "";
priceUpdated:boolean = true;
subscription1!:Subscription;
subscription2!:Subscription;
recieved: string = "";
canClose:Boolean = false;
requirementData:string = "";
addRequirement:Boolean = true;


ngOnInit(){
  this.titleService.setTitle("Products");
  this.checkUrl = this.router.url;
  if (this.checkUrl.includes('/admin/products/')) {
    this.searchService.checkUrlForSearchBtn(true);
  } 
  this.backEndService.currentData.subscribe((name)=>{
    this.clinetName = name
  })
  this.searchService.searchValue.subscribe((data)=>{
    this.recieved = data;
  })
 
  this.productId = this.route.snapshot.params['id'];
  this.subscription1 = this.backEndService.getProlist(this.productId).subscribe((res)=>{
    console.log(res);
    
    this.budget = res.Arr[1].budgetValue; 
    this.updatedBudget = res.Arr[1].budgetValue;
    if(res.requirement.length == 0){
      this.requirementData = ""
    }else{
      this.requirementData = res.requirement[0].requirement
    }
    // this.requirementData = res.requirement[0]
    this.clientId = res.Arr[0].clientId
    this.products = [...res.Arr[0].productList];
    
    this.backEndService.getTagCollections().subscribe((res)=>{
      if(res){
        this.tagList = [...res]
        this.tagNameDrpdown = Array(this.products.length).fill('Tags');
        this.products.forEach((obj,index)=>{
          if(obj.tag){
            this.tagNameDrpdown[index] = obj.tag;
          }else{
            obj.tag = ""
          }
        })
      } 
    })
    this.totalRecords = this.products.length;
    for (let pro of this.products){
      pro.priceAdded = false
      if(pro.price) this.totalPrice += parseInt(pro.price);
      else pro.price = ""
      if(this.totalPrice > this.budget) this.budgetExceeded = 'Monthly budget has been exceeded';
      if(pro.productStatus == 'Approved') this.totalCompletedModels ++;
      else if(pro.productStatus == 'Correction') this.totalCorrectionModels ++;
      else if(pro.productStatus == 'Uploaded') this.totalUploadedModels ++;
      else if(pro.productStatus == 'Not uploaded') this.totalNotUploaded ++;
      pro.isSelected = false;
    }
    if(this.totalPrice != 0) {
      this.updatedBudget -= this.totalPrice; 
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
  let i = (this.page - 1) * 6 + index;
  let ArrIndex = i;
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
  let i = (this.page - 1) * 6 + index;
  let ArrIndex = i;
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
  this.isChecked = false;
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
   this.backEndService.assignedPro(this.checkedItems,this.modalerRollNo,this.clientId,this.QARollNo).subscribe((res)=>{

  if(res){
    this.products = this.products.filter((item)=>{
      if(item.isSelected == true){
        item.assigned = modaler.name
        item.QaTeam = Qa.name
        item.modRollno = modaler.rollNo;
        item.isSelected = false;
      }
      return [...this.products]
    })
    for (let person of this.QATeamArr){
      person.isSelected = false;
    }
    for (let modeler of this.modalersArr){
      modeler.isSelected = false;
    }
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

addBtnFn(index:number){
  let i = (this.page - 1) * 6 + index;
  this.products[i].priceAdded = true; 
}

EditPrice(index:number){
  let i = (this.page - 1) * 6 + index;
  this.tempPrice = parseInt(this.products[i].price);
  
  this.totalPrice -= this.tempPrice;
  this.budgetExceeded = "";
  this.updatedBudget = this.budget - this.totalPrice
  this.products[i].price = "";
  this.products[i].priceAdded = true; 
}

getPrice(price:string,articleId:string,modelerRollno:string,index:number){
  let i = (this.page - 1) * 6 + index;
  let priceValue =  Number(price);
  this.totalPrice += priceValue;
  if(this.totalPrice > this.budget){
    swal.fire({
      title: 'Are you sure?',
      text: "Monthly budget has been exeeded.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes'
    }).then((result) => {
      if (result.isConfirmed) {
        this.updatedBudget = this.totalPrice
        this.budgetExceeded = 'Monthly budget has been exceeded';
        this.backEndService.updatePrice(priceValue,this.clientId,articleId,modelerRollno,this.budgetExceeded).subscribe((res)=>{
        if(res){    
          this.products[i].priceAdded = false;
          this.products[i].price = price;
          this.backEndService.updateBudgetExceed().subscribe((res)=>{
            console.log(res);
            
          })
        }
     })  
      }
    })
  }else{
    if(this.tempPrice == 0){
       this.updatedBudget -= priceValue;
    }else{
      this.updatedBudget -= priceValue;
    }
    this.backEndService.updatePrice(priceValue,this.clientId,articleId,modelerRollno,this.budgetExceeded).subscribe((res)=>{
      if(res){ 
        this.tempPrice = 0;   
        this.products[i].priceAdded = false;
        this.products[i].price = price
      }
   })  
  }
  
}

getRefference(index:number,articleId:string){
  let i = (this.page - 1) * 6 + index;
  swal.fire({
    title: 'Enter The Refference Url',
    input: 'url',
    inputAttributes: {
      autocapitalize: 'off'
    },
    showCancelButton: true,
    confirmButtonText: 'Submit',
    showLoaderOnConfirm: true,
    preConfirm: (url) => {
     this.backEndService.updateRefference(url,articleId,this.clientId).subscribe((res)=>{
      if(res){
        this.products[i].Reff = url;
        this.toaster.success('success','Url is updated');
      }
      
     })
    },
    allowOutsideClick: () => !swal.isLoading(),
  }).then((result) => {
    if (result.isConfirmed) {
     console.log("hey");
     
    }
  })
}

getTagName(){
  this.tagList.push({tagName:this.tagName});
  this.backEndService.createTags(this.tagName).subscribe((res)=>{
    if(res) this.tagName = "";
  })
}

addTag(index:number,tagName:string,articleId:string){
  let i = (this.page - 1) * 6 + index;
  this.tagNameDrpdown[i] = tagName;
  this.products[i].tag = tagName
  this.backEndService.assignTag(tagName,articleId,this.clientId).subscribe((res)=>{
    
  })
}

@ViewChild('requirement',{ static: false }) requirement! : ElementRef;
getRequirement(){
  this.requirementData= this.requirement.nativeElement.value;
  this.backEndService.saveRequirement(this.requirementData,this.clientId).subscribe((res)=>{
    
    
  })
}

checkValue(event:any){
  if(event.target.value == ""){
    this.canClose = false;
  }else{
    this.canClose = true;
  }
}

ngOnDestroy(): void {
  this.subscription1.unsubscribe();
  this.subscription2.unsubscribe();
}

}
