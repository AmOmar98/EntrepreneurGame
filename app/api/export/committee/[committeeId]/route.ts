import { csvResponse, toCsv } from "@/lib/csv";
import { committeeDossierRows } from "@/lib/data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ committeeId: string }> },
) {
  const { committeeId } = await params;
  return csvResponse(`committee-${committeeId}.csv`, toCsv(committeeDossierRows(committeeId)));
}
