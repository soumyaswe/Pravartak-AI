"use client";

import { useRef } from "react";
import { Download, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function CoverLetterPreview({ content }) {
  const previewRef = useRef(null);

  const handleDownload = async () => {
    try {
      // Load html2pdf from CDN if not already loaded
      if (!window.html2pdf) {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
        script.async = true;
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      const element = previewRef.current;
      if (!element) {
        toast.error("Preview not available");
        return;
      }

      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: "Cover_Letter.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      };

      await window.html2pdf().from(element).set(opt).save();
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download PDF");
    }
  };

  if (!content) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">No content available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Cover Letter</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={previewRef}
          className="bg-white text-black rounded-lg shadow-lg p-[1in] min-h-[11in] w-full max-w-[8.5in] mx-auto"
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: "11pt",
            lineHeight: "1.5",
          }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </CardContent>
    </Card>
  );
}
