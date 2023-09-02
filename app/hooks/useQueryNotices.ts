import * as React from "react";
import { useTranslation } from "react-i18next";
import { QueryNotices } from "@shared/types";
import useQuery from "./useQuery";
import useToasts from "./useToasts";

/**
 * Display a toast message based on a notice in the query string. This is usually
 * used when redirecting from an external source to the client, such as OAuth,
 * or emails.
 */
export default function useQueryNotices() {
  const query = useQuery();
  const { t } = useTranslation();
  const { showToast } = useToasts();
  const notice = query.get("notice") as QueryNotices;

  React.useEffect(() => {
    switch (notice) {
      case QueryNotices.UnsubscribeDocument: {
        showToast(
          t("Unsubscribed from document", {
            type: "success",
          })
        );
        break;
      }
      default:
    }
  }, [t, showToast, notice]);
}
