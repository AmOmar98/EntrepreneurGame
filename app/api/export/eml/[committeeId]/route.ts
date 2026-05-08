import { committeeBody, getCommittee } from "@/lib/data";

function encodeSubject(subject: string) {
  return `=?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ committeeId: string }> },
) {
  const { committeeId } = await params;
  const committee = getCommittee(committeeId);
  const subject = `Convocation comite ${committee.cohort}`;
  const body = committeeBody(committee.id);
  const eml = [
    `To: ${committee.members.map((member) => member.email).join(", ")}`,
    `Subject: ${encodeSubject(subject)}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    "",
    body,
  ].join("\r\n");

  return new Response(eml, {
    headers: {
      "Content-Type": "message/rfc822",
      "Content-Disposition": `attachment; filename="convocation-${committee.id}.eml"`,
    },
  });
}
