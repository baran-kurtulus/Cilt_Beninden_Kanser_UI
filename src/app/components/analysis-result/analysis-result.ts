import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analysis-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analysis-result.html',
  styleUrl: './analysis-result.scss',
})
export class AnalysisResult {
  hasResult = false;
  riskLevel: 'low' | 'medium' | 'high' = 'low';
  riskLevelText = 'Düşük';
  confidence = 0;
  classification = 'Benign (İyi Huylu)';
  symmetry = 'Düzenli';
  borderAnalysis = 'Net Kenarlar';
  recommendation = 'Şu an için endişe verici bir durum görünmüyor. Ancak benlerinizdeki değişiklikleri düzenli olarak takip etmeye devam edin.';

  // Mock function to simulate analysis
  simulateAnalysis() {
    this.hasResult = true;
    this.riskLevel = 'low';
    this.riskLevelText = 'Düşük';
    this.confidence = 94.2;
    this.classification = 'Benign (İyi Huylu)';
    this.symmetry = 'Düzenli';
    this.borderAnalysis = 'Net Kenarlar';
    this.recommendation = 'Şu an için endişe verici bir durum görünmüyor. Ancak benlerinizdeki değişiklikleri düzenli olarak takip etmeye devam edin.';
  }
}
