import { Component ,HostListener } from '@angular/core';
import { BackendService } from './services/backend.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = '3D Platform';

  constructor(private backEndService:BackendService){}

  // @HostListener('window:beforeunload', ['$event'])
  // onBeforeUnload(event: BeforeUnloadEvent) {
  //   this.backEndService.logout();
  // }
}
