import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'frontend';

  constructor (private router: Router) {}

  currentTime: string = '';
  currentDate: string = '';
  intervalId: any;

  ngOnInit(): void {
    this.updateTimeAndDate();

    this.intervalId = setInterval(() => {
      this.updateTimeAndDate();
    }, 1000)
  }

  user = {
    username: 'Chirath'
  };



  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  updateTimeAndDate(): void {
    const now = new Date();

    // Time format: HH:MM:SS
    this.currentTime = now.toLocaleTimeString('en-US', { hour12: false });

    // Date format: Sunday, February 15, 2026
    this.currentDate = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  goToVehicles() {
    this.router.navigate(['/vehicles']);
  }

  goToDashboard() {
    this.router.navigate(['/']);
  }

  goToServiceRec() {
    this.router.navigate(['/serviceRecords']);
  }

  goToImportExport() {
    this.router.navigate(['/importExport']);
  }

  isOnDashboard(): boolean {
    return this.router.url === '/' || this.router.url === '/dashboard' || this.router.url === '';
  }

  isOnVehicles(): boolean {
    return this.router.url === '/vehicles';
  }

  isOnServiceRec(): boolean {
    return this.router.url === '/serviceRecords';
  }

}
