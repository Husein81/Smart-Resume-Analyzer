import AnalysisDetails from "./AnalysisDetails";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resumeId = (await params).id;
  return <AnalysisDetails resumeId={resumeId} />;
}
