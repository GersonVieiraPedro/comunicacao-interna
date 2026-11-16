import { redirect } from "next/navigation";

/** Links úteis ficam na página FAQ. */
export default function UsefulLinksRedirectPage() {
  redirect("/faq");
}
