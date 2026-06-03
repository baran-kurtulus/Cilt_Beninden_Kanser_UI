import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  constructor(public auth: AuthService) {}

  logout(): void {
    this.auth.logout();
  }

  scrollToHistory(event: Event): void {
    event.preventDefault();
    const el = document.querySelector('.history-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
