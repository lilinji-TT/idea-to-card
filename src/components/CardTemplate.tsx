import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toPng } from "html-to-image"; // Import html-to-image function
import { Download } from "lucide-react"; // Import an icon for the button
import React, { useRef } from "react"; // Import useRef
import { toast } from "sonner"; // Import toast for feedback

interface CardTemplateProps {
  id: string; // Keep ID for key prop or other uses, but ref is primary for download
  text: string;
  // Add more props later if needed (e.g., style variants)
}

const CardTemplate: React.FC<CardTemplateProps> = ({ id, text }) => {
  // Create a ref for the element to be converted to image
  const cardContentRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardContentRef.current) {
      toast.error("无法找到卡片内容元素");
      console.error("Card content ref is not available.");
      return;
    }

    toast.info("正在生成图片...", { duration: 2000 }); // Optional: inform user

    try {
      // Get the DOM node from the ref
      const node = cardContentRef.current;

      // Generate the PNG data URL
      // Options like cacheBust can help avoid stale images
      // backgroundColor can ensure transparency is handled (or set a specific bg)
      const dataUrl = await toPng(node, {
        cacheBust: true,
        backgroundColor: "#ffffff",
      }); // Use white background

      // Create a temporary link element
      const link = document.createElement("a");
      link.download = `一念成卡-${id}.png`; // Set desired filename
      link.href = dataUrl;

      // Trigger the download
      link.click();

      // Clean up the temporary link (optional but good practice)
      link.remove();

      toast.success("卡片图片已开始下载！");
    } catch (error) {
      console.error("图片生成或下载失败:", error);
      toast.error("图片生成失败，请稍后重试。");
    }
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out overflow-hidden flex flex-col">
      {/* Attach the ref to this div - this is what gets captured */}
      <div
        ref={cardContentRef} // Assign the ref here
        className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 aspect-[9/16] flex flex-col justify-center items-center flex-grow" // Added flex-grow
      >
        <CardContent className="flex items-center justify-center h-full w-full">
          {" "}
          {/* Ensure content takes full space */}
          <p className="text-center text-xl font-medium text-gray-800 break-words leading-relaxed whitespace-pre-wrap">
            {text}
          </p>
        </CardContent>
      </div>
      {/* Download button section */}
      <div className="p-4 bg-white border-t border-gray-200 flex justify-center flex-shrink-0">
        {" "}
        {/* Added flex-shrink-0 */}
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          下载卡片
        </Button>
      </div>
    </Card>
  );
};

export default CardTemplate;
