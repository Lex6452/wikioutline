import fractionalIndex from "fractional-index";
import { observer } from "mobx-react";
import * as React from "react";
import { useDrop } from "react-dnd";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Star from "~/models/Star";
import DelayedMount from "~/components/DelayedMount";
import Flex from "~/components/Flex";
import usePaginatedRequest from "~/hooks/usePaginatedRequest";
import useStores from "~/hooks/useStores";
import DropCursor from "./DropCursor";
import Header from "./Header";
import PlaceholderCollections from "./PlaceholderCollections";
import Relative from "./Relative";
import SidebarLink from "./SidebarLink";
import StarredContext from "./StarredContext";
import StarredLink from "./StarredLink";

const STARRED_PAGINATION_LIMIT = 10;

function Starred() {
  const { stars } = useStores();
  const { t } = useTranslation();

  const { data, loading, next, end, error } = usePaginatedRequest<Star>(
    stars.fetchPage,
    {
      limit: STARRED_PAGINATION_LIMIT,
    }
  );

  // Drop to reorder document
  const [{ isOverReorder, isDraggingAnyStar }, dropToReorder] = useDrop({
    accept: "star",
    drop: async (item: { star: Star }) => {
      void item.star.save({
        index: fractionalIndex(null, stars.orderedData[0].index),
      });
    },
    collect: (monitor) => ({
      isOverReorder: !!monitor.isOver(),
      isDraggingAnyStar: monitor.getItemType() === "star",
    }),
  });

  if (error) {
    toast.error(t("Could not load starred documents"));
  }

  if (!data) {
    return null;
  }

  return (
    <StarredContext.Provider value={true}>
      <Flex column>
        <Header id="starred" title={t("Starred")}>
          <Relative>
            {isDraggingAnyStar && (
              <DropCursor
                isActiveDrop={isOverReorder}
                innerRef={dropToReorder}
                position="top"
              />
            )}
            {data.map((star) => (
              <StarredLink key={star.id} star={star} />
            ))}
            {!end && (
              <SidebarLink
                onClick={next}
                label={`${t("Show more")}…`}
                disabled={stars.isFetching}
                depth={0}
              />
            )}
            {loading && (
              <Flex column>
                <DelayedMount>
                  <PlaceholderCollections />
                </DelayedMount>
              </Flex>
            )}
          </Relative>
        </Header>
      </Flex>
    </StarredContext.Provider>
  );
}

export default observer(Starred);
