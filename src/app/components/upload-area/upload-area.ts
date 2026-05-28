import { Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalysisService } from '../../services/analysis.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-upload-area',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload-area.html',
  styleUrl: './upload-area.scss',
})
export class UploadArea implements OnDestroy {
  private readonly analysisService = inject(AnalysisService);
  private readonly auth = inject(AuthService);

  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  previewName: string | null = null;
  isDragging = false;
  isCameraOpen = false;
  cameraError: string | null = null;
  actionError: string | null = null;
  private mediaStream: MediaStream | null = null;
  readonly isCameraSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly analysisStatus = this.analysisService.status;

  onFileSelected(event: Event) {
    this.stopCamera();
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.setPreviewFromFile(file);
    }
  }

  async startCamera() {
    if (!this.isCameraSupported) {
      this.cameraError = 'Tarayıcı kamera erişimini desteklemiyor.';
      return;
    }

    this.stopCamera();
    this.cameraError = null;
    this.previewUrl = null;
    this.isCameraOpen = true;

    try {
      await new Promise<void>((resolve) => setTimeout(resolve));
      const videoElement = this.videoElement?.nativeElement;
      if (!videoElement) {
        throw new Error('Video elementi bulunamadı');
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      videoElement.srcObject = this.mediaStream;
      await videoElement.play();
      this.isCameraOpen = true;
    } catch {
      this.cameraError = 'Kamera açılamadı. Lütfen izin verdiğinizden emin olun.';
      this.isCameraOpen = false;
    }
  }

  capturePhoto() {
    if (!this.isCameraOpen) {
      return;
    }

    const videoElement = this.videoElement?.nativeElement;
    if (!videoElement) {
      this.cameraError = 'Kamera görüntüsü alınamadı.';
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      this.cameraError = 'Fotoğraf yakalanamadı.';
      return;
    }

    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          this.cameraError = 'Fotoğraf yakalanamadı.';
          return;
        }
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
        this.setPreviewFromFile(file);
      },
      'image/jpeg',
      0.92
    );
    this.stopCamera();
  }

  stopCamera() {
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.srcObject = null;
    }
    this.isCameraOpen = false;
  }

  clearSelection() {
    this.previewUrl = null;
    this.previewName = null;
    this.selectedFile = null;
    this.cameraError = null;
    this.actionError = null;
    this.analysisService.reset();
    this.stopCamera();
  }

  startAnalysis() {
    if (!this.selectedFile) {
      this.actionError = 'Analiz için önce bir görüntü seçin.';
      return;
    }

    if (!this.isAuthenticated()) {
      this.actionError = 'Analiz başlatmak için giriş yapmalısınız.';
      return;
    }

    this.actionError = null;
    this.analysisService.analyze(this.selectedFile).subscribe({
      error: () => {
        this.actionError = this.analysisService.errorMessage();
      },
    });
  }

  private setPreviewFromFile(file: File) {
    this.selectedFile = file;
    this.previewName = file.name;
    this.actionError = null;
    this.analysisService.reset();

    const reader = new FileReader();
    reader.onload = (readerEvent: ProgressEvent<FileReader>) => {
      this.previewUrl = typeof readerEvent.target?.result === 'string' ? readerEvent.target.result : null;
    };
    reader.readAsDataURL(file);
  }

  ngOnDestroy() {
    this.stopCamera();
  }
}
