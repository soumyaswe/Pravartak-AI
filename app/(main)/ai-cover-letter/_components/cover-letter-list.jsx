"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FileText, Trash2, Eye, Download, MoreVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function CoverLetterList({ coverLetters = [] }) {
  const [letters, setLetters] = useState(coverLetters);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/cover-letters/${deleteId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setLetters(letters.filter((letter) => letter.id !== deleteId));
        toast.success("Cover letter deleted successfully");
      } else {
        toast.error(data.error || "Failed to delete cover letter");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete cover letter");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleDownload = async (letter) => {
    try {
      // Create a temporary div to hold the content
      const element = document.createElement("div");
      element.innerHTML = letter.content;
      element.style.padding = "1in";
      element.style.fontFamily = "'Times New Roman', Times, serif";
      element.style.fontSize = "11pt";
      element.style.lineHeight = "1.5";
      element.style.background = "white";
      element.style.color = "black";

      // Append to body temporarily
      document.body.appendChild(element);

      // Use html2pdf if available
      if (window.html2pdf) {
        const opt = {
          margin: [0.5, 0.5, 0.5, 0.5],
          filename: `${letter.companyName || "Cover_Letter"}_${letter.jobTitle || "Position"}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        };

        await window.html2pdf().from(element).set(opt).save();
        toast.success("PDF downloaded successfully");
      } else {
        toast.error("PDF download not available. Please open the letter and download from there.");
      }

      // Remove temporary element
      document.body.removeChild(element);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download PDF");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "DRAFT":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "FINAL":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "SENT":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  if (!letters || letters.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No cover letters yet</h3>
          <p className="text-muted-foreground text-center mb-4">
            Create your first AI-generated cover letter to get started
          </p>
          <Link href="/ai-cover-letter/new">
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Create Cover Letter
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {letters.map((letter) => (
          <Card key={letter.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg mb-1 truncate">
                    {letter.jobTitle || "Untitled Position"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground truncate">
                    {letter.companyName || "No company specified"}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <Link href={`/ai-cover-letter/${letter.id}`}>
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem onClick={() => handleDownload(letter)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => setDeleteId(letter.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={getStatusColor(letter.status)}>
                    {letter.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {letter.updatedAt
                      ? formatDistanceToNow(new Date(letter.updatedAt), {
                          addSuffix: true,
                        })
                      : "Recently"}
                  </span>
                </div>

                {letter.jobDescription && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {letter.jobDescription}
                  </p>
                )}

                {letter.wordCount && (
                  <p className="text-xs text-muted-foreground">
                    {letter.wordCount} words
                  </p>
                )}

                <Link href={`/ai-cover-letter/${letter.id}`} className="block">
                  <Button variant="outline" className="w-full" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Letter
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your cover
              letter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
