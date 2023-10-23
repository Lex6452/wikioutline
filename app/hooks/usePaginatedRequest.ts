import uniqBy from "lodash/uniqBy";
import * as React from "react";
import { PaginationParams } from "~/types";
import useRequest from "./useRequest";

type RequestResponse<T> = {
  /** The return value of the paginated request function. */
  data: T[] | undefined;
  /** The request error, if any. */
  error: unknown;
  /** Whether the request is currently in progress. */
  loading: boolean;
  /** Function to trigger next page request. */
  next: () => void;
  /** Marks the end of pagination */
  end: boolean;
};

const INITIAL_OFFSET = 0;
const DEFAULT_LIMIT = 10;

/**
 * A hook to make paginated API request and track its state within a component.
 *
 * @param requestFn The function to call to make the request, it should return a promise.
 * @param params Pagination params(limit, offset etc) to be passed to requestFn.
 * @returns
 */
export default function usePaginatedRequest<T = unknown>(
  requestFn: (params?: PaginationParams | undefined) => Promise<T[]>,
  params: PaginationParams
): RequestResponse<T> {
  const [data, setData] = React.useState<T[]>();
  const [offset, setOffset] = React.useState(INITIAL_OFFSET);
  const [end, setEnd] = React.useState(false);
  const displayLimit = params.limit ?? DEFAULT_LIMIT;
  const fetchLimit = displayLimit + 1;
  const [paginatedReq, setPaginatedReq] = React.useState(
    () => () =>
      requestFn({
        offset: 0,
        limit: fetchLimit,
      })
  );

  const {
    data: response,
    error,
    loading,
    request,
  } = useRequest<T[]>(paginatedReq);

  React.useEffect(() => {
    void request();
  }, [paginatedReq, request]);

  React.useEffect(() => {
    if (response && !loading) {
      setData((prev) =>
        uniqBy((prev ?? []).concat(response.slice(0, displayLimit)), "id")
      );
      if (response.length <= displayLimit) {
        setEnd(true);
      }
    }
  }, [response, displayLimit, loading]);

  React.useEffect(() => {
    if (offset) {
      setPaginatedReq(
        () => () =>
          requestFn({
            offset,
            limit: fetchLimit,
          })
      );
    }
  }, [offset, fetchLimit, requestFn]);

  const next = React.useCallback(() => {
    setOffset((prev) => prev + displayLimit);
  }, [displayLimit]);

  return { data, next, loading, error, end };
}
