import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function PlaceholderPage() {
  const location = useLocation();
  const name = location.pathname.split("/").pop() || "Page";

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full shadow-sm">
        <CardContent className="text-center py-12 space-y-3">
          <Construction className="w-12 h-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground capitalize">{name}</h3>
          <p className="text-sm text-muted-foreground">
            This module is under development and will be available in the next release.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
