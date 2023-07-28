import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BackendService } from 'src/app/services/backend.service';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { CorrectionImageComponent } from '../../correction-image/correction-image.component'
import { environment } from '../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-modeler-correction-view',
  templateUrl: './modeler-correction-view.component.html',
  styleUrls: ['./modeler-correction-view.component.css'],
})

export class ModelerCorrectionViewComponent implements OnInit{
  
  constructor(private route:ActivatedRoute,private backEndService:BackendService,private renderer:Renderer2,private openDilog:MatDialog){}

  articleId:string = "";
  clientId:string = "";
  version:number = 0;
  src:string = "";
  versionTracker:string = "";
  result:Array<any>=[]
  correctionsWithVersions:Array<any> = [];
  tabPanels:Array<any> = [];
  clientDetails:any = {};
  clientName:string = "";
  noCorrections:boolean = false;
  hotspots:Array<any> = [];
  @ViewChild('modelTest',{ static: false }) modelTest!: ElementRef;
  ngOnInit(): void {
    this.clientId = this.route.snapshot.params['clientId'];
    this.articleId = this.route.snapshot.params['articleId'];
    this.version = this.route.snapshot.params['version'];
    this.backEndService.getClientDetailsForQADo(this.clientId).subscribe((res)=>{
      this.clientDetails = res
      const regex = /[^a-zA-Z0-9]/g;
      this.clientName = this.clientDetails.clientName.replace(regex,"_")
      
      this.backEndService.getLatestCorrection(this.clientId,this.articleId).subscribe((res)=>{
        if(res.status){
          console.log({res});
          
          this.tabPanels = Array(res.data[0].version).fill(1).map((_, index) => `Version ${index+1}`);
          // this.tabPanels = Array(res[0].version).fill(1).map((_, index) => `version ${index+1}`);
          this.tabPanels.reverse()
          this.hotspots = res.data;
          this.correctionsWithVersions = this.hotspots.reduce((result,hotspot)=>{
            const {version} = hotspot;
            if(!result[version]) result[version] = [];
            result[version].push(hotspot)
            return result
          },{})
          this.result = Object.keys(this.correctionsWithVersions).map((key:any)=>{
            return {[key]:this.correctionsWithVersions[key]}
           })
                      
          this.hotspots.forEach((hotspot,index)=>{
            this.addHotspotInitially(hotspot.normalValue,hotspot.positionValue,hotspot.hotspotName,index+1)
          })
        }else{
          this.noCorrections = true;
        }
          
      })
    })
    
  }

  onTabChange(event:MatTabChangeEvent){
    let versionTxt= event.tab.textLabel;
    let version = Number(versionTxt.split(" ")[1]);
    this.versionTracker = `version-${version}`
    if(version == this.version){
      this.src = `${environment.staticUrl}/models/${this.clientName}/${this.articleId}/version-${version}/${this.articleId}.glb`;
    }else if(version < this.version){
      this.src = `${environment.staticUrl}/models/${this.clientName}/${this.articleId}/version-${this.version - 1}/${this.articleId}.glb`;
    } 
    
    this.backEndService.getHotspotwithVersion(version,this.clientId,this.articleId).subscribe((res)=>{
      if(res){
        this.hotspots = res;
        this.hotspots.forEach(hotspot => hotspot.corrImg = `${environment.staticUrl}/corrections/${this.clientName}/${this.articleId}/version-${hotspot.version}/${hotspot._id}.jpg`)
      }   
    })
  }

  imageNotFound(index:number){
    this.hotspots[index].corrImg = false;
  }

  openCorrectionImg(imgLink:string){
    let url = imgLink
   this.openDilog.open(CorrectionImageComponent,{
      width:"32rem",
      data:url
    })
  }

  
  addHotspotInitially(normal:string,position:string,name:string,hotSpotId:number){
    const hotspot = this.renderer.createElement('button');
    this.renderer.addClass(hotspot,'hotspot');
    this.renderer.setAttribute(hotspot,'slot',name);
    this.renderer.setAttribute(hotspot,'data-position',position);
    this.renderer.setAttribute(hotspot, 'data-normal',normal);
    const buttonText = this.renderer.createText(`${hotSpotId}`);
    this.renderer.setStyle(hotspot, 'width', '25px');
    this.renderer.setStyle(hotspot, 'height', '25px');
    this.renderer.setStyle(hotspot,'font-size', '10px');
    this.renderer.appendChild(hotspot, buttonText);
    this.renderer.setAttribute(hotspot, 'data-visibility-attribute', 'visible');
    this.modelTest.nativeElement.appendChild(hotspot);
  }

}
