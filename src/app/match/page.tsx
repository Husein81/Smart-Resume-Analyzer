export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ resumeId: string }>;
}) {
  const { resumeId } = await searchParams;
  return <div>{resumeId}</div>;
}
