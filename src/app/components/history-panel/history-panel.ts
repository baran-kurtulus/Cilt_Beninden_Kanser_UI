import { Component, computed, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalysisService, AnalysisResultDto } from '../../services/analysis.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-history-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history-panel.html',
  styleUrl: './history-panel.scss',
})
export class HistoryPanel implements OnInit {
  private readonly analysisService = inject(AnalysisService);
  private readonly auth = inject(AuthService);

  readonly history = this.analysisService.history;
  readonly historyStatus = this.analysisService.historyStatus;
  readonly historyError = this.analysisService.historyError;
  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly overlayUrls = this.analysisService.overlayUrls;

  readonly isEmpty = computed(() => this.historyStatus() === 'success' && this.history().length === 0);
  readonly isNotLoaded = computed(() => this.historyStatus() === 'idle');

  constructor() {
    effect(() => {
      const items = this.history();
      if (items.length > 0) {
        for (const item of items) {
          this.analysisService.loadOverlay(item.id);
        }
      }
    });
  }

  ngOnInit(): void {
    if (this.isAuthenticated() && this.historyStatus() === 'idle') {
      this.analysisService.loadHistory().subscribe();
    }
  }

  refresh(): void {
    this.analysisService.loadHistory().subscribe();
  }

  overlaySrc(id: string): string | null {
    return this.overlayUrls()[id] ?? null;
  }

  riskLevel(item: AnalysisResultDto): 'low' | 'medium' | 'high' {
    const normalized = this.normalizedLabel(item);
    if (normalized === 'malignant') {
      return 'high';
    }

    if (normalized === 'uncertain') {
      return 'medium';
    }

    if (item.confidence < 0.7) {
      return 'medium';
    }

    return 'low';
  }

  riskLabel(item: AnalysisResultDto): string {
    switch (this.riskLevel(item)) {
      case 'high':
        return 'Yüksek';
      case 'medium':
        return 'Orta';
      default:
        return 'Düşük';
    }
  }

  confidence(item: AnalysisResultDto): number {
    if (item.confidencePercent) {
      const cleaned = item.confidencePercent.replace('%', '').replace(',', '.');
      const parsed = Number(cleaned);
      if (Number.isFinite(parsed)) {
        return Math.min(100, Math.max(0, parsed));
      }
    }

    const computedValue = Math.round(item.confidence * 1000) / 10;
    return Math.min(100, Math.max(0, computedValue));
  }

  classification(item: AnalysisResultDto): string {
    const normalized = this.normalizedLabel(item);
    switch (normalized) {
      case 'malignant':
        return 'Malignant (Kötü Huylu)';
      case 'uncertain':
        return 'Belirsiz (Daha Fazla İnceleme)';
      default:
        return 'Benign (İyi Huylu)';
    }
  }

  recommendation(item: AnalysisResultDto): string {
    if (item.recommendation) {
      return item.recommendation;
    }

    const normalized = this.normalizedLabel(item);
    const conf = this.confidence(item);

    if (normalized === 'malignant') {
      if (conf >= 90) {
        return 'Analiz sonucu yüksek güvenle kötü huylu olarak değerlendirildi. En kısa sürede bir dermatoloğa başvurmanız ve profesyonel değerlendirme almanız önemle tavsiye edilir. Erken teşhis tedavi başarısını önemli ölçüde artırmaktadır.';
      }
      if (conf >= 80) {
        return 'Analiz sonucu yüksek güvenle kötü huylu olarak değerlendirildi. Bir dermatoloğa başvurarak dermatoskopik inceleme yaptırmanız önerilir. Kesin tanı için doktorunuz gerekli tetkikleri planlayacaktır.';
      }
      return 'Analiz sonucu kötü huylu olarak değerlendirildi ancak güven düzeyi görece düşüktür. Yanlış pozitif olma ihtimaline karşı bir dermatoloğa başvurarak profesyonel değerlendirme almanızı öneririz. Dermatoskopik inceleme ve gerekirse biyopsi ile kesin tanı konulabilir.';
    }

    if (normalized === 'uncertain') {
      if (conf >= 60) {
        return 'Analiz sonucu net değil. Görüntü kalitesi veya benin konumu sonucu etkilemiş olabilir. Daha iyi ışıklandırma ile yakın çekim bir fotoğraf kullanarak tekrar analiz yapmanızı öneririz. Sonuç yine belirsiz çıkarsa bir dermatoloğa danışarak dermatoskopik inceleme yaptırın.';
      }
      return 'Analiz sonucu belirsiz ve güven düzeyi düşük. Büyük olasılıkla görüntü kalitesi yetersiz ya da ben yeterince net görünmüyor. Daha net, iyi odaklanmış ve yakın çekim bir fotoğraf ile yeniden deneyin. Alternatif olarak doğrudan bir dermatoloğa başvurarak profesyonel değerlendirme almanızı öneririz.';
    }

    if (conf >= 95) {
      return 'Analiz sonucu yüksek güvenle iyi huylu olarak değerlendirildi. Herhangi bir risk belirtisi görülmemektedir. Yine de benlerinizi düzenli aralıklarla kontrol etmenizi; şekil, renk, boyut veya sınırlarında değişiklik fark etmeniz durumunda bir dermatoloğa başvurmanızı öneririz.';
    }

    if (conf >= 85) {
      return 'Analiz sonucu iyi huylu olarak değerlendirildi. Güven düzeyi yüksektir ancak kesin tanı değildir. Benlerinizde asimetri, düzensiz sınır, renk değişikliği veya büyüme gibi değişiklikler olursa bir dermatoloğa başvurun. Yılda bir kez dermatolojik muayene önerilir.';
    }

    return 'Analiz sonucu iyi huylu olarak değerlendirildi ancak güven düzeyi orta seviyededir. Daha net bir sonuç için farklı açıdan veya daha yüksek çözünürlüklü bir fotoğrafla tekrar analiz yapabilirsiniz. Şüphe durumunda mutlaka bir dermatoloğa başvurun.';
  }

  formatDate(value: string): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString('tr-TR');
  }

  private normalizedLabel(item: AnalysisResultDto): string {
    if (!item?.label) {
      return 'benign';
    }

    return item.label.toLowerCase();
  }
}
