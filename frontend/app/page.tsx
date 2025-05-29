"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, XCircle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

interface Receipt {
  id: number;
  purchased_at: string;
  merchant_name: string;
  total_amount: number;
  file_path: string;
  created_at: string;
}

interface ReceiptFile {
  id: number;
  file_name: string;
  file_path: string;
  is_valid: boolean;
  invalid_reason: string | null;
  is_processed: boolean;
  created_at: string;
}

export default function ReceiptProcessor() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [receiptFiles, setReceiptFiles] = useState<ReceiptFile[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast({
        title: "File uploaded successfully",
        description: `File ID: ${response.data.fileId}`,
      });
      setSelectedFile(null);
      loadReceiptFiles();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.response?.data?.error || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const validateFile = async (fileId: number) => {
    try {
      const response = await axios.get(`/api/validate?id=${fileId}`);

      toast({
        title: "Validation complete",
        description: response.data.isValid
          ? "File is valid"
          : `Invalid: ${response.data.reason}`,
      });
      loadReceiptFiles();
    } catch (error: any) {
      toast({
        title: "Validation failed",
        description: error.response?.data?.error || "Failed to validate file",
        variant: "destructive",
      });
    }
  };

  const processFile = async (fileId: number) => {
    setProcessing(true);
    try {
      const response = await axios.post(`/api/process?id=${fileId}`);

      toast({
        title: "Processing complete",
        description: "Receipt data extracted successfully",
      });
      loadReceiptFiles();
      loadReceipts();
    } catch (error: any) {
      toast({
        title: "Processing failed",
        description: error.response?.data?.error || "Failed to process file",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const loadReceipts = async () => {
    try {
      const response = await axios.get("/api/receipts");
      setReceipts(response.data);
    } catch (error) {
      console.error("Failed to load receipts:", error);
    }
  };

  const loadReceiptFiles = async () => {
    try {
      const response = await axios.get("/api/receipt-files");
      setReceiptFiles(response.data);
    } catch (error) {
      console.error("Failed to load receipt files:", error);
    }
  };

  const viewReceipt = async (id: number) => {
    try {
      if (selectedReceipt?.id === id) {
        // If clicking the same receipt, hide details
        setSelectedReceipt(null);
      } else {
        // Load and show details for the clicked receipt
        const response = await axios.get(`/api/receipts/${id}`);
        setSelectedReceipt(response.data);
      }
    } catch (error) {
      console.error("Failed to load receipt:", error);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Receipt Processing System</h1>
        <p className="text-muted-foreground">
          Upload PDF receipts, extract data using AI, and manage your receipt
          database
        </p>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Receipt
              </CardTitle>
              <CardDescription>
                Upload a PDF receipt file for processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Select PDF File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                />
              </div>

              {selectedFile && (
                <div className="p-4 border rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{selectedFile.name}</span>
                    <Badge variant="secondary">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </Badge>
                  </div>
                </div>
              )}

              <Button
                onClick={uploadFile}
                disabled={!selectedFile || uploading}
                className="w-full"
              >
                {uploading ? "Uploading..." : "Upload File"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Files</CardTitle>
              <CardDescription>Manage uploaded receipt files</CardDescription>
              <Button onClick={loadReceiptFiles} variant="outline" size="sm">
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {receiptFiles.map((file) => (
                  <div key={file.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{file.file_name}</span>
                          {file.is_valid ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Valid
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Invalid
                            </Badge>
                          )}
                          {file.is_processed && (
                            <Badge variant="secondary">Processed</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Uploaded: {new Date(file.created_at).toLocaleString()}
                        </p>
                        {file.invalid_reason && (
                          <p className="text-sm text-red-600">
                            {file.invalid_reason}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => validateFile(file.id)}
                          variant="outline"
                          size="sm"
                        >
                          Validate
                        </Button>
                        <Button
                          onClick={() => processFile(file.id)}
                          disabled={
                            !file.is_valid || file.is_processed || processing
                          }
                          size="sm"
                        >
                          {processing ? "Processing..." : "Process"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts">
          <Card>
            <CardHeader>
              <CardTitle>Processed Receipts</CardTitle>
              <CardDescription>View all extracted receipt data</CardDescription>
              <Button onClick={loadReceipts} variant="outline" size="sm">
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {receipts.map((receipt) => (
                  <div key={receipt.id} className="border rounded-lg">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {receipt.merchant_name}
                            </span>
                            <Badge variant="outline">
                              ${receipt.total_amount.toFixed(2)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Purchase Date:{" "}
                            {new Date(
                              receipt.purchased_at
                            ).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Processed:{" "}
                            {new Date(receipt.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          onClick={() => viewReceipt(receipt.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {selectedReceipt?.id === receipt.id
                            ? "Hide Details"
                            : "View Details"}
                        </Button>
                      </div>
                    </div>

                    {selectedReceipt?.id === receipt.id && (
                      <div className="border-t bg-muted/50 p-4">
                        <h4 className="font-medium mb-3">Receipt Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Receipt ID
                            </Label>
                            <p className="font-medium">{selectedReceipt.id}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Merchant Name
                            </Label>
                            <p className="font-medium">
                              {selectedReceipt.merchant_name}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Total Amount
                            </Label>
                            <p className="font-medium">
                              ${selectedReceipt.total_amount.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Purchase Date
                            </Label>
                            <p className="font-medium">
                              {new Date(
                                selectedReceipt.purchased_at
                              ).toLocaleString()}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs text-muted-foreground">
                              File Path
                            </Label>
                            <p className="font-medium text-sm break-all">
                              {selectedReceipt.file_path}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Created At
                            </Label>
                            <p className="font-medium">
                              {new Date(
                                selectedReceipt.created_at
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
