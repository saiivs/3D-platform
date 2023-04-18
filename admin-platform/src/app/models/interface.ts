import { Types } from 'mongoose'

export interface user{
  email:string,
  password:string
}

export interface userRes {
  token:string,
  userRole:string,
  userEmail:string,
  password?:Boolean,
  userExist?:Boolean
}

export interface csvRecord{
  slNo?:string,
  articleID? :string,
  productName? : string,
  productLink? : string
}

export interface client{
  _id :Types.ObjectId,
  ClientName:string,
  productCount: string,
  status:string
}

export interface products{
  _id:Types.ObjectId,
  clientId:Types.ObjectId,
  productList:productList[]
}

export interface productList{
  QaTeam:string,
  adminStatus:string,
  approved:Boolean,
  articleID:string,
  assigned:string,
  isSelected:Boolean,
  productLink:string,
  productName:string,
  productStatus:string,
  slNo:string
}

export interface team{
  QAarr:[],
  modalersAr:[]
}

export interface message{
  Arr:[],
  polygonCount:number
}

export interface messageInfo{
  adminStatus:String,
  articleId:String,
  clientId:string,
  comments:any[],
  modalStatus:string,
  _id:Types.ObjectId
}

export interface modelerLanding{
  ClientData:Array<any>,
  QATeamName:string,
  approvedClient:Boolean,
  assignedPro:[],
  clientId:string,
  modalerName:string,
  modalerRollNo:string,
  _id:string,
  modalFile?:any
}

export interface QaLanding{
  ClientData:Array<any>,
  QATeamName:string,
  approvedClient:Boolean,
  assignedPro:[],
  clientId:string,
  modalerName:string,
  modalerRollNo:string,
  _id:string
  
}





