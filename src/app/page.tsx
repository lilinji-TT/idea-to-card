"use client";

import CardTemplate from "@/components/CardTemplate";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Toaster, toast } from "sonner";

// Define the structure for a card
interface CardData {
  text: string;
}

export default function Home() {
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<CardData[]>([]);

  const handleGenerateClick = async () => {
    if (!inputText.trim()) {
      toast.error("请输入一些文本内容。");
      return; // Prevent API call if input is empty
    }

    setIsLoading(true);
    setError(null);
    setCards([]); // Clear previous results

    try {
      console.log("Calling API /api/generate with text:", inputText);
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      // Check if the response is ok (status code 200-299)
      if (!response.ok) {
        let errorMsg = "生成卡片时出错";
        try {
          // Try to parse the error response from the backend
          const errorData = await response.json();
          errorMsg = errorData.message || `服务器错误 ${response.status}`;
        } catch {
          // If parsing fails, use the status text (no need for the error object here)
          errorMsg = `服务器错误 ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      // Parse the successful JSON response
      const data = await response.json();

      // Validate the response structure
      if (data.cards && Array.isArray(data.cards)) {
        setCards(data.cards);
        toast.success("卡片生成成功！");
      } else {
        // This case should ideally be caught by the backend validation,
        // but good to have a fallback here.
        console.error("API returned invalid data format:", data);
        throw new Error("API 返回了无效的数据格式");
      }
    } catch (err) {
      // Let TypeScript infer type as unknown
      console.error("API Call Error:", err);
      let message = "发生未知网络错误，请检查网络连接或稍后重试";
      if (err instanceof Error) {
        message = err.message; // Use message from Error object if available
      }
      // Optionally handle other error types here if needed
      setError(message);
      toast.error(message); // Show error toast
    } finally {
      setIsLoading(false); // Always set loading to false when done
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 flex flex-col items-center gap-8 min-h-screen">
      <Toaster richColors position="top-center" />
      <h1 className="text-3xl font-bold text-center">一念成卡 ✨</h1>
      <p className="text-muted-foreground text-center">
        输入你的想法、文案或笔记，快速生成精美卡片。
      </p>

      <div className="w-full max-w-xl flex flex-col gap-4">
        <Textarea
          placeholder="在这里输入你的想法、文案或笔记..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={6}
          className="resize-none"
          disabled={isLoading}
        />
        <Button
          onClick={handleGenerateClick}
          disabled={isLoading || !inputText.trim()}
          size="lg"
        >
          {isLoading ? "正在生成中..." : "生成卡片"}
        </Button>
      </div>

      <div className="w-full max-w-4xl mt-8">
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && !isLoading && (
          <Alert variant="destructive" className="max-w-xl mx-auto">
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && cards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card, index) => (
              <CardTemplate key={index} id={`card-${index}`} text={card.text} />
            ))}
          </div>
        )}

        {!isLoading && !error && cards.length === 0 && (
          <p className="text-center text-muted-foreground">
            点击&ldquo;生成卡片&rdquo;按钮开始创建。
          </p>
        )}
      </div>
    </div>
  );
}
