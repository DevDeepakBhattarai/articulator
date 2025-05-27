import { Sparkles } from "lucide-react";

interface AnalysisResultsProps {
  completion: string;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  completion,
}) => {
  if (!completion) return null;

  return (
    <div className="mt-8 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white">
          Speech Analysis Results
        </h2>
      </div>
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="prose prose-lg prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-gray-100 leading-relaxed font-medium">
            {completion}
          </div>
        </div>
      </div>
    </div>
  );
};
