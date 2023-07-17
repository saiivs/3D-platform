import { Directive, ElementRef, HostListener, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appActive]'
})
export class ActiveDirective implements OnInit{

  constructor(private el:ElementRef,private renderer:Renderer2) { }

 ngOnInit(): void {
  let myborder = document.getElementsByClassName('myborder');
  myborder[0].classList.add('active')
   
 }

  @HostListener('click')
  activeElement(){
    let myborder = document.getElementsByClassName('myborder');
    for(let i = 0; i<myborder.length; i++){
      myborder[i].classList.remove('active')
    }
    this.renderer.addClass(this.el.nativeElement,'active');
  }

}
