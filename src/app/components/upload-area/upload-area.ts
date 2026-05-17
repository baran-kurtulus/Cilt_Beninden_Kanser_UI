import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upload-area',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload-area.html',
  styleUrl: './upload-area.scss',
})
export class UploadArea implements OnDestroy {
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;

  previewUrl: string | null = null;
  isDragging = false;
  isCameraOpen = false;
  cameraError: string | null = null;
  private mediaStream: MediaStream | null = null;
  readonly isCameraSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  onFileSelected(event: Event) {
    this.stopCamera();
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readerEvent: ProgressEvent<FileReader>) => {
        this.previewUrl = typeof readerEvent.target?.result === 'string' ? readerEvent.target.result : null;
      };
      reader.readAsDataURL(file);
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
    this.previewUrl = canvas.toDataURL('image/jpeg');
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
    this.cameraError = null;
    this.stopCamera();
  }

  ngOnDestroy() {
    this.stopCamera();
  }
}
