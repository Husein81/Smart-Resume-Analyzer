import MatchDetails from "./MatchDetails";

export default async function MatchPage({
  searchParams,
}: {
  searchParams: Promise<{ resumeId: string }>;
}) {
  const { resumeId } = await searchParams;

  return <MatchDetails resumeId={resumeId} />;
}
