import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { previewAudienceCount } from "@/services/communication-service";
import { toPublicError } from "@/lib/errors";

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const formData = await request.formData();
    const audienceType = formString(formData, "audienceType") || "ALL";
    const targets: Array<{ targetType: string; targetValue: string }> = [];
    const add = (targetType: string, key: string) => {
      const targetValue = formString(formData, key).trim();
      if (targetValue) targets.push({ targetType, targetValue });
    };
    add("CONTRACT_STATUS", "filterContractStatus");
    add("CONTRACT_TYPE", "filterContractType");
    add("ECONOMIC_GROUP", "filterEconomicGroup");
    add("CNPJ", "filterCnpj");
    add("HEALTH_PLAN", "filterHealthPlan");
    add("REIMBURSEMENT_CARD", "filterReimbursementCard");
    add("USER_ID", "filterUserId");

    const count = await previewAudienceCount(session?.user, { audienceType, targets });
    return NextResponse.json({ count });
  } catch (error) {
    const pub = toPublicError(error);
    return NextResponse.json(pub, { status: pub.status ?? 400 });
  }
}
