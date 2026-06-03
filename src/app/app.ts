import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { AuthPanel } from './components/auth-panel/auth-panel';
import { UploadArea } from './components/upload-area/upload-area';
import { AnalysisResult } from './components/analysis-result/analysis-result';
import { HistoryPanel } from './components/history-panel/history-panel';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    Header,
    AuthPanel,
    UploadArea,
    AnalysisResult,
    HistoryPanel,
    Footer
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Cilt_Beninden_Kanser');
}
