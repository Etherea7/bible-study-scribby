import { BookText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface PassageDisplayProps {
  reference: string;
  text: string;
}

export function PassageDisplay({ reference, text }: PassageDisplayProps) {
  // Process verse numbers in the text
  // ESV API returns verse numbers as plain numbers followed by a space
  const processedText = text.replace(/(\d+)\s/g, '<sup>$1</sup> ');

  return (
    <Card className="sticky top-20 lg:top-24" variant="elevated">
      <CardHeader className="border-b-0 pb-2">
        <div className="flex items-center gap-2 text-[var(--color-accent)]">
          <BookText className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-widest">Scripture</span>
        </div>
        <CardTitle as="h2" className="mt-1">{reference}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div
          className="passage-text"
          dangerouslySetInnerHTML={{ __html: processedText }}
        />
      </CardContent>
    </Card>
  );
}
