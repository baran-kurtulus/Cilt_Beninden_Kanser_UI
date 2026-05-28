import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalysisService, AnalysisResultDto } from '../../services/analysis.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-analysis-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analysis-result.html',
  styleUrl: './analysis-result.scss',
})
export class AnalysisResult {
  private readonly analysisService = inject(AnalysisService);
  private readonly auth = inject(AuthService);

  readonly result = this.analysisService.result;
  readonly status = this.analysisService.status;
  readonly errorMessage = this.analysisService.errorMessage;
  readonly isAuthenticated = this.auth.isAuthenticated;

  readonly riskLevel = computed<'low' | 'medium' | 'high'>(() => {
    const data = this.result();
    if (!data) {
      return 'low';
    }

    const normalized = this.normalizedLabel(data);
    if (normalized === 'malignant') {
      return 'high';
    }

    if (normalized === 'uncertain') {
      return 'medium';
    }

    if (data.confidence < 0.7) {
      return 'medium';
    }

    return 'low';
  });

  readonly riskLevelText = computed(() => {
    switch (this.riskLevel()) {
      case 'high':
        return 'Yüksek';
      case 'medium':
        return 'Orta';
      default:
        return 'Düşük';
    }
  });

  readonly confidencePercent = computed(() => {
    const data = this.result();
    if (!data) {
      return 0;
    }

    if (data.confidencePercent) {
      const cleaned = data.confidencePercent.replace('%', '').replace(',', '.');
      const parsed = Number(cleaned);
      if (Number.isFinite(parsed)) {
        return Math.min(100, Math.max(0, parsed));
      }
    }

    const computedValue = Math.round(data.confidence * 1000) / 10;
    return Math.min(100, Math.max(0, computedValue));
  });

  readonly classification = computed(() => {
    const normalized = this.normalizedLabel(this.result());
    switch (normalized) {
      case 'malignant':
        return 'Malignant (Kötü Huylu)';
      case 'uncertain':
        return 'Belirsiz (Daha Fazla İnceleme)';
      default:
        return 'Benign (İyi Huylu)';
    }
  });

  readonly recommendation = computed(() => {
    const data = this.result();
    if (!data) {
      return '';
    }

    if (data.recommendation) {
      return data.recommendation;
    }

    if (this.riskLevel() === 'high') {
      return 'Lütfen bir dermatoloğa başvurunuz ve en kısa sürede profesyonel değerlendirme alın.';
    }

    if (this.riskLevel() === 'medium') {
      return 'Sonuç belirsiz. Yüksek çözünürlüklü bir görüntü ile tekrar analiz veya uzman görüşü önerilir.';
    }

    return 'Şu an için endişe verici bir durum görünmüyor. Benlerinizdeki değişimleri takip etmeyi unutmayın.';
  });

  readonly modelVersion = computed(() => this.result()?.modelVersion ?? '-');
  readonly createdAt = computed(() => this.formatDate(this.result()?.createdAt));

  private normalizedLabel(data: AnalysisResultDto | null | undefined): string {
    if (!data?.label) {
      return 'benign';
    }

    return data.label.toLowerCase();
  }

  private formatDate(value: string | undefined): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString('tr-TR');
  }
}
