/// <reference types="vite/client" />

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface Window {
  deferredPrompt: BeforeInstallPromptEvent | null;
}

// Declarações manuais para bibliotecas importadas via CDN/ESM no importmap

declare module 'jspdf' {
  export default class jsPDF {
    constructor(options?: any);
    setFillColor(r: number, g: number, b: number): void;
    rect(x: number, y: number, w: number, h: number, style?: string): void;
    setFontSize(size: number): void;
    setTextColor(r: number, g: number, b: number): void;
    setTextColor(color: number): void;
    setFont(fontName: string, fontStyle?: string): void;
    text(text: string, x: number, y: number, options?: any): void;
    save(filename: string): void;
    setPage(page: number): void;
  }
}

declare module 'jspdf-autotable' {
  import jsPDF from 'jspdf';
  export default function autoTable(doc: jsPDF, options: any): void;
}
