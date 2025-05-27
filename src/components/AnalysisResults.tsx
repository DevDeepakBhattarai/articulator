import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AnalysisResultsProps {
  completion: string;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  completion,
}) => {
  if (!completion) return null;

  return (
    <div className="mt-4 sm:mt-6 bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/20 shadow-2xl p-3 sm:p-4 lg:p-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="p-1.5 sm:p-2 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-lg sm:rounded-xl">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
          Speech Analysis Results
        </h2>
      </div>
      <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10">
        <div className="prose prose-sm sm:prose prose-invert max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <p className="text-gray-100 leading-relaxed text-sm sm:text-base mb-4">
                  {children}
                </p>
              ),
              h1: ({ children }) => (
                <h1 className="text-gray-100 text-lg sm:text-xl font-bold mb-3">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-gray-100 text-base sm:text-lg font-semibold mb-2">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-gray-100 text-sm sm:text-base font-medium mb-2">
                  {children}
                </h3>
              ),
              ul: ({ children }) => (
                <ul className="text-gray-100 list-disc list-inside mb-4 space-y-1">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="text-gray-100 list-decimal list-inside mb-4 space-y-1">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="text-gray-100 text-sm sm:text-base">
                  {children}
                </li>
              ),
              strong: ({ children }) => (
                <strong className="text-white font-semibold">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="text-gray-200 italic">{children}</em>
              ),
            }}
          >
            {completion}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
